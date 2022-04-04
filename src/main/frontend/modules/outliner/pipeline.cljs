(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]))

(defn updated-page-hook
  [page]
  (file/sync-to-file page))

(defn invoke-hooks
  [tx-report]
  (let [{:keys [pages]} (ds-report/get-blocks-and-pages tx-report)]
    (doseq [p (seq pages)] (updated-page-hook p))
    ;; TODO: Add blocks to hooks
    #_(doseq [b (seq blocks)] )))
