(ns frontend.modules.outliner.ui
  #?(:cljs (:require-macros [frontend.modules.outliner.ui]))
  #?(:cljs (:require [frontend.state :as state]
                     [frontend.db :as db]
                     [logseq.outliner.op])))

(defmacro transact!
  [opts & body]
  `(let [test?# frontend.util/node-test?]
     (when (or test?# (db/request-finished?))
       (when (nil? @(:history/tx-before-editor-cursor @state/state))
         (state/set-state! :history/tx-before-editor-cursor (state/get-current-edit-block-and-position)))
       (let [ops# frontend.modules.outliner.op/*outliner-ops*]
         (if ops#
           (do ~@body)                    ; nested transact!
           (binding [frontend.modules.outliner.op/*outliner-ops* (transient [])]
             ~@body
             (let [r# (persistent! frontend.modules.outliner.op/*outliner-ops*)
                   worker# @state/*db-worker]
               (if (and test?# (seq r#))
                 (logseq.outliner.op/apply-ops! (state/get-current-repo)
                                                (db/get-db false)
                                                r#
                                                (state/get-date-formatter)
                                                ~opts)
                 (when (and worker# (seq r#))
                   (let [request-id# (state/get-worker-next-request-id)
                         request# #(.apply-outliner-ops ^Object worker# (state/get-current-repo)
                                                        (pr-str r#)
                                                        (pr-str (assoc ~opts :request-id request-id#)))
                         response# (state/add-worker-request! request-id# request#)]

                     response#))))))))))
