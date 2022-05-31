(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]
            [frontend.state :as state]))

(defonce *listeners (atom {}))

(defn updated-page-hook
  [_tx-report page]
  (file/sync-to-file page))

(defn register-listener!
  [key f]
  {:pre [(keyword? key) (fn? f)]}
  (swap! *listeners assoc key f))

(defn invoke-hooks
  [tx-report]
  (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)]
    (when-not (:from-disk? (:tx-meta tx-report))
      (doseq [p (seq pages)] (updated-page-hook tx-report p)))

    (doseq [f (vals @*listeners)]
      (f (state/get-current-repo) {:tx-report tx-report
                                   :pages pages
                                   :blocks blocks}))

    (when (and state/lsp-enabled? (seq blocks))
      (state/pub-event! [:plugin/hook-db-tx
                         {:pages   pages
                          :blocks  blocks
                          :tx-data (:tx-data tx-report)
                          :tx-meta (:tx-meta tx-report)}]))))
