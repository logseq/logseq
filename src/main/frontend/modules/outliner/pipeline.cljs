(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]
            [frontend.db :as db]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.debug :as debug]))

(defn updated-page-hook
  [page]
  (let [page (db/entity (:db/id page))
        path (:file/path (:block/file page))
        page-title (or (:block/original-name page)
                       (:block/name page))]
    (when (util/electron?)
      (debug/set-ack-step! path :start-writing)
      (debug/wait-for-write-ack! page-title path)))
  (file/sync-to-file page))

(defn invoke-hooks
  [tx-report]
  (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)]
    (doseq [p (seq pages)] (updated-page-hook p))
    (when (and state/lsp-enabled? (seq blocks))
      (state/pub-event! [:plugin/hook-db-tx
                         {:blocks  blocks
                          :tx-data (:tx-data tx-report)
                          :tx-meta (:tx-meta tx-report)}]))
    ;; TODO: Add blocks to hooks
    #_(doseq [b (seq blocks)])))
