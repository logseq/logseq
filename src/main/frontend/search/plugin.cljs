(ns frontend.search.plugin
  "Plugin service implementation of search protocol"
  (:require [frontend.state :as state]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.search.db :as search-db]
            [frontend.search.protocol :as protocol]
            [cljs-bean.core :as bean]))

(defn call-service!
  ([service event payload] (call-service! service event payload false))
  ([service event payload reply?]
   (when-let [^js pl (plugin-handler/get-plugin-inst (:pid service))]
     (let [{:keys [pid name]} service
           hookEvent (str "service:" event ":" name)]
       (.call (.-caller pl) hookEvent (bean/->js (merge {:graph (state/get-current-repo)} payload)))
       (when reply?
         (.once (.-caller pl) (str hookEvent ":reply")
                (fn [^js e]
                  (state/update-plugin-search-engine pid name #(assoc % :result (bean/->clj e))))))))))

(deftype Plugin [service repo]
  protocol/Engine

  (query [_this q opts]
    (prn "D:Search > Plugin Query: " service q opts)
    (call-service! service "search:query" (merge {:q q} opts) true))

  (rebuild-blocks-indice! [_this]
    (let [blocks (search-db/build-blocks-indice repo)]
      (prn "D:Search > Plugin initial indice!")
      (call-service! service "search:rebuildBlocksIndice" {:blocks blocks}))
    ())

  (transact-blocks! [_this data]
    (prn "D:Search > Plugin transact blocks! ")
    (let [{:keys [blocks-to-remove-set blocks-to-add]} data]
      (call-service! service "search:transactBlocks"
                     {:data {:added   blocks-to-add
                             :removed blocks-to-remove-set}})))

  (truncate-blocks! [_this]
    (prn "D:Search > Plugin truncate blocks!")
    (call-service! service "search:truncateBlocks" {}))

  (remove-db! [_this]
    (prn "D:Search > Plugin remove db hook!")
    (call-service! service "search:removeDb" {})))