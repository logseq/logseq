(ns frontend.modules.outliner.datascript
  #?(:clj (:require [clojure.core :as core]))
  #?(:cljs (:require-macros [frontend.modules.outliner.datascript]))
  #?(:cljs (:require [datascript.core :as d]
                     [frontend.db.conn :as conn]
                     [frontend.modules.outliner.pipeline :as pipelines]
                     [frontend.modules.editor.undo-redo :as undo-redo]
                     [frontend.state :as state]
                     [frontend.config :as config]
                     [lambdaisland.glogi :as log])))


#?(:cljs
   (defn new-outliner-txs-state [] (atom [])))

#?(:cljs
   (defn outliner-txs-state?
     [state]
     (and
       (instance? cljs.core/Atom state)
       (coll? @state))))

#?(:cljs
   (defn add-txs
     [state txs]
     (assert (outliner-txs-state? state)
       "db should be satisfied outliner-tx-state?")
     (swap! state into txs)))

#?(:cljs
   (defn after-transact-pipelines
     [{:keys [_db-before _db-after _tx-data _tempids _tx-meta] :as tx-report}]
     (pipelines/invoke-hooks tx-report)
     (undo-redo/listen-outliner-operation tx-report)))

#?(:cljs
   (defn transact!
     [txs opts]
     ;; (util/pprint txs)
     (when (and (seq txs)
                (not (:skip-transact? opts)))
       (try
         (let [conn (conn/get-conn false)
               editor-cursor (state/get-current-edit-block-and-position)
               meta (merge opts {:editor-cursor editor-cursor})
               rs (d/transact! conn txs meta)]
           (when-not config/test?
            (after-transact-pipelines rs))
          rs)
         (catch js/Error e
           (log/error :exception e)
           (throw e))))))

#?(:clj
   (defmacro auto-transact!
     "Copy from with-open.
     Automatically transact! after executing the body."
     [bindings opts & body]
     (#'core/assert-args
       (vector? bindings) "a vector for its binding"
       (even? (count bindings)) "an even number of forms in binding vector")
     (cond
       (= (count bindings) 0) `(do ~@body)
       (symbol? (bindings 0)) `(let ~(subvec bindings 0 2)
                                 (try
                                   (auto-transact! ~(subvec bindings 2) ~opts ~@body)
                                   (transact! (deref ~(bindings 0)) ~opts)))
       :else (throw (IllegalArgumentException.
                      "with-db only allows Symbols in bindings")))))
