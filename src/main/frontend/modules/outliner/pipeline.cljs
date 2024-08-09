(ns frontend.modules.outliner.pipeline
  (:require [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [datascript.core :as d]
            [frontend.handler.ui :as ui-handler]
            [frontend.util :as util]))

(defn invoke-hooks
  [{:keys [_request-id repo tx-meta tx-data deleted-block-uuids affected-keys blocks]}]
  ;; (prn :debug
  ;;      :request-id request-id
  ;;      :tx-meta tx-meta
  ;;      :tx-data tx-data)
  (let [{:keys [from-disk? new-graph? initial-pages? end?]} tx-meta
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}]
    (when (= repo (state/get-current-repo))
      (let [conn (db/get-db repo false)]
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
            (let [tx-data' (concat
                            (map
                             (fn [id]
                               [:db/retractEntity [:block/uuid id]])
                             deleted-block-uuids)
                            (if (contains? #{:create-property-text-block :insert-blocks} (:outliner-op tx-meta))
                              (let [update-blocks-fully-loaded (keep (fn [datom] (when (= :block/uuid (:a datom))
                                                                                   {:db/id (:e datom)
                                                                                    :block.temp/fully-loaded? true})) tx-data)]
                                (concat update-blocks-fully-loaded tx-data))
                              tx-data))]
              (d/transact! conn tx-data' tx-meta))

            (state/set-state! :editor/start-pos nil)

            (when-not (:graph/importing @state/state)
              (react/refresh! repo affected-keys)

              (when (and state/lsp-enabled?
                         (seq blocks)
                         (<= (count blocks) 1000))
                (state/pub-event! [:plugin/hook-db-tx
                                   {:blocks  blocks
                                    :deleted-block-uuids deleted-block-uuids
                                    :tx-data (:tx-data tx-report)
                                    :tx-meta (:tx-meta tx-report)}])))))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted repo (:deleted-page tx-meta) (:file-path tx-meta) tx-meta]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))))
