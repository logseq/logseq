(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [frontend.db.react :as react]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]))

(defn refresh-state-paths
  [affected-ids]
  (into [[:db/latest-transacted-entity-uuids :tx-id]]
        (map #(vector :db/latest-transacted-entity-uuids :entity-tx-ids %))
        affected-ids))

(defn- update-editing-block-title-if-changed!
  [tx-data]
  (when-let [editing-block (state/get-edit-block)]
    (let [editing-title (state/get-edit-content)]
      (when-let [d (some (fn [d] (when (and (= (:e d) (:db/id editing-block))
                                            (= (:a d) :block/title)
                                            (not= (string/trim editing-title) (string/trim (:v d)))
                                            (:added d))
                                   d)) tx-data)]
        (state/set-edit-content! (:v d))))))

(defn- deleted-block-db-ids
  [tx-data deleted-block-uuids]
  (let [deleted-block-uuids (set deleted-block-uuids)]
    (keep (fn [d]
            (when (and (= (:a d) :block/uuid)
                       (false? (:added d))
                       (contains? deleted-block-uuids (:v d)))
              (:e d)))
          tx-data)))

(defn- direct-response-affected-keys
  [affected-keys]
  (remove #(contains? #{:frontend.worker.react/block
                        :frontend.worker.react/journals}
                      (first %))
          affected-keys))

(defn invoke-hooks
  [{:keys [repo tx-meta tx-data deleted-block-uuids deleted-assets affected-keys pages blocks
           render-invalidated-block-uuids]}]
  (let [{:keys [initial-pages? end?]} tx-meta
        response-handled? (and (:ui/handled-by-response? tx-meta)
                               (= (:client-id tx-meta)
                                  (:client-id @state/state)))
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}
        current-block-id (state/get-current-page)]
    (when (= repo (state/get-current-repo))
      (when (seq deleted-block-uuids)
        (let [ids (deleted-block-db-ids tx-data deleted-block-uuids)]
          (state/sidebar-remove-deleted-block! ids))
        (when-let [block-id (state/get-current-page)]
          (when (and (contains? (set (map str deleted-block-uuids)) block-id)
                     (not (util/mobile?)))
            (route-handler/redirect-to-home!))))

      (cond
        initial-pages?
        (when end?
          (state/pub-event! [:init/commands])
          (ui-handler/re-render-root!))

        :else
        (do
          (when-not response-handled?
            (let [updated-blocks (vec (distinct (concat pages blocks)))
                  updated-ids (into (set render-invalidated-block-uuids)
                                    (keep :block/uuid)
                                    updated-blocks)
                  deleted-ids (set deleted-block-uuids)
                  affected-page-uuids (into (set (keep :block/uuid pages))
                                            (keep #(get-in % [:block/page :block/uuid]))
                                            blocks)
                  tx-id (:db-sync/tx-id tx-meta)]
              (outliner-tree/reconcile-resident-block-trees! updated-blocks deleted-ids)
              (state/set-state! :db/latest-transacted-entity-uuids
                                {:updated-ids updated-ids
                                 :deleted-ids deleted-ids
                                 :updated-blocks updated-blocks
                                 :affected-page-uuids affected-page-uuids
                                 :entity-tx-ids (zipmap (into updated-ids deleted-ids)
                                                        (repeat tx-id))
                                 :tx-id tx-id}
                                :changed-paths (refresh-state-paths
                                                (into updated-ids deleted-ids)))))

          (when (and current-block-id
                     (some (fn [block]
                             (and (= (str (:block/uuid block)) current-block-id)
                                  (ldb/recycled? block)))
                           blocks))
            (route-handler/redirect! {:to :home :push false}))

          (when (or (not= (:client-id tx-meta) (:client-id @state/state))
                    (= :apply-template (:outliner-op tx-meta)))
            (update-editing-block-title-if-changed! tx-data))

          ;; (when (seq deleted-assets)
          ;;   (doseq [asset deleted-assets]
          ;;     (fs/unlink! repo (path/path-join (config/get-current-repo-assets-root) (str (:block/uuid asset) "." (:ext asset))) {})))

          (state/set-state! :editor/start-pos nil)

          (when-not (:graph/importing @state/state)

            (when-not (:skip-refresh? tx-meta)
              (react/refresh! repo (if response-handled?
                                     (direct-response-affected-keys affected-keys)
                                     affected-keys)))

            (when (and state/lsp-enabled?
                       (seq blocks)
                       (<= (count blocks) 1000))
              (state/pub-event! [:plugin/hook-db-tx
                                 {:blocks  blocks
                                  :deleted-assets deleted-assets
                                  :deleted-block-uuids deleted-block-uuids
                                  :tx-data (:tx-data tx-report)
                                  :tx-meta (:tx-meta tx-report)}]))))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted (:deleted-page tx-meta) tx-meta]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))))
