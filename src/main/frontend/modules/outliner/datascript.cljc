(ns frontend.modules.outliner.datascript
  #?(:clj (:require [clojure.core :as core]))
  #?(:cljs (:require-macros [frontend.modules.outliner.datascript]))
  #?(:cljs (:require [datascript.core :as d]
                     [frontend.db.conn :as conn]
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

       (when (:outliner/transact? tx-meta)
         (undo-redo/listen-outliner-operation tx-report))

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
   (defn transact!
     [txs opts]
     (let [txs (remove-nil-from-transaction txs)
           txs (map (fn [m] (if (map? m)
                              (dissoc m
                                      :block/children :block/meta :block/top? :block/bottom? :block/anchor
                                      :block/title :block/body :block/level :block/container :db/other-tx)
                              m)) txs)]
       (when (and (seq txs)
                  (not (:skip-transact? opts))
                  (not (contains? (:file/unlinked-dirs @state/state)
                                  (config/get-repo-dir (state/get-current-repo)))))
         ;; (frontend.util/pprint txs)
         (try
           (let [repo (get opts :repo (state/get-current-repo))
                 conn (conn/get-db repo false)
                 editor-cursor (state/get-current-edit-block-and-position)
                 meta (merge opts {:editor-cursor editor-cursor})
                 rs (d/transact! conn txs (assoc meta :outliner/transact? true))]
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
           (catch js/Error e
             (log/error :exception e)
             (throw e)))))))
