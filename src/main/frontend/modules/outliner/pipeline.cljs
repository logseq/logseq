(ns frontend.modules.outliner.pipeline
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [datascript.core :as d]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.history :as history]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn store-undo-data!
  [{:keys [tx-meta] :as opts}]
  (when-not config/test?
    (when (or (:outliner/transact? tx-meta)
              (:outliner-op tx-meta)
              (:whiteboard/transact? tx-meta))
      (undo-redo/listen-db-changes! opts))))

(defn- mark-pages-as-loaded!
  [repo page-names]
  (state/update-state! [repo :unloaded-pages] #(remove page-names %)))

(defn- get-tx-id
  [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn- update-current-tx-editor-cursor!
  [tx-report]
  (let [tx-id (get-tx-id tx-report)
        editor-cursor (:ui/before-editor-cursor @state/state)]
    (state/update-state! :history/tx->editor-cursor
                         (fn [m] (assoc-in m [tx-id :before] editor-cursor)))
    (state/set-state! :ui/before-editor-cursor nil)))

(defn restore-cursor-and-app-state!
  [{:keys [editor-cursor app-state]} undo?]
  (history/restore-cursor! editor-cursor undo?)
  (history/restore-app-state! app-state))

(defn invoke-hooks
  [{:keys [request-id tx-meta tx-data deleted-block-uuids affected-keys blocks] :as opts}]
  ;; (prn :debug :request-id request-id)
  (let [{:keys [from-disk? new-graph? local-tx? undo? redo?]} tx-meta
        repo (state/get-current-repo)
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}]

    (when-let [edit-block-f (:editor/cached-edit-block-fn @state/state)]
      (edit-block-f)
      (state/set-state! :editor/cached-edit-block-fn nil))

    (let [conn (db/get-db repo false)
          tx-report (d/transact! conn tx-data tx-meta)]
      (when local-tx?
        (let [tx-id (get-tx-id tx-report)]
          (store-undo-data! (assoc opts :tx-id tx-id))))
      (when-not (or undo? redo?)
        (update-current-tx-editor-cursor! tx-report)))

    (let [pages (set (keep #(when (= :block/name (:a %)) (:v %)) tx-data))]
      (when (seq pages)
        (mark-pages-as-loaded! repo pages)))

    (if (or from-disk? new-graph?)
      (do
        (react/clear-query-state!)
        (ui-handler/re-render-root!))
      (when-not (:graph/importing @state/state)
        (react/refresh! repo tx-report affected-keys)

        (when-let [state (:ui/restore-cursor-state @state/state)]
          (when (or undo? redo?)
            (restore-cursor-and-app-state! state undo?)
            (state/set-state! :ui/restore-cursor-state nil)))

        (state/set-state! :editor/start-pos nil)

        (when (and state/lsp-enabled?
                   (seq blocks)
                   (<= (count blocks) 1000))
          (state/pub-event! [:plugin/hook-db-tx
                             {:blocks  blocks
                              :deleted-block-uuids deleted-block-uuids
                              :tx-data (:tx-data tx-report)
                              :tx-meta (:tx-meta tx-report)}]))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted repo (:deleted-page tx-meta) (:file-path tx-meta)]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))

    (when request-id
      (when-let [deferred (ldb/get-deferred-response request-id)]
        (p/resolve! deferred {:tx-meta tx-meta
                              :tx-data tx-data})
        (swap! ldb/*request-id->response dissoc request-id)))))
