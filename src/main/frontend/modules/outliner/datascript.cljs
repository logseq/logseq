(ns frontend.modules.outliner.datascript
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db :as db]
            [frontend.modules.outliner.pipeline :as pipelines]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [frontend.state :as state]
            [frontend.config :as config]
            [logseq.graph-parser.util :as gp-util]
            [lambdaisland.glogi :as log]
            [frontend.search :as search]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.file-based.property :as file-property]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [frontend.db.validate :as db-validate]))

(defn new-outliner-txs-state [] (atom []))

(defn outliner-txs-state?
  [state]
  (and
   (instance? cljs.core/Atom state)
   (coll? @state)))

(defn after-transact-pipelines
  [repo {:keys [_db-before _db-after _tx-data _tempids tx-meta] :as tx-report}]
  (when-not config/test?
    (pipelines/invoke-hooks tx-report)

    (when (or (:outliner/transact? tx-meta)
              (:whiteboard/transact? tx-meta))
      (undo-redo/listen-db-changes! tx-report))

    (search/sync-search-indice! repo tx-report)))

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

(defn update-block-refs
  [txs opts]
  (if-let [changed (:uuid-changed opts)]
    (let [{:keys [from to]} changed
          from-e (db/entity [:block/uuid from])
          to-e (db/entity [:block/uuid to])
          from-id (:db/id from-e)
          to-id (:db/id to-e)
          from-refs (:block/_refs from-e)
          from-path-refs (:block/_path-refs from-e)
          to-refs (:block/_refs to-e)
          from-refs-txs (mapcat (fn [ref]
                                  (let [id (:db/id ref)]
                                    [[:db/retract id :block/refs from-id]
                                     [:db/add id :block/refs to-id]])) from-refs)
          from-path-refs-txs (mapcat (fn [ref]
                                       (let [id (:db/id ref)]
                                         [[:db/retract id :block/path-refs from-id]
                                          [:db/add id :block/path-refs to-id]])) from-path-refs)
          to-refs-txs (mapcat (fn [ref]
                                (let [id (:db/id ref)
                                      new-content (string/replace (:block/content ref)
                                                                  (block-ref/->block-ref to)
                                                                  (block-ref/->block-ref from))]
                                  [[:db/add id :block/content new-content]])) to-refs)]
      (concat txs from-refs-txs from-path-refs-txs to-refs-txs))
    txs))

(defn replace-ref-with-content
  [txs repo opts]
  (if (and (= :delete-blocks (:outliner-op opts))
           (empty? (:uuid-changed opts)))
    (let [retracted-block-ids (->> (keep (fn [tx]
                                           (when (and (vector? tx)
                                                      (= :db.fn/retractEntity (first tx)))
                                             (second tx))) txs))
          retracted-blocks (map db/entity retracted-block-ids)
          retracted-tx (->> (for [block retracted-blocks]
                              (let [refs (:block/_refs block)]
                                (map (fn [ref]
                                       (let [id (:db/id ref)
                                             block-content (file-property/remove-properties-when-file-based
                                                            repo (:block/format block) (:block/content block))
                                             new-content (-> (:block/content ref)
                                                             (string/replace (re-pattern (util/format "(?i){{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                                                                             block-content)
                                                             (string/replace (block-ref/->block-ref (str (:block/uuid block)))
                                                                             block-content))]
                                         {:tx [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                                               [:db/retract (:db/id ref) :block/path-refs (:db/id block)]
                                               [:db/add id :block/content new-content]]
                                          :revert-tx [[:db/add (:db/id ref) :block/refs (:db/id block)]
                                                      [:db/add (:db/id ref) :block/path-refs (:db/id block)]
                                                      [:db/add id :block/content (:block/content ref)]]})) refs)))
                            (apply concat))
          retracted-tx' (mapcat :tx retracted-tx)
          revert-tx (mapcat :revert-tx retracted-tx)]
      (when (seq retracted-tx')
        (state/set-state! [:editor/last-replace-ref-content-tx (state/get-current-repo)]
                          {:retracted-block-ids retracted-block-ids
                           :revert-tx revert-tx}))
      (concat txs retracted-tx'))
    txs))

(defn validate-db!
  [{:keys [db-before db-after tx-data]}]
  (let [changed-pages (->> (filter (fn [d] (contains? #{:block/left :block/parent} (:a d))) tx-data)
                           (map :e)
                           distinct
                           (map (fn [id]
                                  (-> (or (d/entity db-after id)
                                          (d/entity db-before id))
                                      :block/page
                                      :db/id)))
                           (remove nil?)
                           (distinct))]
    (reduce
     (fn [_ page-id]
       (if-let [result (db-validate/broken-page? db-after page-id)]
         (do
           ;; TODO: revert db changes
           (assert (false? result) (str "Broken page: " result))
           (reduced false))
         true))
     true
     changed-pages)))

(defn transact!
  [txs opts before-editor-cursor]
  (let [repo (state/get-current-repo)
        db-based? (config/db-based-graph? repo)
        txs (map (fn [m] (if (map? m)
                           (cond-> m
                             true
                             (dissoc :block/children :block/meta :block/top? :block/bottom? :block/anchor
                                     :block/title :block/body :block/level :block/container :db/other-tx
                                     :block/additional-properties :block/unordered)
                             db-based?
                             (update :block/properties dissoc :id))
                           m)) txs)
        txs (remove-nil-from-transaction txs)
        txs (cond-> txs
              (:uuid-changed opts)
              (update-block-refs opts)

              (and (= :delete-blocks (:outliner-op opts))
                   (empty? (:uuid-changed opts)))
              (replace-ref-with-content repo opts)

              true
              (distinct))]
    (when (and (seq txs)
               (not (:skip-transact? opts))
               (or db-based?
                   (not (contains? (:file/unlinked-dirs @state/state)
                                   (config/get-repo-dir repo)))))

      ;; (prn :debug "Outliner transact:")
      ;; (frontend.util/pprint {:txs txs :opts opts})

      (try
        (let [repo (get opts :repo (state/get-current-repo))
              conn (conn/get-db repo false)
              rs (d/transact! conn txs (assoc opts :outliner/transact? true))
              tx-id (get-tx-id rs)]
          ;; TODO: disable this when db is stable
          (when config/dev? (validate-db! rs))
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
