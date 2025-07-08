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
            [frontend.db.file-based.model :as file-model]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.util :as common-util]
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
    (->> result
         (map (fn [[template b]]
                [template (assoc b :block/title template)]))
         (into {}))))

(defn <get-template-by-name
  [name]
  (let [repo (state/get-current-repo)]
    (p/let [templates (<get-all-templates repo)]
      (get templates name))))

(defn <get-all-properties
  "Returns all public properties as property maps including their
  :block/title and :db/ident. For file graphs the map only contains
  :block/title"
  [& {:as opts}]
  (when-let [graph (state/get-current-repo)]
    (if (config/db-based-graph? graph)
      (db-model/get-all-properties graph opts)
      (p/let [properties (file-async/<file-based-get-all-properties graph)
              hidden-properties (set (map name (property-util/hidden-properties)))]
        (remove #(hidden-properties (:block/title %)) properties)))))

(defn <file-get-property-values
  "For file graphs, returns property value names for given property name"
  [graph property]
  (when-not (config/db-based-graph? graph)
    (file-async/<get-file-based-property-values graph property)))

(defn <get-property-values
  "For db graphs, returns a vec of property value maps for given property
  db-ident.  The map contains a :label key which can be a string or number (for
  query builder) and a :value key which contains the entity or scalar property value"
  [property-id & {:as opts}]
  (when property-id
    (state/<invoke-db-worker :thread-api/get-property-values (state/get-current-repo)
                             (assoc opts :property-ident property-id))))

(defn <get-block
  [graph id-uuid-or-name & {:keys [children? skip-transact? skip-refresh? children-only? properties]
                            :or {children? true}
                            :as opts}]

  ;; (prn :debug :<get-block id-uuid-or-name :children? children? :properties properties)
  ;; (js/console.trace)
  (let [name' (str id-uuid-or-name)
        opts (assoc opts :children? children?)
        e (cond
            (number? id-uuid-or-name)
            (db/entity id-uuid-or-name)
            (util/uuid-string? name')
            (db/entity [:block/uuid (uuid name')])
            :else
            (db/get-page name'))
        id (or (and (:block/uuid e) (str (:block/uuid e)))
               (and (util/uuid-string? name') name')
               id-uuid-or-name)
        load-status (:block.temp/load-status e)]
    (cond
      (and (or (= load-status :full)
               (and (= load-status :self) (not children?) (not children-only?)))
           (not (some #{:block.temp/refs-count} properties)))
      (p/promise e)

      :else
      (->
       (p/let [result (state/<invoke-db-worker :thread-api/get-blocks graph
                                               [{:id id :opts opts}])
               {:keys [block children]} (first result)]
         (when-not skip-transact?
           (let [conn (db/get-db graph false)
                 block-and-children (if block (cons block children) children)
                 affected-keys [[:frontend.worker.react/block (:db/id block)]]
                 tx-data (->> (remove (fn [b] (:block.temp/load-status (db/entity (:db/id b)))) block-and-children)
                              (common-util/fast-remove-nils)
                              (remove empty?))]
             (when (seq tx-data) (d/transact! conn tx-data))
             (when-not skip-refresh?
               (react/refresh-affected-queries! graph affected-keys {:skip-kv-custom-keys? true}))))

         (if children-only?
           children
           (if skip-transact? block (db/entity (:db/id block)))))
       (p/catch (fn [error]
                  (js/console.error error)
                  (throw (ex-info "get-block error" {:block id-uuid-or-name}))))))))

(defn <get-blocks
  [graph ids* & {:as opts}]
  (let [ids (remove (fn [id] (:block.temp/load-status (db/entity id))) ids*)]
    (when (seq ids)
      (p/let [result (state/<invoke-db-worker :thread-api/get-blocks graph
                                              (map (fn [id]
                                                     {:id id :opts (assoc opts :children? false)})
                                                   ids))]
        (let [conn (db/get-db graph false)
              result' (map :block result)]
          (when (seq result')
            (d/transact! conn result'))
          result')))))

(defn <get-block-parents
  [graph id depth]
  (assert (integer? id))
  (when (:block/uuid (db/entity graph id))
    (p/let [result (state/<invoke-db-worker :thread-api/get-block-parents graph id depth)
            conn (db/get-db graph false)
            _ (d/transact! conn result)]
      result)))

(defn <get-block-source
  [graph id]
  (assert (integer? id))
  (p/let [source-id (state/<invoke-db-worker :thread-api/get-block-source graph id)]
    (when source-id
      (<get-block graph source-id {:children? false}))))

(defn <get-block-refs
  [graph eid]
  (assert (integer? eid))
  (p/let [result (state/<invoke-db-worker :thread-api/get-block-refs graph eid)
          conn (db/get-db graph false)
          _ (d/transact! conn result)]
    result))

(defn <get-block-refs-count
  [graph eid]
  (assert (integer? eid))
  (state/<invoke-db-worker :thread-api/get-block-refs-count graph eid))

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
                        (or [?block :logseq.property/scheduled ?n]
                            [?block :logseq.property/deadline ?n])
                        [(>= ?n ?start-time)]
                        [(<= ?n ?end-time)]
                        [?block :logseq.property/status ?status]
                        [?status :db/ident ?status-ident]
                        [(not= ?status-ident :logseq.property/status.done)]
                        [(not= ?status-ident :logseq.property/status.canceled)]]
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
                      file-model/file-graph-block-attrs))]
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

(defn <get-whiteboards
  [graph]
  (p/let [result (if (config/db-based-graph? graph)
                   (<q graph {:transact-db? false}
                       '[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/created-at :block/updated-at]) ...]
                         :where
                         [?page :block/tags :logseq.class/Whiteboard]
                         [?page :block/name]])
                   (<q graph {:transact-db? false}
                       '[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/created-at :block/updated-at]) ...]
                         :where
                         [?page :block/type "whiteboard"]
                         [?page :block/name]]))]
    (->> result
         (sort-by :block/updated-at)
         reverse)))

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
                          (fn [b] (= :logseq.property/status (:db/ident (:logseq.property.history/property b))))
                          history)]
    (when (seq status-history)
      (let [time (loop [[last-item item & others] status-history
                        time 0]
                   (if item
                     (let [last-status (:db/ident (:logseq.property.history/ref-value last-item))
                           this-status (:db/ident (:logseq.property.history/ref-value item))]
                       (if (and (= this-status :logseq.property/status.doing)
                                (empty? others))
                         (-> (+ time (- (tc/to-long (t/now)) (:block/created-at item)))
                             (quot 1000))
                         (let [time' (if (or
                                          (= last-status :logseq.property/status.doing)
                                          (and
                                           (not (contains? #{:logseq.property/status.canceled
                                                             :logseq.property/status.backlog
                                                             :logseq.property/status.done} last-status))
                                           (= this-status :logseq.property/status.done)))
                                       (+ time (- (:block/created-at item) (:block/created-at last-item)))
                                       time)]
                           (recur (cons item others) time'))))
                     (quot time 1000)))]
        [status-history time]))))
