(ns frontend.modules.outliner.datascript
  (:require [frontend.db :as db]
            [frontend.modules.outliner.pipeline :as pipelines]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [frontend.state :as state]
            [frontend.config :as config]
            [logseq.graph-parser.util :as gp-util]
            [lambdaisland.glogi :as log]
            [clojure.string :as string]
            [frontend.util :as util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [frontend.handler.file-based.property.util :as property-util]))

(defn new-outliner-txs-state [] (atom []))

(defn outliner-txs-state?
  [state]
  (and
   (instance? cljs.core/Atom state)
   (coll? @state)))

(defn after-transact-pipelines
  [{:keys [tx-meta] :as opts}]
  (when-not config/test?
    (when-let [replace-tx-data (:replace-tx-data opts)]
      (db/transact! (:repo opts) replace-tx-data (:replace-tx-meta opts)))

    (pipelines/invoke-hooks opts)

    (when (or (:outliner/transact? tx-meta)
              (:outliner-op tx-meta)
              (:whiteboard/transact? tx-meta))
      (undo-redo/listen-db-changes! opts))))

(defn- remove-nil-from-transaction
  [txs]
  (some->> (gp-util/remove-nils txs)
           (map (fn [x]
                  (if (map? x)
                    (update-vals x (fn [v]
                                     (if (vector? v)
                                       (remove nil? v)
                                       v)))
                    x)))))

(defn get-tx-id
  [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn update-refs-and-macros
  "When a block is deleted, refs are updated and macros associated with the block are deleted"
  [txs repo opts]
  (if (= :delete-blocks (:outliner-op opts))
    (let [retracted-block-ids (->> (keep (fn [tx]
                                           (when (and (vector? tx)
                                                      (= :db.fn/retractEntity (first tx)))
                                             (second tx))) txs))
          retracted-blocks (map db/entity retracted-block-ids)
          retracted-tx (->> (for [block retracted-blocks]
                              (let [refs (:block/_refs block)]
                                (map (fn [ref]
                                       (let [id (:db/id ref)
                                             block-content (property-util/remove-properties
                                                            (:block/format block) (:block/content block))
                                             new-content (some-> (:block/content ref)
                                                                 (string/replace (re-pattern (util/format "(?i){{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                                                                                 block-content)
                                                                 (string/replace (block-ref/->block-ref (str (:block/uuid block)))
                                                                                 block-content))
                                             tx (cond->
                                                 [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                                                  [:db/retract (:db/id ref) :block/path-refs (:db/id block)]]
                                                  new-content
                                                  (conj [:db/add id :block/content new-content]))
                                             revert-tx (cond->
                                                        [[:db/add (:db/id ref) :block/refs (:db/id block)]
                                                         [:db/add (:db/id ref) :block/path-refs (:db/id block)]]
                                                         (:block/content ref)
                                                         (conj [:db/add id :block/content (:block/content ref)]))]
                                         {:tx tx :revert-tx revert-tx})) refs)))
                            (apply concat))
          retracted-tx' (mapcat :tx retracted-tx)
          revert-tx (mapcat :revert-tx retracted-tx)
          macros-tx (mapcat (fn [b]
                              ;; Only delete if last reference
                              (keep #(when (<= (count (:block/_macros (db/entity repo (:db/id %))))
                                               1)
                                       (vector :db.fn/retractEntity (:db/id %)))
                                    (:block/macros b)))
                            retracted-blocks)]
      (when (seq retracted-tx')
        (state/set-state! [:editor/last-replace-ref-content-tx (state/get-current-repo)]
                          {:retracted-block-ids retracted-block-ids
                           :revert-tx revert-tx}))
      (concat txs retracted-tx' macros-tx))
    txs))

(defn transact!
  [txs opts before-editor-cursor]
  (let [repo (state/get-current-repo)
        db-based? (config/db-based-graph? repo)
        txs (map (fn [m]
                   (if (map? m)
                     (dissoc m :block/children :block/meta :block/top? :block/bottom? :block/anchor
                             :block/title :block/body :block/level :block/container :db/other-tx
                             :block/unordered)
                     m)) txs)
        txs (remove-nil-from-transaction txs)
        txs (cond-> txs
              (= :delete-blocks (:outliner-op opts))
              (update-refs-and-macros repo opts)

              true
              (distinct))]
    (when (and (seq txs)
               (or db-based?
                   (not (contains? (:file/unlinked-dirs @state/state)
                                   (config/get-repo-dir repo)))))

      ;; (prn :debug "Outliner transact:")
      ;; (frontend.util/pprint {:txs txs :opts opts})

      (try
        (let [repo (get opts :repo (state/get-current-repo))
              rs (db/transact! repo txs (assoc opts :outliner/transact? true))
              tx-id (get-tx-id rs)]

          (state/update-state! :history/tx->editor-cursor
                               (fn [m] (assoc m tx-id before-editor-cursor)))

          ;; update the current edit block to include full information
          (when-let [block (state/get-edit-block)]
            (when (and (:block/uuid block) (not (:db/id block)))
              (state/set-state! :editor/block (db/pull [:block/uuid (:block/uuid block)]))))
          rs)
        (catch :default e
          (log/error :exception e)
          (throw e))))))
