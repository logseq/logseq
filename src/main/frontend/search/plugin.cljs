(ns frontend.search.plugin
  "Plugin service implementation of search protocol"
  (:require [frontend.state :as state]
            [frontend.handler.plugin :as plugin-handler]
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
    (call-service! service "search:query" (merge {:q q} opts) true))

  (query-page [_this q opts]
    (call-service! service "search:queryPage" (merge {:q q} opts) true))

  (rebuild-blocks-indice! [_this]
   ;; Not pushing all data for performance temporarily
   ;;(let [blocks (search-db/build-blocks-indice repo)])
    (call-service! service "search:rebuildBlocksIndice" {}))

  (transact-blocks! [_this data]
    (let [{:keys [blocks-to-remove-set blocks-to-add]} data]
      (call-service! service "search:transactBlocks"
                     {:data {:added   blocks-to-add
                             :removed blocks-to-remove-set}})))

  (transact-pages! [_this data]
    (let [{:keys [pages-to-remove-set pages-to-add]} data]
      (call-service! service "search:transactpages"
                     {:data {:added   pages-to-add
                             :removed pages-to-remove-set}})))

  (truncate-blocks! [_this]
    (call-service! service "search:truncateBlocks" {}))

  (remove-db! [_this]
    (call-service! service "search:removeDb" {})))