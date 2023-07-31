(ns frontend.search.protocol
  "Search engine protocols. Interface for unifying different search result sources
   Like: app built-in search, search engine provided by plugins, etc.")

(defprotocol Engine
  (query [this q option]) 
  (query-page [this q option])

  ;; Do a full rebuild of the index on the repo
  ;; TODO: rename to rebuild-indice!
  (rebuild-blocks-indice! [this])
  (transact-blocks! [this data])

  ;; Reseting the index to empty
  ;; TODO: rename to truncate-indice! 
  (truncate-blocks! [this])
  (transact-pages! [this data])

  ;; Invoked when the repo is removed
  (remove-db! [this]))
