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

     (def set-state-fn state/set-state!)

     (defn get-tx-id
       [tx-report]
       (get-in tx-report [:tempids :db/current-tx]))

     (defn after-transact-fn
       [tx-report opts]
       (let [tx-id (get-tx-id tx-report)]
         (state/update-state! :history/tx->editor-cursor
                              (fn [m] (assoc m tx-id (:before-editor-cursor opts)))))

          ;; update the current edit block to include full information
       (when-let [block (state/get-edit-block)]
         (when (and (:block/uuid block) (not (:db/id block)))
           (state/set-state! :editor/block (db/pull [:block/uuid (:block/uuid block)])))))))

(defmacro transact!
  [opts & body]
  `(let [transact-opts# {:repo (state/get-current-repo)
                         :conn (db/get-db false)
                         :before-editor-cursor (state/get-current-edit-block-and-position)
                         :unlinked-graph? frontend.modules.outliner.ui/unlinked-graph?
                         :set-state-fn frontend.modules.outliner.ui/set-state-fn
                         :after-transact-fn frontend.modules.outliner.ui/after-transact-fn}]
     (logseq.outliner.transaction/transact! (assoc ~opts :transact-opts transact-opts#)
                                                      ~@body)))
