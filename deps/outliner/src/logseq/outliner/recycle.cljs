(ns logseq.outliner.recycle
  "Recycle-based soft delete helpers for DB graphs"
  (:require [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.order :as db-order]))

(def ^:private recycle-page-title "Recycle")
(def retention-ms (* 60 24 3600 1000))
(def gc-interval-ms (* 24 3600 1000))

(defn recycled?
  [entity]
  (some? (:logseq.property/deleted-at entity)))

(defn- build-recycle-page-tx
  [db-id]
  (let [now (common-util/time-ms)]
    {:db/id db-id
     :block/uuid (common-uuid/gen-uuid :builtin-block-uuid recycle-page-title)
     :block/name (common-util/page-name-sanity-lc recycle-page-title)
     :block/title recycle-page-title
     :block/created-at now
     :block/updated-at now
     :logseq.property/hide? true
     :logseq.property/built-in? true}))

(defn recycle-page
  [db]
  (ldb/get-built-in-page db recycle-page-title))

(defn- ensure-recycle-page
  [db]
  (if-let [page (recycle-page db)]
    {:page page
     :page-id (:db/id page)
     :tx-data []}
    {:page nil
     :page-id "recycle-page"
     :tx-data [(build-recycle-page-tx "recycle-page")]}))

(defn- next-child-order
  [parent]
  (let [last-child (last (ldb/sort-by-order (:block/_parent parent)))]
    (db-order/gen-key (:block/order last-child) nil)))

(defn- maybe-assoc-ref
  [m k entity]
  (if (and entity (:db/id entity))
    (assoc m k (:db/id entity))
    m))

(defn- maybe-assoc
  [m k v]
  (if (some? v)
    (assoc m k v)
    m))

(defn- resolve-entity
  [db value]
  (cond
    (and value (:db/id value)) value
    (int? value) (d/entity db value)
    (vector? value) (d/entity db value)
    :else nil))

(defn- block-subtree
  [db block]
  (let [ids (cons (:db/id block)
                  (common-initial-data/get-block-full-children-ids db (:db/id block)))]
    (keep #(d/entity db %) ids)))

(defn- page-descendants
  [page]
  (loop [pages [page]
         result []]
    (if-let [page' (first pages)]
      (let [children (->> (:block/_parent page')
                          (filter ldb/page?)
                          ldb/sort-by-order)]
        (recur (concat (rest pages) children)
               (conj result page')))
      result)))

(defn- page-block-subtree-ids
  [db page]
  (->> (:block/_page page)
       ldb/sort-by-order
       (mapcat (fn [block]
                 (map :db/id (block-subtree db block))))))

(defn- page-tree-ids
  [db page]
  (->> (page-descendants page)
       (mapcat (fn [page']
                 (cons (:db/id page')
                       (page-block-subtree-ids db page'))))
       distinct))

(defn- deleted-by-id
  [db deleted-by-uuid]
  (some-> deleted-by-uuid
          (#(d/entity db [:block/uuid %]))
          :db/id))

(defn recycle-blocks-tx-data
  [db blocks {:keys [deleted-by-uuid now-ms]}]
  (let [{:keys [page page-id tx-data]} (ensure-recycle-page db)
        deleted-by-id' (deleted-by-id db deleted-by-uuid)
        now-ms (or now-ms (common-util/time-ms))
        [recycle-tx _previous-order]
        (reduce
         (fn [[txs previous-order] block]
           (let [subtree (block-subtree db block)
                 order (db-order/gen-key previous-order nil)
                 root-tx (cond-> {:db/id (:db/id block)
                                  :block/parent page-id
                                  :block/page page-id
                                  :block/order order
                                  :logseq.property/deleted-at now-ms}
                           true
                           (maybe-assoc-ref :logseq.property/deleted-by-ref (d/entity db deleted-by-id'))
                           true
                           (maybe-assoc-ref :logseq.property.recycle/original-parent (:block/parent block))
                           true
                           (maybe-assoc-ref :logseq.property.recycle/original-page (:block/page block))
                           true
                           (maybe-assoc :logseq.property.recycle/original-order (:block/order block)))
                 subtree-page-tx (map (fn [node]
                                        {:db/id (:db/id node)
                                         :block/page page-id})
                                      subtree)]
             [(into txs (cons root-tx (rest subtree-page-tx))) order]))
         [[] (some->> page :block/_parent ldb/sort-by-order last :block/order)]
         blocks)]
    (concat tx-data recycle-tx)))

(defn recycle-page-tx-data
  [db page {:keys [deleted-by-uuid now-ms]}]
  (let [{recycle-page-id :page-id
         recycle-page-tx-data :tx-data
         recycle-page-existing :page} (ensure-recycle-page db)
        deleted-by-id (deleted-by-id db deleted-by-uuid)
        now-ms (or now-ms (common-util/time-ms))]
    (concat recycle-page-tx-data
            [(cond-> {:db/id (:db/id page)
                      :block/parent recycle-page-id
                      :block/order (if recycle-page-existing
                                     (next-child-order recycle-page-existing)
                                     (db-order/gen-key nil nil))
                      :logseq.property/deleted-at now-ms}
               true
               (maybe-assoc-ref :logseq.property/deleted-by-ref (d/entity db deleted-by-id))
               true
               (maybe-assoc-ref :logseq.property.recycle/original-parent (:block/parent page))
               true
               (maybe-assoc-ref :logseq.property.recycle/original-page page)
               true
               (maybe-assoc :logseq.property.recycle/original-order (:block/order page)))])))

(defn- restore-order
  [target-parent]
  (next-child-order target-parent))

(defn- restore-target
  [db root]
  (let [original-parent (resolve-entity db (:logseq.property.recycle/original-parent root))
        original-page (resolve-entity db (:logseq.property.recycle/original-page root))
        parent-valid? (and original-parent
                           (not (recycled? original-parent))
                           (d/entity db (:db/id original-parent)))]
    (cond
      (ldb/page? root)
      {:parent (when parent-valid? original-parent)
       :page root
       :order (or (:logseq.property.recycle/original-order root)
                  (when parent-valid? (restore-order original-parent)))}

      parent-valid?
      {:parent original-parent
       :page original-page
       :order (or (:logseq.property.recycle/original-order root)
                  (restore-order original-parent))}

      (and original-page
           (d/entity db (:db/id original-page))
           (not (recycled? original-page)))
      {:parent original-page
       :page original-page
       :order (restore-order original-page)}

      :else
      nil)))

(defn restore-tx-data
  [db root]
  (when-let [{:keys [parent page order]} (restore-target db root)]
    (let [subtree (when-not (ldb/page? root)
                    (block-subtree db root))
          clear-structure [[:db/retract (:db/id root) :block/parent]
                           [:db/retract (:db/id root) :block/order]
                           (when-not (ldb/page? root)
                             [:db/retract (:db/id root) :block/page])]
          clear-meta [[:db/retract (:db/id root) :logseq.property/deleted-at]
                      [:db/retract (:db/id root) :logseq.property/deleted-by-ref]
                      [:db/retract (:db/id root) :logseq.property.recycle/original-parent]
                      [:db/retract (:db/id root) :logseq.property.recycle/original-page]
                      [:db/retract (:db/id root) :logseq.property.recycle/original-order]]
          root-tx (cond-> {:db/id (:db/id root)}
                    parent
                    (assoc :block/parent (:db/id parent))
                    order
                    (assoc :block/order order)
                    (not (ldb/page? root))
                    (assoc :block/page (:db/id page)))
          subtree-page-tx (when (seq subtree)
                            (map (fn [node]
                                   {:db/id (:db/id node)
                                    :block/page (:db/id page)})
                                 subtree))]
      (concat clear-structure [root-tx] subtree-page-tx (remove nil? clear-meta)))))

(defn restore!
  [conn root-uuid]
  (when-let [root (d/entity @conn [:block/uuid root-uuid])]
    (when-let [tx-data (seq (restore-tx-data @conn root))]
      (ldb/transact! conn tx-data {:outliner-op :restore-recycled})
      true)))

(defn gc-tx-data
  [db {:keys [now-ms] :or {now-ms (common-util/time-ms)}}]
  (let [cutoff (- now-ms retention-ms)]
    (->>
     (d/q '[:find [?e ...]
            :in $ ?cutoff
            :where
            [?e :logseq.property/deleted-at ?deleted-at]
            [(<= ?deleted-at ?cutoff)]]
          db cutoff)
     (map #(d/entity db %))
     (filter recycled?)
     (mapcat (fn [entity]
               (if (ldb/page? entity)
                 (map (fn [id] [:db/retractEntity id]) (page-tree-ids db entity))
                 (map (fn [node] [:db/retractEntity (:db/id node)]) (block-subtree db entity)))))
     distinct)))

(defn gc!
  [conn opts]
  (when-let [tx-data (seq (gc-tx-data @conn opts))]
    (ldb/transact! conn tx-data {:outliner-op :recycle-gc
                                 :persist-op? false})
    true))
