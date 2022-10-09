(ns ^:no-doc frontend.search.protocol)

(defprotocol Engine
  (query [this q option])
  (rebuild-blocks-indice! [this])
  (transact-blocks! [this data])
  (truncate-blocks! [this])
  (remove-db! [this]))
