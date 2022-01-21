(ns frontend.modules.outliner.transaction
  (:require-macros [frontend.modules.outliner.transaction]))

(def ^:dynamic listeners
  "call listeners after every transaction,
  see also `save-transactions`"
  (volatile! []))

(defn add-listener
  [listener]
  (vswap! listeners conj listener))
