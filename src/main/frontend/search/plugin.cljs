(ns frontend.search.plugin
  "Plugin service implementation of search protocol"
  (:require [frontend.state :as state]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.search.db :as search-db]
            [frontend.search.protocol :as protocol]
            [cljs-bean.core :as bean]))

(defn call-service!
  [service event payload]
  (when-let [^js pl (plugin-handler/get-plugin-inst (:pid service))]
    (.call (.-caller pl)
           (str "service:" event ":" (:name service))
           (bean/->js (merge {:graph (state/get-current-repo)} payload)))))

(deftype Plugin [service repo]
  protocol/Engine

  (query [_this q opts]
    (prn "D:Search > Plugin Query: " service q opts)
    (call-service! service "search:query" (merge {:q q} opts)))

  (rebuild-blocks-indice! [_this]
    (let [blocks (search-db/build-blocks-indice repo)]
      (prn "D:Search > Plugin initial indice!")
      (call-service! service "search:rebuildBlocksIndice" {:blocks blocks}))
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