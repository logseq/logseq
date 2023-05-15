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
                     [frontend.search :as search])))

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
       (let [{:keys [from to]} changed
             from-e (db/entity [:block/uuid from])
             to-e (db/entity [:block/uuid to])
             from-id (:db/id from-e)
             to-id (:db/id to-e)
             refs (:block/_refs from-e)
             path-refs (:block/_path-refs from-e)
             refs-txs (mapcat (fn [ref refs]
                             (let [id (:db/id ref)]
                               [[:db/retract id :block/refs from-id]
                                [:db/add id :block/refs to-id]])) refs)
             path-refs-txs (mapcat (fn [ref refs]
                                     (let [id (:db/id ref)]
                                       [[:db/retract id :block/path-refs from-id]
                                        [:db/add id :block/path-refs to-id]])) path-refs)]
         (concat txs refs-txs path-refs-txs))
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
           txs (update-block-refs txs opts)]
       (when (and (seq txs)
                  (not (:skip-transact? opts))
                  (not (contains? (:file/unlinked-dirs @state/state)
                                  (config/get-repo-dir (state/get-current-repo)))))

         ;; (prn "[DEBUG] Outliner transact:")
         ;; (frontend.util/pprint txs)

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
