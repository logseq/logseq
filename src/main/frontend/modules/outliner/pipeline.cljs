(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [frontend.db.subs :as db-subs]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]))

(defn- update-editing-block-title-if-changed!
  [blocks]
  (when-let [editing-block-uuid (:block/uuid (state/get-edit-block))]
    (when-let [title (:block/title (get blocks editing-block-uuid))]
      (let [editing-title (state/get-edit-content)]
        (when (not= (string/trim (or editing-title ""))
                    (string/trim title))
          (state/set-edit-content! title))))))

(defn- current-page-deleted?
  [current-page deleted]
  (and current-page
       (some #(= current-page (str %)) (keys deleted))))

(defn- current-page-recycled?
  [current-page blocks]
  (and current-page
       (some (fn [[block-uuid block]]
               (and (= current-page (str block-uuid))
                    (ldb/recycled? block)))
             blocks)))

(defn- publish-plugin-hook!
  [tx-meta {:keys [blocks deleted]}]
  (when (and state/lsp-enabled?
             (seq blocks)
             (<= (count blocks) 1000))
    (state/pub-event!
     [:plugin/hook-db-tx
      {:blocks (vec (vals blocks))
       :deleted-block-uuids (set (keys deleted))
       :tx-data []
       :tx-meta tx-meta}])))

(defn invoke-hooks
  [{:keys [repo tx-meta delta]}]
  (when delta
    (db-subs/apply-delta! delta))
  (let [{:keys [initial-pages? end?]} tx-meta
        current-page (state/get-current-page)
        blocks (:blocks delta)
        deleted (:deleted delta)]
    (when (= repo (state/get-current-repo))
      (when (and (current-page-deleted? current-page deleted)
                 (not (util/mobile?)))
        (route-handler/redirect-to-home!))

      (cond
        initial-pages?
        (when end?
          (state/pub-event! [:init/commands])
          (ui-handler/re-render-root!))

        :else
        (do
          (when (current-page-recycled? current-page blocks)
            (route-handler/redirect! {:to :home :push false}))

          (when (or (not= (:client-id tx-meta) (:client-id @state/state))
                    (= :apply-template (:outliner-op tx-meta)))
            (update-editing-block-title-if-changed! blocks))

          (state/set-state! :editor/start-pos nil)

          (when-not (:graph/importing @state/state)
            (publish-plugin-hook! tx-meta delta)))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted (:deleted-page tx-meta) tx-meta]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))))
