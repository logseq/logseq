(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.fs :as fs]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.path :as path]))

(defn- update-editing-block-title-if-changed!
  [tx-data]
  (when-let [editing-block (state/get-edit-block)]
    (let [editing-title (state/get-edit-content)]
      (when-let [d (some (fn [d] (when (and (= (:e d) (:db/id editing-block))
                                            (= (:a d) :block/title)
                                            (not= (string/trim editing-title) (string/trim (:v d)))
                                            (:added d))
                                   d)) tx-data)]
        (when-let [new-title (:block/title (db/entity (:e d)))]
          (state/set-edit-content! new-title))))))

(defn invoke-hooks
  [{:keys [_request-id repo tx-meta tx-data deleted-block-uuids deleted-assets affected-keys blocks]}]
  ;; (prn :debug
  ;;      :request-id request-id
  ;;      :tx-meta tx-meta
  ;;      :tx-data tx-data)
  (let [{:keys [from-disk? new-graph? initial-pages? end?]} tx-meta
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}]
    (when (= repo (state/get-current-repo))
      (when (seq deleted-block-uuids)
        (let [ids (map (fn [id] (:db/id (db/entity [:block/uuid id]))) deleted-block-uuids)]
          (state/sidebar-remove-deleted-block! ids)))

      (when-let [conn (db/get-db repo false)]
        (cond
          initial-pages?
          (do
            (util/profile "transact initial-pages" (d/transact! conn tx-data tx-meta))
            (when end?
              (state/pub-event! [:init/commands])
              (ui-handler/re-render-root!)))

          (or from-disk? new-graph?)
          (do
            (d/transact! conn tx-data tx-meta)
            (ui-handler/re-render-root!))

          :else
          (do
            (state/set-state! :db/latest-transacted-entity-uuids
                              {:updated-ids (set (map :block/uuid blocks))
                               :deleted-ids (set deleted-block-uuids)})
            (let [tx-data' (concat
                            (map
                             (fn [id]
                               [:db/retractEntity [:block/uuid id]])
                             deleted-block-uuids)
                            (if (contains? #{:create-property-text-block :insert-blocks} (:outliner-op tx-meta))
                              (let [update-blocks-fully-loaded (keep (fn [datom] (when (= :block/uuid (:a datom))
                                                                                   {:db/id (:e datom)
                                                                                    :block.temp/load-status :self})) tx-data)]
                                (concat update-blocks-fully-loaded tx-data))
                              tx-data))]
              (d/transact! conn tx-data' tx-meta))

            (when-not (= (:client-id tx-meta) (:client-id @state/state))
              (update-editing-block-title-if-changed! tx-data))

            (when (seq deleted-assets)
              (doseq [asset deleted-assets]
                (fs/unlink! repo (path/path-join (config/get-current-repo-assets-root) (str (:block/uuid asset) "." (:ext asset))) {})))

            (state/set-state! :editor/start-pos nil)

            (when-not (:graph/importing @state/state)

              (let [edit-block-f @(:editor/edit-block-fn @state/state)
                    delete-blocks? (and (= (:outliner-op tx-meta) :delete-blocks)
                                        (:local-tx? tx-meta)
                                        (not (:mobile-action-bar? tx-meta)))]
                (state/set-state! :editor/edit-block-fn nil)
                (when delete-blocks?
                  (util/mobile-keep-keyboard-open))
                (react/refresh! repo affected-keys)
                (when edit-block-f
                  (util/schedule edit-block-f)))

              (when (and state/lsp-enabled?
                         (seq blocks)
                         (<= (count blocks) 1000))
                (state/pub-event! [:plugin/hook-db-tx
                                   {:blocks  blocks
                                    :deleted-assets deleted-assets
                                    :deleted-block-uuids deleted-block-uuids
                                    :tx-data (:tx-data tx-report)
                                    :tx-meta (:tx-meta tx-report)}])))))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted repo (:deleted-page tx-meta) (:file-path tx-meta) tx-meta]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))))
