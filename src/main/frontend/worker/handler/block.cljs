(ns frontend.worker.handler.block
  "Block loading, hierarchy, references, and page-window operations."
  (:require
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.common.page-window :as common-page-window]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.handler.comments :as comments]
   [frontend.worker.handler.property :as property-handler]
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
  [db block {:keys [include-collapsed-children?]}]
  (let [[large-page? children-blocks]
        (loop [pending [block]
               seen #{(:db/id block)}
               result []]
          (if (>= (count result) block-children-limit)
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
                   {:logseq.property/created-by-ref [:db/id :block/title]}]
                 (:e %))
        (d/datoms db :avet :logseq.property.reaction/target block-id)))

(def ^:private empty-render-display-properties
  {:full-properties []
   :hidden-properties []
   :description-property nil
   :class-properties-property nil})

(defn- block-refs-count
  [db block-id]
  (if (and (empty? (d/datoms db :avet :block/refs block-id))
           (empty? (d/datoms db :eavt block-id :block/alias))
           (empty? (d/datoms db :avet :block/alias block-id)))
    0
    (common-initial-data/get-block-refs-count db block-id)))

(defn- assoc-render-property-data
  ([db block block-map]
   (assoc-render-property-data db block block-map false))
  ([db block block-map refs-count?]
   (let [plain? (plain-render-block? db block)]
     (cond-> (assoc block-map
                    :block.temp/positioned-properties
                    (if plain?
                      {}
                      (block-positioned-properties-map db block))
                    :block.temp/display-properties
                    (if plain?
                      empty-render-display-properties
                      (property-handler/display-properties db block {} false))
                    :block.temp/reactions
                    (block-reactions db (:db/id block)))
       refs-count?
       (assoc :block.temp/refs-count
              (block-refs-count db (:db/id block)))))))

(defn get-block-and-children
  [db id-or-page-name {:keys [children? properties include-collapsed-children?]
                       :or {include-collapsed-children? false}}]
  (when-let [block (resolve-block-entity db id-or-page-name)]
    (let [block-refs-count? (some #{:block.temp/refs-count} properties)
          {:keys [large-page? children]} (when children?
                                           (get-block-children db block {:include-collapsed-children? include-collapsed-children?}))
          children-ids (set (map :db/id children))
          children' (when children?
                      (map (fn [child]
                             (let [collapsed? (:block/collapsed? child)]
                               (-> (assoc-render-property-data db child
                                                               (worker-plain/entity-forward-map db child {}))
                                   (assoc :block.temp/has-children? (block-has-children? db (:db/id child))
                                          :block.temp/load-status (if (and (not collapsed?)
                                                                           (or (and large-page?
                                                                                    (every? children-ids (map :db/id (direct-child-blocks db (:db/id child)))))
                                                                               (not large-page?)))
                                                                    :full
                                                                    :self)))))
                           children))
          block-map (assoc-render-property-data
                     db
                     block
                     (merge {:block/properties (property-handler/display-properties-for-block db block)}
                            (property-handler/entity-direct-map db block [:db/id :db/ident :block/uuid :block/name :block/tags])
                            (worker-plain/entity-forward-map db block {:properties properties})))
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

(def ^:private page-block-window-default-limit common-page-window/limit)
(def ^:private page-block-window-max-limit 500)

(defn- clamp-page-block-window-limit
  [limit]
  (-> (or limit page-block-window-default-limit)
      (max 1)
      (min page-block-window-max-limit)))

(defn- page-block-window-offset
  [total-count {:keys [offset limit anchor]}]
  (let [limit (clamp-page-block-window-limit limit)
        requested-offset (case anchor
                           :bottom (- total-count limit)
                           :top 0
                           (or offset 0))]
    (-> requested-offset
        (max 0)
        (min (max 0 (- total-count limit))))))

(defn- page-block-layout
  [db root]
  (let [page-id (or (property-handler/entity-direct-value db root :block/page) (:db/id root))
        block-ids (js/Set.)
        pending (array)
        !block-count (volatile! 0)
        !collapsed? (volatile! false)
        !sort-children? (volatile! false)
        children-by-parent (js/Map.)]
    (doseq [{:keys [e]} (d/datoms db :avet :block/page page-id)]
      (.add block-ids e))
    (doseq [{:keys [e]} (d/datoms db :avet :block/parent (:db/id root))
            :when (not (.has block-ids e))]
      (.push pending e))
    (loop []
      (when-let [block-id (.pop pending)]
        (when-not (.has block-ids block-id)
          (.add block-ids block-id)
          (doseq [{:keys [e]} (d/datoms db :avet :block/parent block-id)]
            (.push pending e)))
        (recur)))
    (letfn [(add-block! [block-id parent-id collapsed? order]
              (let [children (or (.get children-by-parent parent-id)
                                 (let [result (array)]
                                   (.set children-by-parent parent-id result)
                                   result))]
                (vswap! !block-count inc)
                (when collapsed?
                  (vreset! !collapsed? true))
                (.push children #js [block-id parent-id collapsed? order])))]
      (let [order-datoms (d/datoms db :avet :block/order)]
        (if (<= (* 2 (.-size block-ids)) (count order-datoms))
          (do
            (vreset! !sort-children? true)
            (doseq [block (d/pull-many db
                                       [:db/id :block/parent :block/order :block/collapsed?
                                        :block/closed-value-property :logseq.property/created-from-property]
                                       (js/Array.from block-ids))
                    :when (and (:block/order block)
                               (not (contains? block :block/closed-value-property))
                               (not (contains? block :logseq.property/created-from-property)))]
              (add-block! (:db/id block)
                          (get-in block [:block/parent :db/id])
                          (boolean (:block/collapsed? block))
                          (:block/order block))))
          (let [entry-by-block (js/Map.)
                needs-order (js/Set.)
                collapsed-blocks (js/Set.)
                property-derived-blocks (js/Set.)]
            (doseq [{:keys [e v]} (d/datoms db :aevt :block/parent)
                    :when (.has block-ids e)]
              (let [children (or (.get children-by-parent v)
                                 (let [result (array)]
                                   (.set children-by-parent v result)
                                   result))
                    entry #js [e v false nil]]
                (when (pos? (.-length children))
                  (.add needs-order (aget (aget children 0) 0))
                  (.add needs-order e))
                (.push children entry)
                (.set entry-by-block e entry)
                (vswap! !block-count inc)))
            (doseq [{:keys [e v]} (d/datoms db :aevt :block/collapsed?)
                    :when (and v (.has block-ids e))]
              (when-let [entry (.get entry-by-block e)]
                (aset entry 2 true)
                (.add collapsed-blocks e)))
            (doseq [attr [:block/closed-value-property :logseq.property/created-from-property]
                    {:keys [e]} (d/datoms db :aevt attr)
                    :when (.has block-ids e)]
              (.add property-derived-blocks e))
            (doseq [block-id (js/Array.from property-derived-blocks)]
              (when-let [entry (.get entry-by-block block-id)]
                (let [children (.get children-by-parent (aget entry 1))
                      idx (.indexOf children entry)]
                  (when (nat-int? idx)
                    (.splice children idx 1)
                    (vswap! !block-count dec)))))
            (when (some #(not (.has property-derived-blocks %))
                        (js/Array.from collapsed-blocks))
              (vreset! !collapsed? true))
            (when (pos? (.-size needs-order))
              (doseq [{:keys [e v]} order-datoms
                      :when (.has needs-order e)]
                (aset (.get entry-by-block e) 3 v))
              (doseq [children (js/Array.from (.values children-by-parent))
                      :when (> (.-length children) 1)]
                (.sort children (fn [left right]
                                  (compare (aget left 3) (aget right 3))))))))))
    (when @!sort-children?
      (doseq [children (js/Array.from (.values children-by-parent))]
        (.sort children (fn [left right]
                          (compare (aget left 3) (aget right 3))))))
    {:block-count @!block-count
     :collapsed? @!collapsed?
     :children-by-parent children-by-parent}))

(defn- flat-child-block-window
  [db root opts]
  (let [limit (clamp-page-block-window-limit (:limit opts))
        {:keys [block-count collapsed? children-by-parent]} (page-block-layout db root)
        known-total-count (when-not collapsed? block-count)
        known-total-count? (nat-int? known-total-count)
        known-offset (when known-total-count?
                       (page-block-window-offset known-total-count (assoc opts :limit limit)))
        skip-count (or known-offset 0)
        skip-end (+ skip-count limit)
        requested-offset (case (:anchor opts)
                           :bottom nil
                           :top 0
                           (max 0 (or (:offset opts) 0)))
        requested-end (some-> requested-offset (+ limit))
        tail-entries (object-array limit)
        !tail-start (volatile! 0)
        !tail-count (volatile! 0)
        !idx (volatile! 0)
        !entries (volatile! [])]
    (letfn [(done? []
              (and known-total-count?
                   (>= @!idx skip-end)))
            (visit! [block-id parent-id level]
              (let [idx @!idx]
                (vswap! !idx inc)
                (if known-total-count?
                  (when (and (>= idx skip-count)
                             (< idx skip-end))
                    (vswap! !entries conj {:block-id block-id
                                           :level level
                                           :parent-id parent-id
                                           :has-children? (.has children-by-parent block-id)}))
                  (let [entry {:block-id block-id
                               :level level
                               :parent-id parent-id
                               :has-children? (.has children-by-parent block-id)}
                        tail-count @!tail-count
                        tail-start @!tail-start
                        tail-idx (if (< tail-count limit)
                                   tail-count
                                   tail-start)]
                    (aset tail-entries tail-idx entry)
                    (if (< tail-count limit)
                      (vswap! !tail-count inc)
                      (vreset! !tail-start (mod (inc tail-start) limit)))
                    (when (and requested-offset
                               (>= idx requested-offset)
                               (< idx requested-end))
                      (vswap! !entries conj entry))))))
            (push-children! [block-stack level-stack parent-id level]
              (when-let [children (.get children-by-parent parent-id)]
                (loop [idx (dec (alength children))]
                  (when-not (neg? idx)
                    (.push block-stack (aget children idx))
                    (.push level-stack level)
                    (recur (dec idx))))))]
      (let [block-stack (array)
            level-stack (array)]
        (push-children! block-stack level-stack (:db/id root) 1)
        (loop []
          (when (and (pos? (alength block-stack)) (not (done?)))
            (let [current (.pop block-stack)
                  block-id (aget current 0)
                  parent-id (aget current 1)
                  collapsed? (aget current 2)
                  level (.pop level-stack)
                  _ (visit! block-id parent-id level)]
              (when-not collapsed?
                (push-children! block-stack level-stack block-id (inc level)))
              (recur)))))
      (let [total-count (or known-total-count @!idx)
            offset (or known-offset
                       (page-block-window-offset total-count (assoc opts :limit limit)))
            entries (cond
                      known-total-count?
                      @!entries

                      (= requested-offset offset)
                      @!entries

                      :else
                      (mapv (fn [idx]
                              (aget tail-entries (mod (+ @!tail-start idx) limit)))
                            (range @!tail-count)))
            entries (mapv (fn [{:keys [block-id] :as entry}]
                            (-> entry
                                (dissoc :block-id)
                                (assoc :block (d/entity db block-id))))
                          entries)]
        {:entries entries
         :offset offset
         :limit limit
         :total-count total-count}))))

(defn- flat-child-block-row
  [db page-summary {:keys [block level parent-id has-children?]}]
  (let [forward-map (worker-plain/entity-forward-map db block {:exclude-attrs #{:block/page :block/parent}})
        block-map (assoc-render-property-data db block forward-map true)]
    (-> block-map
        (assoc :block/level level
               :block/page page-summary
               :block/parent {:db/id parent-id}
               :block.temp/load-status :self
               :block.temp/has-children? has-children?)
        (dissoc :block/children))))

(defn- get-page-blocks-window-response
  [repo id-or-page-name opts]
  (when-let [db (some-> (worker-state/get-datascript-conn repo) deref)]
    (when-let [root (resolve-block-entity db id-or-page-name)]
      (let [{:keys [entries offset limit total-count]} (flat-child-block-window db root opts)
            page-summary (worker-plain/attribute-value->plain db :block/page (:db/id root))
            rows (mapv #(flat-child-block-row db page-summary %) entries)
            commented-block-uuids (->> (mapv :block/uuid rows)
                                       (comments/get-comment-thread-block-uuids db)
                                       set)
            rows (->> rows
                      (mapv (fn [row]
                              (assoc row
                                     :block.temp/sync-conflicts
                                     (or (client-op/get-sync-conflicts repo (:block/uuid row)) [])
                                     :block.temp/comment-thread-present?
                                     (contains? commented-block-uuids (str (:block/uuid row))))))
                      worker-plain/with-explicit-ref-fields-recursive)
            root-row (->> (assoc-render-property-data db
                                                      root
                                                      (worker-plain/entity-forward-map db root {})
                                                      true)
                          worker-plain/with-explicit-ref-fields-recursive)]
        {:root root-row
         :rows rows
         :offset offset
         :limit limit
         :total-count total-count}))))

(defn- sanitize-block-result
  [result]
  (cond-> result
    (:block result)
    (update :block common-util/remove-nils-non-nested)

    (:children result)
    (update :children common-util/fast-remove-nils)))

(defn- get-blocks-response
  [repo requests]
  (when-let [db (some-> (worker-state/get-datascript-conn repo) deref)]
    (->> requests
         (mapv (fn [{:keys [id opts]}]
                 (let [id' (if (and (string? id) (common-util/uuid-string? id)) (uuid id) id)]
                   (-> (get-block-and-children db id' opts)
                       sanitize-block-result
                       worker-plain/with-explicit-ref-fields-recursive
                       (assoc :id id)))))
         ldb/write-transit-str)))

(def-thread-api :thread-api/get-blocks
  [repo requests]
  (let [requests (ldb/read-transit-str requests)]
    (get-blocks-response repo requests)))

(def-thread-api :thread-api/get-page-blocks-window
  [repo id-or-page-name opts]
  (get-page-blocks-window-response repo id-or-page-name opts))

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
