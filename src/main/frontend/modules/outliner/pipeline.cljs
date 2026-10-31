(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [frontend.db.subs :as db-subs]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]))

(defn- editing-block-rendered-title
  "The editing block's title in the renderer store, read before a delta is applied."
  []
  (when-let [editing-block-uuid (:block/uuid (state/get-edit-block))]
    (let [{:keys [status value]} (db-subs/block-snapshot editing-block-uuid)]
      (when (= :ready status)
        (:block/title value)))))

(defn- update-editing-block-title-if-changed!
  "Puts a title the tx changed into the editor. A delta also carries the
  editing block when only its children, properties or references changed; its
  title then equals the one rendered before, and the editor keeps the text
  typed since the last save."
  [blocks title-before]
  (when-let [editing-block-uuid (:block/uuid (state/get-edit-block))]
    (when-let [title (:block/title (get blocks editing-block-uuid))]
      (let [editing-title (state/get-edit-content)]
        (when (and (not= title-before title)
                   (not= (string/trim (or editing-title ""))
                         (string/trim title)))
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
  (let [editing-title-before (editing-block-rendered-title)
        _ (when delta
            (db-subs/apply-delta! delta))
        {:keys [initial-pages? end?]} tx-meta
        current-page (state/get-current-page)
        blocks (:blocks delta)
        deleted (:deleted delta)]
    (when (= repo (state/get-current-repo))
      (let [deleted-ids (not-empty (keep :db/id (vals deleted)))
            recycled-ids (keep (fn [block]
                                 (when (and (ldb/page? block)
                                            (ldb/recycled? block))
                                   (:db/id block)))
                               (vals blocks))]
        (when deleted-ids
          (state/sidebar-remove-deleted-block! deleted-ids))
        (when-let [removed-page-ids (not-empty (concat deleted-ids recycled-ids))]
          (state/remove-pages-from-recent! removed-page-ids)))
      (when (or (current-page-deleted? current-page deleted)
                (and (not initial-pages?)
                     (current-page-recycled? current-page blocks)))
        (route-handler/redirect-to-previous!))

      (cond
        initial-pages?
        (when end?
          (state/pub-event! [:init/commands])
          (ui-handler/re-render-root!))

        :else
        (do
          (when (or (not= (:client-id tx-meta) (:client-id (state/get-state)))
                    (= :apply-template (:outliner-op tx-meta)))
            (update-editing-block-title-if-changed! blocks editing-title-before))

          (state/set-state! :editor/start-pos nil)

          (when-not (:graph/importing (state/get-state))
            (publish-plugin-hook! tx-meta delta)))))

    (when (= (:outliner-op tx-meta) :delete-page)
      (state/pub-event! [:page/deleted (:deleted-page tx-meta) tx-meta]))

    (when (= (:outliner-op tx-meta) :rename-page)
      (state/pub-event! [:page/renamed repo (:data tx-meta)]))))
