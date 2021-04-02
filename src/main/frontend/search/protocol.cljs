(ns frontend.search.protocol)

(defprotocol Engine
  (query [this q])
  (rebuild-blocks-indice [this])
  (add-blocks [this blocks])
  (remove-blocks [this blocks]))
