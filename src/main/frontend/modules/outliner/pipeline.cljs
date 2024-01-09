(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.state :as state]
            [frontend.util.drawer :as drawer]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [datascript.core :as d]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.history :as history]))

(defn- reset-editing-block-content!
  [tx-data]
  (let [repo (state/get-current-repo)
        db? (config/db-based-graph? repo)]
    (when-let [edit-block (state/get-edit-block)]
      (when-let [last-datom (-> (filter (fn [datom]
                                          (and (= :block/content (:a datom))
                                               (= (:e datom) (:db/id edit-block)))) tx-data)
                                last)]
        (when-let [input (state/get-input)]
          (when (:added last-datom)
            (let [entity (db/entity (:e last-datom))
                  db-content (:block/content entity)
                  content (if db? db-content
                              (->> db-content
                                   (property-util/remove-built-in-properties (or (:block/format entity) :markdown))
                                   drawer/remove-logbook))]
              (when (not= (string/trim content)
                          (string/trim (.-value input)))
                (state/set-edit-content! input content)))))))))

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
                         (fn [m] (assoc m tx-id editor-cursor)))))

(defn restore-cursor-and-app-state!
  [{:keys [editor-cursor app-state]}]
  (history/restore-cursor! editor-cursor)
  (history/restore-app-state! app-state))

(defn invoke-hooks
  [{:keys [tx-meta tx-data deleted-block-uuids affected-keys blocks] :as opts}]
  (let [{:keys [from-disk? new-graph? local-tx? undo? redo?]} tx-meta
        repo (state/get-current-repo)
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}]

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

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted repo (:deleted-page tx-meta) (:file-path tx-meta)]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))

    (if (or from-disk? new-graph?)
      (do
        (react/clear-query-state!)
        (ui-handler/re-render-root!))
      (do
        (try
          (reset-editing-block-content! tx-data)
          (catch :default e
            (prn :reset-editing-block-content)
            (js/console.error e)))

        (when-not (:graph/importing @state/state)
          (react/refresh! repo tx-report affected-keys)

          (when-let [state (:ui/restore-cursor-state @state/state)]
            (when (or undo? redo?)
              (restore-cursor-and-app-state! state)
              (state/set-state! :ui/restore-cursor-state nil)))

          (when (and state/lsp-enabled?
                     (seq blocks)
                     (<= (count blocks) 1000))
            (state/pub-event! [:plugin/hook-db-tx
                               {:blocks  blocks
                                :deleted-block-uuids deleted-block-uuids
                                :tx-data (:tx-data tx-report)
                                :tx-meta (:tx-meta tx-report)}])))))

    (when-let [deleting-block-id (:ui/deleting-block @state/state)]
      (when (some (fn [datom] (and
                               (= :block/uuid (:a datom))
                               (= (:v datom) deleting-block-id)
                               (true? (:added datom)))) tx-data) ; editing-block was added back (could be undo or from remote sync)
        (state/set-state! :ui/deleting-block nil)))))
