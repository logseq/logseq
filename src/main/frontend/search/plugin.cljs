(ns frontend.search.plugin
  "Plugin service implementation of search protocol"
  (:require [frontend.state :as state]
            [frontend.search.db :as search-db]
            [frontend.search.protocol :as protocol]))

(deftype Plugin [service repo]
  protocol/Engine

  (query [_this q opts]
    (prn "D:Search > Plugin Query: " service q opts))

  (rebuild-blocks-indice! [_this]
    (let [indice (search-db/build-blocks-indice repo)]
      (prn "D:Search > Plugin initial indice!" indice))
    ())

  (transact-blocks! [_this data]
    (prn "D:Search > Plugin transact blocks! " data)
    ())

  (truncate-blocks! [_this]
    (prn "D:Search > Plugin truncate blocks!")
    ())

  (remove-db! [_this]
    (prn "D:Search > Plugin remove db hook!")
    ()))