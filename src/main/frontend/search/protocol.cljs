(ns ^:no-doc frontend.search.protocol)

(defprotocol Engine
  (query [this q option]) 
  (query-page [this q option])
  (rebuild-blocks-indice! [this]) ;; TODO: rename to rebuild-indice!
  (transact-blocks! [this data])
  (truncate-blocks! [this]) ;; TODO: rename to truncate-indice!
  (transact-pages! [this data])
  (remove-db! [this]))
