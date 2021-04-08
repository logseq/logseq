(ns frontend.modules.outliner.pipeline
  (:require [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [frontend.modules.outliner.file :as file]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [frontend.modules.datascript-report.core :as ds-report]))

(defn updated-block-hook
  [block])

(defn updated-page-hook
  [page]
  (file/sync-to-file page))

(defn invoke-hooks
  [tx-report]
  (let [{:keys [blocks pages]} (ds-report/get-blocks-and-pages tx-report)]
    (doseq [p (seq pages)] (updated-page-hook p))
    (doseq [b (seq blocks)] (updated-block-hook b))))

(defn after-transact-pipelines
  [{:keys [_db-before _db-after _tx-data _tempids _tx-meta] :as tx-report}]
  (invoke-hooks tx-report)
  (undo-redo/listen-outliner-operation tx-report))
