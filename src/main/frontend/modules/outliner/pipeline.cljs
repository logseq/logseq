(ns frontend.modules.outliner.pipeline
  (:require [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [datascript.core :as d]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.util :as util]))

(defn- get-tx-id
  [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn- update-current-tx-editor-cursor!
  [tx-report]
  (let [tx-id (get-tx-id tx-report)
        editor-cursor @(:history/tx-before-editor-cursor @state/state)]
    (state/update-state! :history/tx->editor-cursor
                         (fn [m] (assoc-in m [tx-id :before] editor-cursor)))
    (state/set-state! :history/tx-before-editor-cursor nil)))

(defn invoke-hooks
  [{:keys [_request-id tx-meta tx-data deleted-block-uuids affected-keys blocks]}]
  ;; (prn :debug
  ;;      :request-id request-id
  ;;      :tx-meta tx-meta
  ;;      :tx-data tx-data)
  (let [{:keys [from-disk? new-graph? undo? redo? initial-pages? end?]} tx-meta
        repo (state/get-current-repo)
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}
        conn (db/get-db repo false)]
    (cond
      initial-pages?
      (do
        (util/profile "transact initial-pages" (d/transact! conn tx-data tx-meta))
        (when end?
          (state/pub-event! [:init/commands])
          (react/clear-query-state!)
          (ui-handler/re-render-root!)))

      (or from-disk? new-graph?)
      (do
        (d/transact! conn tx-data tx-meta)
        (react/clear-query-state!)
        (ui-handler/re-render-root!))

      :else
      (do
        (let [tx-data' (if (= (:outliner-op tx-meta) :insert-blocks)
                         (let [update-blocks-fully-loaded (keep (fn [datom] (when (= :block/uuid (:a datom))
                                                                              {:db/id (:e datom)
                                                                               :block.temp/fully-loaded? true})) tx-data)]
                           (concat update-blocks-fully-loaded tx-data))
                         tx-data)
              tx-report (d/transact! conn tx-data' tx-meta)]
          (when-not (or undo? redo?)
            (update-current-tx-editor-cursor! tx-report)))

        (when-not (:graph/importing @state/state)
          ;; safe to edit the next block now since other blocks (e.g. prev editing block)
          ;; has been saved to the db now
          (when-let [next-edit-block @(:editor/next-edit-block @state/state)]
            (let [{:keys [block pos]} next-edit-block]
              (editor-handler/edit-block! block pos)
              (state/set-state! :editor/next-edit-block nil)))

          (react/refresh! repo affected-keys)
          ;; (when-let [state (:ui/restore-cursor-state @state/state)]
          ;;   (when (or undo? redo?)
          ;;     (restore-cursor-and-app-state! state undo?)
          ;;     (state/set-state! :ui/restore-cursor-state nil)))

          (state/set-state! :editor/start-pos nil)

          (when (and state/lsp-enabled?
                     (seq blocks)
                     (<= (count blocks) 1000))
            (state/pub-event! [:plugin/hook-db-tx
                               {:blocks  blocks
                                :deleted-block-uuids deleted-block-uuids
                                :tx-data (:tx-data tx-report)
                                :tx-meta (:tx-meta tx-report)}])))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted repo (:deleted-page tx-meta) (:file-path tx-meta) tx-meta]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))

    (when-let [deleting-block-id (:editor/deleting-block @state/state)]
      (when (some (fn [datom] (and
                               (= :block/uuid (:a datom))
                               (= (:v datom) deleting-block-id)
                               (true? (:added datom)))) tx-data) ; editing-block was added back (could be undo or from remote sync)
        (state/set-state! :editor/deleting-block nil)))))
