(ns frontend.worker.handler.block
  "Block loading, hierarchy, and reference operations."
  (:require
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.handler.comments :as comments-handler]
   [frontend.worker.handler.property :as property-handler]
   [frontend.worker.handler.query :as query-handler]
   [frontend.worker.handler.search :as search-handler]
   [frontend.worker.plain-value :as worker-plain]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.client-op :as client-op]
   [logseq.common.util :as common-util]
   [logseq.db :as ldb]
   [logseq.db.common.initial-data :as common-initial-data]
   [logseq.db.common.reference :as db-reference]))

(defn- resolve-block-entity
  [db id-or-page-name]
  (let [eid (cond
              (uuid? id-or-page-name)
              [:block/uuid id-or-page-name]

              (integer? id-or-page-name)
              id-or-page-name

              (keyword? id-or-page-name)
              id-or-page-name

              :else
              nil)]
    (cond
      eid
      (d/entity db eid)

      (string? id-or-page-name)
      (if (common-util/uuid-string? id-or-page-name)
        (d/entity db [:block/uuid (uuid id-or-page-name)])
        (d/entity db (common-initial-data/get-first-page-by-name db (name id-or-page-name))))

      :else
      nil)))

(defn- block-has-children?
  [db block-id]
  (some? (first (d/datoms db :avet :block/parent block-id))))

(def ^:private block-children-limit 100)

(defn- direct-child-blocks
  ([db block-id]
   (direct-child-blocks db block-id false))
  ([db block-id reverse?]
   (let [child-ids (->> (d/datoms db :avet :block/parent block-id)
                        (map :e)
                        set)
         blocks (if (>= (count child-ids) block-children-limit)
                  (->> ((if reverse? d/rseek-datoms d/datoms) db :avet :block/order)
                       (keep (fn [datom]
                               (when (contains? child-ids (:e datom))
                                 (d/entity db (:e datom))))))
                  (cond->> child-ids
                    true (keep #(d/entity db %))
                    true ldb/sort-by-order
                    reverse? reverse))]
     (remove :block/closed-value-property blocks))))

(defn- get-block-children
  [db block {:keys [all? include-collapsed-children?]}]
  (let [[large-page? children-blocks]
        (loop [pending [block]
               seen #{(:db/id block)}
               result []]
          (if (and (not all?) (>= (count result) block-children-limit))
            [true result]
            (if-let [parent (peek pending)]
              (let [pending (pop pending)
                    expand? (or include-collapsed-children?
                                (not (true? (property-handler/entity-direct-value db parent :block/collapsed?)))
                                (some? (property-handler/entity-direct-value db parent :block/name)))
                    children (if expand?
                               (remove #(contains? seen (:db/id %))
                                       (direct-child-blocks db (:db/id parent)))
                               [])]
                (recur (into pending children)
                       (into seen (map :db/id) children)
                       (into result children)))
              [false result])))
        children-blocks (remove ldb/recycled? children-blocks)
        children (if large-page?
                   (remove ldb/recycled? (direct-child-blocks db (:db/id block)))
                   children-blocks)]
    {:large-page? large-page?
     :children (->> children
                    (remove :block/closed-value-property))}))

(defn- plain-render-block?
  [db block]
  (empty? (remove #{:block/tags}
                  (property-handler/direct-block-property-ids db (:db/id block)))))

(defn- block-positioned-properties-map
  [db block]
  (->> property-handler/render-property-positions
       (keep (fn [position]
               (let [properties (property-handler/block-positioned-properties db (:db/id block) position)]
                 (when (seq properties)
                   [position properties]))))
       (into {})))

(defn- block-reactions
  [db block-id]
  (mapv #(d/pull db
                 '[:db/id :block/uuid :logseq.property.reaction/emoji-id
                   {:logseq.property/created-by-ref [:db/id :block/uuid :block/title]}]
                 (:e %))
        (d/datoms db :avet :logseq.property.reaction/target block-id)))

(def ^:private empty-render-display-properties
  {:full-properties []
   :hidden-properties []
   :description-property nil
   :class-properties-property nil})

(defn- assoc-base-render-data
  [db block block-map]
  (cond-> (assoc block-map
                 :block.temp/reactions (block-reactions db (:db/id block)))
    (plain-render-block? db block)
    (assoc :block.temp/positioned-properties {}
           :block.temp/display-properties empty-render-display-properties)))

(defn- block-refs-count
  [db block-id]
  (if (and (empty? (d/datoms db :avet :block/refs block-id))
           (empty? (d/datoms db :eavt block-id :block/alias))
           (empty? (d/datoms db :avet :block/alias block-id)))
    0
    (common-initial-data/get-block-refs-count db block-id)))

(defn- assoc-render-property-data
  [db block block-map]
  (let [plain? (plain-render-block? db block)]
    (assoc block-map
           :block.temp/positioned-properties
           (if plain?
             {}
             (block-positioned-properties-map db block))
           :block.temp/display-properties
           (if plain?
             empty-render-display-properties
             (property-handler/display-properties db block {} false))
           :block.temp/reactions
           (block-reactions db (:db/id block)))))

(defn get-block-and-children
  [db id-or-page-name {:keys [all? children? properties render-data? root-render-data?
                              include-collapsed-children?]
                       :or {include-collapsed-children? false}}]
  (when-let [block (resolve-block-entity db id-or-page-name)]
    (let [block-refs-count? (some #{:block.temp/refs-count} properties)
          {:keys [large-page? children]} (when children?
                                           (get-block-children db block {:all? all?
                                                                         :include-collapsed-children? include-collapsed-children?}))
          children-ids (set (map :db/id children))
          children' (when children?
                      (map (fn [child]
                             (let [collapsed? (:block/collapsed? child)
                                   child-map-base (worker-plain/entity-forward-map db child {})
                                   child-map (cond
                                               render-data?
                                               (assoc-render-property-data db child child-map-base)

                                               (false? render-data?)
                                               (assoc-base-render-data db child child-map-base)

                                               :else
                                               child-map-base)]
                               (-> child-map
                                   (assoc :block.temp/has-children? (block-has-children? db (:db/id child))
                                          :block.temp/load-status (if (or all?
                                                                         (and (not collapsed?)
                                                                              (or (and large-page?
                                                                                       (every? children-ids (map :db/id (direct-child-blocks db (:db/id child)))))
                                                                                  (not large-page?))))
                                                                    :full
                                                                    :self)))))
                           children))
          block-map-base (cond-> (merge
                                  (property-handler/entity-direct-map db block [:db/id :db/ident :block/uuid :block/name :block/tags])
                                  (worker-plain/entity-forward-map db block {:properties properties}))
                           (or render-data? (empty? properties))
                           (assoc :block/properties
                                  (property-handler/display-properties-for-block db block)))
          block-map (cond
                      (or render-data? root-render-data?)
                      (assoc-render-property-data db block block-map-base)

                      (false? render-data?)
                      (assoc-base-render-data db block block-map-base)

                      :else
                      block-map-base)
          block' (cond-> (assoc block-map
                                :block/tags (or (:block/tags block-map) [])
                                :block/collapsed? (boolean (:block/collapsed? block-map)))

                   block-refs-count?
                   (assoc :block.temp/refs-count (common-initial-data/get-block-refs-count db (:db/id block)))
                   true
                   (assoc :block.temp/load-status (cond
                                                    (and children? include-collapsed-children? (empty? properties))
                                                    :full
                                                    (and children? (empty? properties))
                                                    :children
                                                    :else
                                                    :self)
                          :block.temp/has-children? (block-has-children? db (:db/id block))))]
      (cond-> {:block block'}
        children?
        (assoc :children children')))))

(defn- sanitize-block-result
  [result]
  (cond-> result
    (:block result)
    (update :block common-util/remove-nils-non-nested)

    (:children result)
    (update :children common-util/fast-remove-nils)))

(defn- result-blocks
  [{:keys [block children]}]
  (cond-> (vec children)
    block (conj block)))

(defn- assoc-block-metadata
  [db conflicts-by-block commented-block-uuids now-ms render-data? block]
  (let [block-id (:db/id block)
        block-uuid (:block/uuid block)]
    (cond-> (assoc block
                   :block.temp/refs-count (block-refs-count db block-id)
                   :block.temp/comment-thread-present?
                   (contains? commented-block-uuids (str block-uuid))
                   :block.temp/sync-conflicts
                   (vec (get conflicts-by-block block-uuid)))
      render-data?
      (assoc :block.temp/task-spent-time
             (or (query-handler/task-spent-time db block-id now-ms) [])))))

(defn- assoc-result-block-metadata
  [result db conflicts-by-block commented-block-uuids now-ms render-data? root-render-data?]
  (cond-> result
    (:block result)
    (update :block #(assoc-block-metadata db conflicts-by-block commented-block-uuids
                                          now-ms (or render-data? root-render-data?) %))

    (:children result)
    (update :children (fn [children]
                        (mapv #(assoc-block-metadata db conflicts-by-block commented-block-uuids
                                                     now-ms render-data? %)
                              children)))))

(defn- get-blocks-response
  [repo requests]
  (when-let [db (some-> (worker-state/get-datascript-conn repo) deref)]
    (let [results (mapv (fn [{:keys [id opts]}]
                          (let [id' (if (and (string? id) (common-util/uuid-string? id)) (uuid id) id)]
                            (assoc (get-block-and-children db id' opts) :id id)))
                        requests)
          metadata-blocks (->> (map vector requests results)
                               (keep (fn [[request result]]
                                       (when (get-in request [:opts :block-metadata?])
                                         (result-blocks result))))
                               (mapcat identity))
          commented-block-uuids (when (seq metadata-blocks)
                                  (->> metadata-blocks
                                       (mapv :block/uuid)
                                       (comments-handler/get-comment-thread-block-uuids db)
                                       set))
          conflicts-by-block (when (seq metadata-blocks)
                               (client-op/get-all-sync-conflicts repo))
          now-ms (common-util/time-ms)]
      (->> (mapv (fn [request result]
                   (cond-> result
                     (get-in request [:opts :block-metadata?])
                     (assoc-result-block-metadata
                      db conflicts-by-block commented-block-uuids now-ms
                      (true? (get-in request [:opts :render-data?]))
                      (true? (get-in request [:opts :root-render-data?])))))
                 requests
                 results)
           (mapv #(-> %
                      sanitize-block-result
                      worker-plain/with-explicit-ref-fields-recursive))
           ldb/write-transit-str))))

(def-thread-api :thread-api/get-blocks
  [repo requests]
  (let [requests (ldb/read-transit-str requests)]
    (get-blocks-response repo requests)))

(def-thread-api :thread-api/get-block-refs
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (->> (db-reference/get-linked-references @conn id)
         :ref-blocks
         (keep (fn [block]
                 (some-> (worker-plain/entity-forward-map @conn block {})
                         worker-plain/with-explicit-ref-fields-recursive))))))

(def-thread-api :thread-api/get-block-refs-count
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-block-refs-count @conn id)))

(def-thread-api :thread-api/get-block-source
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (:db/id (first (:block/_alias (d/entity @conn id))))))

(def-thread-api :thread-api/block-refs-check
  [repo id {:keys [unlinked?]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          block (d/entity db id)]
      (if unlinked?
        (let [title (string/lower-case (:block/title block))
              result (search-handler/search-blocks repo title {:limit 100})]
          (boolean (some (fn [candidate]
                           (let [candidate (d/entity db (:db/id candidate))]
                             (and (not= id (:db/id candidate))
                                  (not ((set (map :db/id (:block/refs candidate))) id))
                                  (string/includes? (string/lower-case (:block/title candidate)) title)))) result)))
        (some? (first (common-initial-data/get-block-refs db (:db/id block))))))))

(def-thread-api :thread-api/get-block-parents
  [repo id depth]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [block-id (:block/uuid (d/entity @conn id))]
      (->> (ldb/get-block-parents @conn block-id {:depth (or depth 3)})
           (map (fn [block]
                  (-> (into {} block)
                      (assoc :db/id (:db/id block)
                             :block/title (:block/title block)))))))))
