(ns frontend.db.async
  "Async queries"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async.util :as db-async-util]
            [frontend.db.file-based.async :as file-async]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.rules :as rules]
            [promesa.core :as p]))

(def <q db-async-util/<q)
(def <pull db-async-util/<pull)
(comment
  (def <pull-many db-async-util/<pull-many))

(defn <get-files
  [graph]
  (p/let [result (<q graph
                     {:transact-db? false}
                     '[:find [(pull ?file [:file/path :file/last-modified-at]) ...]
                       :where
                       [?file :file/path ?path]])]
    (->> result seq reverse (map #(vector (:file/path %) (or (:file/last-modified-at %) 0))))))

(defn <get-all-templates
  [graph]
  (p/let [result (<q graph
                     {:transact-db? true}
                     '[:find ?t (pull ?b [*])
                       :where
                       [?b :block/properties ?p]
                       [(get ?p :template) ?t]])]
    (into {} result)))

(defn <get-template-by-name
  [name]
  (let [repo (state/get-current-repo)]
    (p/let [templates (<get-all-templates repo)]
      (get templates name))))

(defn <db-based-get-all-properties
  "Return seq of all property names except for private built-in properties."
  [graph & {:keys [remove-built-in-property? remove-non-queryable-built-in-property?]
            :or {remove-built-in-property? true
                 remove-non-queryable-built-in-property? false}}]
  (let [result (->> (d/datoms (db/get-db graph) :avet :block/tags :logseq.class/Property)
                    (map (fn [datom] (db/entity (:e datom))))
                    (sort-by (juxt ldb/built-in? :block/title)))]
    (cond->> result
      remove-built-in-property?
      ;; remove private built-in properties
      (remove (fn [p]
                (let [ident (:db/ident p)]
                  (and (ldb/built-in? p)
                       (not (ldb/public-built-in-property? p))
                       (not= ident :logseq.property/icon)))))
      remove-non-queryable-built-in-property?
      (remove (fn [p]
                (let [ident (:db/ident p)]
                  (and (ldb/built-in? p)
                       (not (:queryable? (db-property/built-in-properties ident))))))))))

(defn <get-all-properties
  "Returns all public properties as property maps including their
  :block/title and :db/ident. For file graphs the map only contains
  :block/title"
  [& {:as opts}]
  (when-let [graph (state/get-current-repo)]
    (if (config/db-based-graph? graph)
      (<db-based-get-all-properties graph opts)
      (p/let [properties (file-async/<file-based-get-all-properties graph)
              hidden-properties (set (map name (property-util/hidden-properties)))]
        (remove #(hidden-properties (:block/title %)) properties)))))

(defn <file-get-property-values
  "For file graphs, returns property value names for given property name"
  [graph property]
  (when-not (config/db-based-graph? graph)
    (file-async/<get-file-based-property-values graph property)))

(defn <get-block-property-values
  "For db graphs, returns property value ids for given property db-ident.
   Separate from file version because values are lazy loaded"
  [graph property-id]
  (let [default-value-id (:db/id (:logseq.property/default-value (db/entity property-id)))
        empty-id (:db/id (db/entity :logseq.property/empty-placeholder))]
    (p/let [result (<q graph {:transact-db? false}
                       '[:find [?v ...]
                         :in $ ?property-id ?empty-id
                         :where
                         [?b ?property-id ?v]
                         [(not= ?v ?empty-id)]]
                       property-id
                       empty-id)]
      (if default-value-id
        ;; put default value the first
        (concat [default-value-id] result)
        result))))

(comment
  (defn <get-block-property-value-entity
    [graph property-id value]
    (p/let [result (<q graph {}
                       '[:find [(pull ?vid [*]) ...]
                         :in $ ?property-id ?value
                         :where
                         [?b ?property-id ?vid]
                         [(not= ?vid :logseq.property/empty-placeholder)]
                         (or
                          [?vid :property.value/content ?value]
                          [?vid :block/title ?value])]
                       property-id
                       value)]
      (db/entity (:db/id (first result))))))

;; TODO: batch queries for better performance and UX
(defn <get-block
  [graph name-or-uuid & {:keys [children? nested-children?]
                         :or {children? true
                              nested-children? false}
                         :as opts}]
  (let [name' (str name-or-uuid)
        *async-queries (:db/async-queries @state/state)
        async-requested? (get @*async-queries [name' opts])
        e (cond
            (number? name-or-uuid)
            (db/entity name-or-uuid)
            (util/uuid-string? name')
            (db/entity [:block/uuid (uuid name')])
            :else
            (db/get-page name'))
        id (or (and (:block/uuid e) (str (:block/uuid e)))
               (and (util/uuid-string? name') name')
               name-or-uuid)]
    (if (or (:block.temp/fully-loaded? e) async-requested?)
      e
      (when-let [^Object sqlite @db-browser/*worker]
        (swap! *async-queries assoc [name' opts] true)
        (state/update-state! :db/async-query-loading (fn [s] (conj s name')))
        (p/let [result (.get-block-and-children sqlite graph id (ldb/write-transit-str
                                                                 {:children? children?
                                                                  :nested-children? nested-children?}))
                {:keys [properties block children] :as result'} (ldb/read-transit-str result)
                conn (db/get-db graph false)
                block-and-children (concat properties [block] children)
                _ (d/transact! conn block-and-children)
                affected-keys (->> (keep :db/id block-and-children)
                                   (map #(vector :frontend.worker.react/block %)))]
          (react/refresh-affected-queries! graph affected-keys)
          (state/update-state! :db/async-query-loading (fn [s] (disj s name')))
          (if children?
            block
            result'))))))

(defn <get-block-parents
  [graph id depth]
  (assert (integer? id))
  (when-let [^Object worker @db-browser/*worker]
    (when-let [block-id (:block/uuid (db/entity graph id))]
      (state/update-state! :db/async-query-loading (fn [s] (conj s (str block-id "-parents"))))
      (p/let [result-str (.get-block-parents worker graph id depth)
              result (ldb/read-transit-str result-str)
              conn (db/get-db graph false)
              _ (d/transact! conn result)]
        (state/update-state! :db/async-query-loading (fn [s] (disj s (str block-id "-parents"))))
        result))))

(defn <get-page-all-blocks
  [page-name]
  (when-let [page (some-> page-name (db-model/get-page))]
    (when-let [^Object worker @db-browser/*worker]
      (p/let [result (.get-block-and-children worker
                                              (state/get-current-repo)
                                              (str (:block/uuid page))
                                              (ldb/write-transit-str
                                               {:children? true
                                                :nested-children? false}))]
        (some-> result (ldb/read-transit-str) (:children))))))

(defn <get-block-refs
  [graph eid]
  (assert (integer? eid))
  (when-let [^Object worker @db-browser/*worker]
    (state/update-state! :db/async-query-loading (fn [s] (conj s (str eid "-refs"))))
    (p/let [result-str (.get-block-refs worker graph eid)
            result (ldb/read-transit-str result-str)
            conn (db/get-db graph false)
            _ (d/transact! conn result)]
      (state/update-state! :db/async-query-loading (fn [s] (disj s (str eid "-refs"))))
      result)))

(defn <get-block-refs-count
  [graph eid]
  (assert (integer? eid))
  (when-let [^Object worker @db-browser/*worker]
    (.get-block-refs-count worker graph eid)))

(defn <get-all-referenced-blocks-uuid
  "Get all uuids of blocks with any back link exists."
  [graph]
  (<q graph {:transact-db? false}
      '[:find [?refed-uuid ...]
        :where
           ;; ?referee-b is block with ref towards ?refed-b
        [?refed-b   :block/uuid ?refed-uuid]
        [?referee-b :block/refs ?refed-b]]))

(defn <get-file
  [graph path]
  (when (and graph path)
    (p/let [result (<pull graph [:file/path path])]
      (:file/content result))))

(defn <get-date-scheduled-or-deadlines
  [journal-title]
  (when-let [date (date/journal-title->int journal-title)]
    (let [future-days (state/get-scheduled-future-days)
          date-format (tf/formatter "yyyyMMdd")
          current-day (tf/parse date-format (str date))
          future-date (t/plus current-day (t/days future-days))
          future-day (some->> future-date
                              (tf/unparse date-format)
                              (parse-long))
          start-time (date/journal-day->utc-ms date)
          future-time (tc/to-long future-date)]
      (when-let [repo (and future-day (state/get-current-repo))]
        (p/let [result
                (if (config/db-based-graph? repo)
                  (<q repo {}
                      '[:find [(pull ?block ?block-attrs) ...]
                        :in $ ?start-time ?end-time ?block-attrs
                        :where
                        (or [?block :logseq.task/scheduled ?n]
                            [?block :logseq.task/deadline ?n])
                        [(>= ?n ?start-time)]
                        [(<= ?n ?end-time)]
                        [?block :logseq.task/status ?status]
                        [?status :db/ident ?status-ident]
                        [(not= ?status-ident :logseq.task/status.done)]
                        [(not= ?status-ident :logseq.task/status.canceled)]]
                      start-time
                      future-time
                      '[*])
                  (<q repo {}
                      '[:find [(pull ?block ?block-attrs) ...]
                        :in $ ?day ?future ?block-attrs
                        :where
                        (or
                         [?block :block/scheduled ?d]
                         [?block :block/deadline ?d])
                        [(get-else $ ?block :block/repeated? false) ?repeated]
                        [(get-else $ ?block :block/marker "NIL") ?marker]
                        [(not= ?marker "DONE")]
                        [(not= ?marker "CANCELED")]
                        [(not= ?marker "CANCELLED")]
                        [(<= ?d ?future)]
                        (or-join [?repeated ?d ?day]
                                 [(true? ?repeated)]
                                 [(>= ?d ?day)])]
                      date
                      future-day
                      db-model/file-graph-block-attrs))]
          (->> result
               db-model/sort-by-order-recursive
               db-utils/group-by-page))))))

(defn <get-tag-pages
  [graph tag-id]
  (<q graph {:transact-db? true}
      '[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/created-at :block/updated-at])]
        :in $ ?tag-id
        :where
        [?page :block/tags ?tag-id]
        [?page :block/name]]
      tag-id))

(defn <get-property-objects
  [graph property-ident]
  (<q graph {:transact-db? true}
      '[:find [(pull ?b [*]) ...]
        :in $ % ?prop
        :where
        (has-property-or-default-value? ?b ?prop)]
      (rules/extract-rules rules/db-query-dsl-rules [:has-property-or-default-value]
                           {:deps rules/rules-dependencies})
      property-ident))

(defn <get-tag-objects
  [graph class-id]
  (let [class-children (db-model/get-structured-children graph class-id)
        class-ids (distinct (conj class-children class-id))]
    (<q graph {:transact-db? true}
        '[:find [(pull ?b [*]) ...]
          :in $ [?class-id ...]
          :where
          [?b :block/tags ?class-id]]
        class-ids)))

(defn <get-views
  [graph class-id]
  (<q graph {:transact-db? true}
      '[:find [(pull ?b [*]) ...]
        :in $ ?class-id
        :where
        [?b :logseq.property/view-for ?class-id]]
      class-id))

(defn <get-asset-with-checksum
  [graph checksum]
  (p/let [result (<q graph {:transact-db? true}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?checksum
                       :where
                       [?b :logseq.property.asset/checksum ?checksum]]
                     checksum)]
    (some-> (first result)
            :db/id
            db/entity)))

(defn <get-pdf-annotations
  [graph pdf-id]
  (p/let [result (<q graph {:transact-db? true}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?pdf-id
                       :where
                       [?b :logseq.property/asset ?pdf-id]]
                     pdf-id)]
    result))

(defn <get-block-properties-history
  [graph block-id]
  (p/let [result (<q graph {:transact-db? true}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?block-id
                       :where
                       [?b :logseq.property.history/block ?block-id]]
                     block-id)]
    (->> (sort-by :block/created-at result)
         (map (fn [b] (db/entity (:db/id b)))))))

(defn <task-spent-time
  [graph block-id]
  (p/let [history (<get-block-properties-history graph block-id)
          status-history (filter
                          (fn [b] (= :logseq.task/status (:db/ident (:logseq.property.history/property b))))
                          history)]
    (when (seq status-history)
      (let [time (loop [[last-item item & others] status-history
                        time 0]
                   (if item
                     (let [last-status (:db/ident (:logseq.property.history/ref-value last-item))
                           this-status (:db/ident (:logseq.property.history/ref-value item))]
                       (if (and (= this-status :logseq.task/status.doing)
                                (empty? others))
                         (-> (+ time (- (tc/to-long (t/now)) (:block/created-at item)))
                             (quot 1000))
                         (let [time' (if (or
                                          (= last-status :logseq.task/status.doing)
                                          (and
                                           (not (contains? #{:logseq.task/status.canceled
                                                             :logseq.task/status.backlog
                                                             :logseq.task/status.done} last-status))
                                           (= this-status :logseq.task/status.done)))
                                       (+ time (- (:block/created-at item) (:block/created-at last-item)))
                                       time)]
                           (recur (cons item others) time'))))
                     (quot time 1000)))]
        [status-history time]))))

(comment
  (defn <fetch-all-pages
    [graph]
    (when-let [^Object worker @db-browser/*worker]
      (let [db (db/get-db graph)
            exclude-ids (->> (d/datoms db :avet :block/name)
                             (map :db/id)
                             (ldb/write-transit-str))]
        (.fetch-all-pages worker graph exclude-ids)))))
