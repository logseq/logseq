(ns logseq.db-sync.parent-missing
  (:require [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))

(defn ensure-recycle-page!
  [conn]
  (let [db @conn]
    (or (ldb/get-built-in-page db common-config/recycle-page-name)
        (let [page (-> (sqlite-util/build-new-page common-config/recycle-page-name)
                       sqlite-create-graph/mark-block-as-built-in)
              {:keys [db-after]} (ldb/transact! conn [page] {:db-sync/recycle-page? true
                                                             :op :create-recycle-page})]
          (d/entity db-after [:block/uuid (:block/uuid page)])))))

(defn get-missing-parent-eids
  [{:keys [db-after tx-data]}]
  (->> tx-data
       ;; block still exists while its parent has been gone
       (filter (fn [d]
                 (and (= :block/parent (:a d))
                      (nil? (d/entity db-after (:v d)))
                      (let [block (d/entity db-after (:e d))]
                        (and (some? block)
                             (nil? (:block/parent block))
                             (not (ldb/page? block)))))))
       (map :e)
       distinct))

(defn move-blocks-to-recycle!
  [conn blocks]
  (let [recycle-page (ensure-recycle-page! conn)]
    (outliner-tx/transact!
     {:op :fix-missing-parent
      :transact-opts {:conn conn}}
     (outliner-core/move-blocks! conn blocks recycle-page {:sibling? false}))))

(defn fix-parent-missing!
  [conn tx-report]
  (when-let [missing-eids (seq (get-missing-parent-eids tx-report))]
    (let [blocks (map (fn [eid]
                        (d/entity (:db-after tx-report) eid))
                      missing-eids)]
      (move-blocks-to-recycle! conn blocks))))

(defn- parent-missing?
  [conn newly-ids [op _e a v]]
  (and (= :block/parent a)
       (= op :db/add)
       (nil? (d/entity @conn v))
       (not (contains? newly-ids (second v)))))

(defn fix-parent-missing-for-tx-data!
  [conn recycle-page-id tx-data]
  (let [newly-ids (->> tx-data
                       (keep (fn [[op _e a v]]
                               (and (= :block/uuid a)
                                    (= :db/add op)
                                    v)))
                       set)]
    (->> tx-data
         (map (fn [[op e a _v :as item]]
                (if (parent-missing? conn newly-ids item)
                  (do
                    (prn :debug :item item :new-v recycle-page-id)
                    [op e a recycle-page-id])
                  item))))))
