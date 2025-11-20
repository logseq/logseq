(ns frontend.worker.handler.page.file-based.delete
  "File graph page delete"
  (:require [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.graph-parser.db :as gp-db]))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false"
  [repo conn page-uuid & {:keys [persist-op? rename?]
                          :or {persist-op? true}}]
  (assert (uuid? page-uuid) (str "frontend.worker.handler.page/delete! requires page-uuid: " (if page-uuid page-uuid "nil")))
  (when (and repo page-uuid)
    (when-let [page (d/entity @conn [:block/uuid page-uuid])]
      (let [page-name (:block/name page)
            blocks (:block/_page page)
            truncate-blocks-tx-data (mapv
                                     (fn [block]
                                       [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                                     blocks)
            db @conn
            file (gp-db/get-page-file db page-name)
            file-path (:file/path file)
            delete-file-tx (when file
                             [[:db.fn/retractEntity [:file/path file-path]]])
            delete-page-tx [[:db.fn/retractEntity (:db/id page)]]
            tx-data (concat truncate-blocks-tx-data
                            delete-page-tx
                            delete-file-tx)]

        (ldb/transact! conn tx-data
                       (cond-> {:outliner-op :delete-page
                                :deleted-page (str (:block/uuid page))
                                :persist-op? persist-op?}
                         rename?
                         (assoc :real-outliner-op :rename-page)
                         file-path
                         (assoc :file-path file-path)))
        true))))
