(ns logseq.db-sync.parent-missing
  (:require [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))

(defn- ensure-recycle-page!
  [conn]
  (let [db @conn]
    (or (ldb/get-built-in-page db common-config/recycle-page-name)
        (let [page (-> (sqlite-util/build-new-page common-config/recycle-page-name)
                       sqlite-create-graph/mark-block-as-built-in)
              {:keys [db-after]} (ldb/transact! conn [page] {:db-sync/recycle-page? true
                                                             :outliner-op :create-page
                                                             :rtc/fix? true})]
          (d/entity db-after [:block/uuid (:block/uuid page)])))))

(defn get-missing-parent-datoms
  [{:keys [db-after tx-data]}]
  (->> tx-data
       ;; block still exists while its parent has been gone
       (filter (fn [d]
                 (and (= :block/parent (:a d))
                      (nil? (d/entity db-after (:v d)))
                      (let [block (d/entity db-after (:e d))]
                        (and (some? block)
                             (not (ldb/page? block)))))))))

(defn move-blocks-to-recycle!
  [conn blocks]
  (let [recycle-page (ensure-recycle-page! conn)]
    (outliner-tx/transact!
     {:persist-op? true
      :gen-undo-ops? false
      :outliner-op :fix-missing-parent
      :rtc/fix? true
      :transact-opts {:conn conn}}
     (outliner-core/move-blocks! conn blocks recycle-page {:sibling? false}))))

(defn fix-parent-missing!
  [conn tx-report]
  (let [tx-data (:tx-data tx-report)]
    (if-let [missing-parent-datoms (seq (get-missing-parent-datoms tx-report))]
      (let [blocks (map (fn [d]
                          (d/entity (:db-after tx-report) (:e d)))
                        missing-parent-datoms)
            block-ids (set (map :db/id blocks))]
        (move-blocks-to-recycle! conn blocks)
        (remove
         (fn [d]
           (and (contains? block-ids (:e d)) (= (:a d) :block/parent) (false? (:added d))))
         tx-data))
      tx-data)))
