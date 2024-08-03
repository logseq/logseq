(ns frontend.db.async
  "Async queries"
  (:require [promesa.core :as p]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.db.utils :as db-utils]
            [frontend.db.async.util :as db-async-util]
            [frontend.db.file-based.async :as file-async]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.persist-db.browser :as db-browser]
            [datascript.core :as d]
            [frontend.db.react :as react]
            [frontend.date :as date]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [logseq.db :as ldb]
            [frontend.util :as util]
            [frontend.handler.file-based.property.util :as property-util]
            [logseq.db.frontend.property :as db-property]))

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
  [graph]
  (p/let [result (<q graph
                     {:transact-db? false}
                     '[:find [(pull ?e [:block/uuid :db/ident :block/title :block/schema]) ...]
                       :where
                       [?e :block/type "property"]
                       [?e :block/title]])]
    (->> result
         ;; remove private built-in properties
         (remove #(and (:db/ident %)
                       (db-property/logseq-property? (:db/ident %))
                       (not (get-in % [:block/schema :public?])))))))

(defn <get-all-properties
  "Returns all public properties as property maps including their
  :block/title and :db/ident. For file graphs the map only contains
  :block/title"
  []
  (when-let [graph (state/get-current-repo)]
    (if (config/db-based-graph? graph)
      (<db-based-get-all-properties graph)
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
  (let [empty-id (:db/id (db/entity :logseq.property/empty-placeholder))]
    (<q graph {:transact-db? false}
        '[:find [?v ...]
          :in $ ?property-id ?empty-id
          :where
          [?b ?property-id ?v]
          [(not= ?v ?empty-id)]]
        property-id
        empty-id)))

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
                              nested-children? false}}]
  (let [name' (str name-or-uuid)
        *async-queries (:db/async-queries @state/state)
        async-requested? (get @*async-queries name')
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
        (swap! *async-queries assoc name' true)
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
          future-day (some->> (t/plus current-day (t/days future-days))
                              (tf/unparse date-format)
                              (parse-long))]
      (when future-day
        (when-let [repo (state/get-current-repo)]
          (p/let [result (<q repo {}
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
                             db-model/block-attrs)]
            (->> result
                 db-model/sort-by-order-recursive
                 db-utils/group-by-page)))))))

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
        :in $ ?property-ident
        :where
        [?b ?property-ident]]
      property-ident))

(defn <get-tag-objects
  [graph class-id]
  (let [class-children (db-model/get-class-children graph class-id)
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
        [?class-id :db/ident ?ident]
        [?b :logseq.property/view-for ?ident]]
      class-id))

(defn <get-tags
  [graph]
  (<q graph {:transact-db? false}
      '[:find [(pull ?tag [:db/id :block/title])]
        :where
        [?tag :block/type "class"]]))

(comment
  (defn <fetch-all-pages
    [graph]
    (when-let [^Object worker @db-browser/*worker]
      (let [db (db/get-db graph)
            exclude-ids (->> (d/datoms db :avet :block/name)
                             (map :db/id)
                             (ldb/write-transit-str))]
        (.fetch-all-pages worker graph exclude-ids)))))
