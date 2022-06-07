(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]
            [frontend.state :as state]))

(defn updated-page-hook
  [_tx-report page]
  (file/sync-to-file page))

(defn invoke-hooks
  [tx-report]
  (when (and (not (:from-disk? (:tx-meta tx-report)))
             (not (:new-graph? (:tx-meta tx-report))))
    (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)]
      (doseq [p (seq pages)] (updated-page-hook tx-report p))
      (when (and state/lsp-enabled? (seq blocks))
        (state/pub-event! [:plugin/hook-db-tx
                           {:blocks  blocks
                            :tx-data (:tx-data tx-report)
                            :tx-meta (:tx-meta tx-report)}])))))
