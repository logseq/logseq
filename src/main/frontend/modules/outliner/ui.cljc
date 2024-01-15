(ns frontend.modules.outliner.ui
  #?(:cljs (:require-macros [logseq.outliner.transaction]))
  #?(:cljs (:require-macros [frontend.modules.outliner.ui]))
  #?(:cljs (:require [frontend.state :as state]
                     [frontend.config :as config]
                     [frontend.db :as db])))

#?(:cljs
   (do
     (defn unlinked-graph?
       []
       (let [repo (state/get-current-repo)]
         (contains? (:file/unlinked-dirs @state/state)
                    (config/get-repo-dir repo))))

     (def set-state-fn state/set-state!)))

(defmacro transact!
  [opts & body]
  `(let [transact-opts# {:repo (state/get-current-repo)
                         :conn (db/get-db false)
                         :unlinked-graph? frontend.modules.outliner.ui/unlinked-graph?
                         :set-state-fn frontend.modules.outliner.ui/set-state-fn}]
     (when-not (:ui/before-editor-cursor @state/state)
       (state/set-state! :ui/before-editor-cursor (state/get-current-edit-block-and-position)))
     (logseq.outliner.transaction/transact! (assoc ~opts :transact-opts transact-opts#)
                                            ~@body)))
