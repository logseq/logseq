(ns frontend.modules.outliner.datascript
  #?(:clj (:require [clojure.core :as core]))
  #?(:cljs (:require-macros [frontend.modules.outliner.datascript]))
  #?(:cljs (:require [datascript.core :as d]
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
                     [frontend.util.property :as property])))

#?(:cljs
   (defn new-outliner-txs-state [] (atom [])))

#?(:cljs
   (defn outliner-txs-state?
     [state]
     (and
       (instance? cljs.core/Atom state)
       (coll? @state))))

#?(:cljs
   (defn after-transact-pipelines
     [repo {:keys [_db-before _db-after _tx-data _tempids tx-meta] :as tx-report}]
     (when-not config/test?
       (pipelines/invoke-hooks tx-report)

       (when (or (:outliner/transact? tx-meta)
                 (:whiteboard/transact? tx-meta))
         (undo-redo/listen-db-changes! tx-report))

       (search/sync-search-indice! repo tx-report))))

#?(:cljs
   (defn- remove-nil-from-transaction
     [txs]
     (some->> (gp-util/remove-nils txs)
              (map (fn [x]
                     (if (map? x)
                       (update-vals x (fn [v]
                                        (if (vector? v)
                                          (remove nil? v)
                                          v)))
                       x))))))

#?(:cljs
   (defn get-tx-id
     [tx-report]
     (get-in tx-report [:tempids :db/current-tx])))

#?(:cljs
   (defn update-block-refs
     [txs opts]
     (if-let [changed (:uuid-changed opts)]
       (let [{:keys [kept deleted]} changed
             kept-e (db/entity [:block/uuid kept])
             deleted-e (db/entity [:block/uuid deleted])
             kept-id (:db/id kept-e)
             deleted-id (:db/id deleted-e)
             kept-refs (:block/_refs kept-e)
             kept-path-refs (:block/_path-refs kept-e)
             deleted-refs (:block/_refs deleted-e)
             kept-refs-txs (mapcat (fn [ref]
                                     (let [id (:db/id ref)]
                                       [[:db/retract id :block/refs kept-id]
                                        [:db/add id :block/refs deleted-id]])) kept-refs)
             kept-path-refs-txs (mapcat (fn [ref]
                                          (let [id (:db/id ref)]
                                            [[:db/retract id :block/path-refs kept-id]
                                             [:db/add id :block/path-refs deleted-id]])) kept-path-refs)
             deleted-refs-txs (mapcat (fn [ref]
                                        (let [id (:db/id ref)
                                              new-content (string/replace (:block/content ref) (str deleted) (str kept))]
                                          [[:db/add id :block/content new-content]])) deleted-refs)]
         (concat txs kept-refs-txs kept-path-refs-txs deleted-refs-txs))
       txs)))

#?(:cljs
   (defn replace-ref-with-content
     [txs opts]
     (if (and (= :delete-blocks (:outliner-op opts))
              (not (:uuid-changed opts)))
       (let [retracted-blocks (->> (keep (fn [tx]
                                           (when (and (vector? tx)
                                                      (= :db.fn/retractEntity (first tx)))
                                             (second tx))) txs)
                                   (map db/entity))
             retracted-tx (->> (for [block retracted-blocks]
                                 (let [refs (:block/_refs block)]
                                   (mapcat (fn [ref]
                                             (let [id (:db/id ref)
                                                   block-content (property/remove-properties (:block/format block) (:block/content block))
                                                   new-content (-> (:block/content ref)
                                                                   (string/replace (re-pattern (util/format "{{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                                                                                   block-content)
                                                                   (string/replace (util/format "((%s))" (str (:block/uuid block)))
                                                                                   block-content))]
                                               [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                                                [:db/add id :block/content new-content]])) refs)))
                               (apply concat))]
         (concat txs retracted-tx))
       txs)))

#?(:cljs
   (defn transact!
     [txs opts before-editor-cursor]
     (let [txs (remove-nil-from-transaction txs)
           txs (map (fn [m] (if (map? m)
                              (dissoc m
                                      :block/children :block/meta :block/top? :block/bottom? :block/anchor
                                      :block/title :block/body :block/level :block/container :db/other-tx
                                      :block/additional-properties)
                              m)) txs)
           txs (-> (update-block-refs txs opts)
                   (replace-ref-with-content opts)
                   (distinct))]
       (when (and (seq txs)
                  (not (:skip-transact? opts))
                  (not (contains? (:file/unlinked-dirs @state/state)
                                  (config/get-repo-dir (state/get-current-repo)))))

         (prn "[DEBUG] Outliner transact:")
         (frontend.util/pprint {:txs txs :opts opts})

         (try
           (let [repo (get opts :repo (state/get-current-repo))
                 conn (conn/get-db repo false)
                 rs (d/transact! conn txs (assoc opts :outliner/transact? true))
                 tx-id (get-tx-id rs)]
             (swap! state/state assoc-in [:history/tx->editor-cursor tx-id] before-editor-cursor)

             ;; update the current edit block to include full information
             (when-let [block (state/get-edit-block)]
               (when (and (:block/uuid block) (not (:db/id block)))
                 (state/set-state! :editor/block (db/pull [:block/uuid (:block/uuid block)]))))

             (when true                 ; TODO: add debug flag
               (let [eids (distinct (mapv first (:tx-data rs)))
                     left&parent-list (->>
                                       (d/q '[:find ?e ?l ?p
                                              :in $ [?e ...]
                                              :where
                                              [?e :block/left ?l]
                                              [?e :block/parent ?p]] @conn eids)
                                       (vec)
                                       (map next))]
                 (assert (= (count left&parent-list) (count (distinct left&parent-list))) eids)))
             rs)
           (catch :default e
             (log/error :exception e)
             (throw e)))))))
