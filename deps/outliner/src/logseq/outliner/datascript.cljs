(ns logseq.outliner.datascript
  "Provides fns related to batch txs state")

(defn new-outliner-txs-state [] (atom []))

(defn outliner-txs-state?
  [state]
  (and
   (instance? cljs.core/Atom state)
   (coll? @state)))
