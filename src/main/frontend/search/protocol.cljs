(ns frontend.search.protocol
  "Search engine protocols. Interface for unifying different search result sources
   Like: app built-in search, search engine provided by plugins, etc.")

(defprotocol Engine
  (query [this q option]) 
  (query-page [this q option])
  (rebuild-blocks-indice! [this]) ;; TODO: rename to rebuild-indice!
  (transact-blocks! [this data])
  (truncate-blocks! [this]) ;; TODO: rename to truncate-indice!
  (transact-pages! [this data])
  (remove-db! [this]))
