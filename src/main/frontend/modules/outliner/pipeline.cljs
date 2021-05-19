(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.outliner.file :as file]
            [frontend.modules.datascript-report.core :as ds-report]
            [frontend.handler.metadata :as metadata-handler]))

(defn updated-block-hook
  [block])

(defn updated-page-hook
  [page]
  (file/sync-to-file page))

;; (defn updated-properties-hook
;;   [properties]
;;   (metadata-handler/update-properties! properties))

(defn invoke-hooks
  [tx-report]
  (let [{:keys [blocks pages properties]} (ds-report/get-blocks-and-pages tx-report)]
    (doseq [p (seq pages)] (updated-page-hook p))
    (doseq [b (seq blocks)] (updated-block-hook b))
    ;; (when (seq properties) (updated-properties-hook properties))
    ))