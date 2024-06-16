(ns frontend.modules.outliner.ui
  #?(:cljs (:require-macros [frontend.modules.outliner.ui]))
  #?(:cljs (:require [frontend.state :as state]
                     [frontend.db.transact]
                     [frontend.db.conn]
                     [logseq.outliner.op]
                     [frontend.modules.outliner.op])))

(defmacro transact!
  [opts & body]
  `(let [test?# frontend.util/node-test?]
     (let [ops# frontend.modules.outliner.op/*outliner-ops*
           editor-info# (state/get-editor-info)]
       (if ops#
         (do ~@body)                    ; nested transact!
         (binding [frontend.modules.outliner.op/*outliner-ops* (transient [])]
           ~@body
           (let [r# (persistent! frontend.modules.outliner.op/*outliner-ops*)
                 worker# @state/*db-worker]
             (if test?#
               (when (seq r#)
                 (logseq.outliner.op/apply-ops! (state/get-current-repo)
                                                (frontend.db.conn/get-db false)
                                                r#
                                                (state/get-date-formatter)
                                                ~opts))
               (when (and worker# (seq r#))
                 (let [request-id# (state/get-worker-next-request-id)
                       request# #(.apply-outliner-ops ^Object worker# (state/get-current-repo)
                                                      (pr-str r#)
                                                      (pr-str (assoc ~opts
                                                                     :request-id request-id#
                                                                     :editor-info editor-info#)))
                       response# (state/add-worker-request! request-id# request#)]

                   response#)))))))))
