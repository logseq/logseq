(ns frontend.modules.outliner.ui
  #?(:cljs (:require-macros [frontend.modules.outliner.ui]))
  #?(:cljs (:require [frontend.state]
                     [frontend.db.transact]
                     [frontend.db.conn]
                     [logseq.outliner.op]
                     [frontend.modules.outliner.op]
                     [logseq.db])))

(defmacro transact!
  [opts & body]
  `(let [test?# frontend.util/node-test?
         ops# frontend.modules.outliner.op/*outliner-ops*
         editor-info# (frontend.state/get-editor-info)]
     (reset! frontend.state/*editor-info editor-info#)
     (if ops#
       (do ~@body)                    ; nested transact!
       (binding [frontend.modules.outliner.op/*outliner-ops* (transient [])]
         ~@body
         (let [r# (persistent! frontend.modules.outliner.op/*outliner-ops*)]
            ;;  (js/console.groupCollapsed "ui/transact!")
            ;;  (prn :ops r#)
            ;;  (js/console.trace)
            ;;  (js/console.groupEnd)
           (if test?#
             (when (seq r#)
               (logseq.outliner.op/apply-ops! (frontend.state/get-current-repo)
                                              (frontend.db.conn/get-db false)
                                              r#
                                              (frontend.state/get-date-formatter)
                                              ~opts))
             (when (seq r#)
               (let [request-id# (frontend.state/get-worker-next-request-id)
                     request# #(frontend.state/<invoke-db-worker
                                :thread-api/apply-outliner-ops
                                (frontend.state/get-current-repo)
                                r#
                                (assoc ~opts
                                       :request-id request-id#
                                       :client-id (:client-id @frontend.state/state)))
                     response# (frontend.state/add-worker-request! request-id# request#)]
                 response#))))))))
