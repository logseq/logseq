(ns frontend.modules.outliner.ui
  #?(:cljs (:require-macros [frontend.modules.outliner.ui]))
  #?(:cljs (:require [frontend.state]
                     [frontend.db.conn]
                     [frontend.db.transact]
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
           (frontend.db.transact/apply-outliner-ops
            (frontend.db.conn/get-db false)
            r#
            ~opts))))))
