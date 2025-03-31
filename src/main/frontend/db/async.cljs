(ns frontend.db.async
  "Async queries"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs.cache :as cache]
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

(defn db-based-get-all-properties
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
      (db-based-get-all-properties graph opts)
      (p/let [properties (file-async/<file-based-get-all-properties graph)
              hidden-properties (set (map name (property-util/hidden-properties)))]
        (remove #(hidden-properties (:block/title %)) properties)))))

(defn <file-get-property-values
  "For file graphs, returns property value names for given property name"
  [graph property]
  (when-not (config/db-based-graph? graph)
    (file-async/<get-file-based-property-values graph property)))

(defn <get-property-values
  "For db graphs, returns property value ids for given property db-ident.
   Separate from file version because values are lazy loaded"
  [property-id & {:as opts}]
  (when property-id
    (p/let [data-str (.get-property-values ^js @state/*db-worker (state/get-current-repo)
                                           (ldb/write-transit-str (assoc opts :property-ident property-id)))]
      (ldb/read-transit-str data-str))))

(defonce *block-cache (atom (cache/lru-cache-factory {} :threshold 1000)))
(defn <get-block
  [graph id-uuid-or-name & {:keys [children? skip-transact? skip-refresh? block-only? _properties]
                            :or {children? true}
                            :as opts}]

  ;; (prn :debug :<get-block id-uuid-or-name)
  ;; (js/console.trace)

  (let [name' (str id-uuid-or-name)
        opts (assoc opts :children? children?)
        cache-key [id-uuid-or-name opts]
        cached-response (when (cache/has? @*block-cache cache-key)
                          (reset! *block-cache (cache/hit @*block-cache cache-key))
                          (get @*block-cache cache-key))
        e (cond
            (number? id-uuid-or-name)
            (db/entity id-uuid-or-name)
            (util/uuid-string? name')
            (db/entity [:block/uuid (uuid name')])
            :else
            (db/get-page name'))
        id (or (and (:block/uuid e) (str (:block/uuid e)))
               (and (util/uuid-string? name') name')
               id-uuid-or-name)]
    (cond
      (:block.temp/fully-loaded? e)
      e

      cached-response
      cached-response

      :else
      (when-let [^Object sqlite @db-browser/*worker]
        (state/update-state! :db/async-query-loading (fn [s] (conj s name')))
        (p/let [result-str (.get-blocks sqlite graph
                                        (ldb/write-transit-str
                                         [{:id id :opts opts}]))
                result (ldb/read-transit-str result-str)
                {:keys [block children] :as result'} (first result)]
          (state/update-state! :db/async-query-loading (fn [s] (disj s name')))
          (if skip-transact?
            (reset! *block-cache (cache/miss @*block-cache cache-key
                                             (if (or children? block-only?)
                                               (:block result')
                                               result')))
            (let [conn (db/get-db graph false)
                  block-and-children (cons block children)
                  affected-keys [[:frontend.worker.react/block (:db/id block)]]]
              (d/transact! conn (remove (fn [b] (:block.temp/fully-loaded? (db/entity (:db/id b)))) block-and-children))
              (when-not skip-refresh?
                (react/refresh-affected-queries! graph affected-keys))))

          (if (or children? block-only?)
            block
            result'))))))

(defn <get-blocks
  [graph ids* & {:as opts}]
  (let [ids (remove (fn [id] (:block.temp/fully-loaded? (db/entity id))) ids*)]
    (when-let [^Object sqlite @db-browser/*worker]
      (p/let [result-str (.get-blocks sqlite graph
                                      (ldb/write-transit-str
                                       (map (fn [id]
                                              {:id id :opts opts})
                                            ids)))
              result (ldb/read-transit-str result-str)]
        (let [conn (db/get-db graph false)
              data (mapcat (fn [{:keys [block children]}] (cons block children)) result)]
          (d/transact! conn data))))))

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
  (<q graph {:transact-db? false}
      '[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/created-at :block/updated-at]) ...]
        :in $ ?tag-id
        :where
        [?page :block/tags ?tag-id]
        [?page :block/name]]
      tag-id))

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
  [graph class-id view-feature-type]
  (<q graph {:transact-db? true}
      '[:find [(pull ?b [*]) ...]
        :in $ ?class-id ?view-feature-type
        :where
        [?b :logseq.property/view-for ?class-id]
        [?b :logseq.property.view/feature-type ?view-feature-type]]
      class-id
      view-feature-type))

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
