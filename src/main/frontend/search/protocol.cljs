(ns ^:no-doc frontend.search.protocol)

(defprotocol Engine
  (query [this q option])
  (rebuild-blocks-indice! [this]) ;; TODO: rename to rebuild-indice!
  (rebuild-pages-indice! [this]) ;; TODO: rename to rebuild-indice!
  (transact-blocks! [this data])
  (truncate-blocks! [this]) ;; TODO: rename to truncate-indice!
  (remove-db! [this]))
