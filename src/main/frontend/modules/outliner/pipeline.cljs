(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]
            [frontend.db :as db]))

(defn updated-block-hook
  [block])

(defn updated-page-hook
  [page]
  (let [page (db/entity (:db/id page))]
    (prn "[DEBUG] 2. Start writing file: "
         {:page-id (:db/id page)
          :page (:block/name page)
          :file (:file/path (:block/file page))}))
  (file/sync-to-file page))

(defn invoke-hooks
  [tx-report]
  (let [{:keys [blocks pages]} (ds-report/get-blocks-and-pages tx-report)]
    (doseq [p (seq pages)] (updated-page-hook p))
    (doseq [b (seq blocks)] (updated-block-hook b))))
