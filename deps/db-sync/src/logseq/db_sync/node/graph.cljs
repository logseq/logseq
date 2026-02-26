(ns logseq.db-sync.node.graph
  (:require [logseq.db-sync.node.storage :as storage]))

(defn- make-state []
  (let [sockets (atom #{})]
    #js {:getWebSockets (fn [] (to-array @sockets))
         :addWebSocket (fn [ws] (swap! sockets conj ws))
         :removeWebSocket (fn [ws] (swap! sockets disj ws))}))

(defn- env-object [cfg index-db assets-bucket]
  (doto (js-obj)
    (aset "DB" index-db)
    (aset "LOGSEQ_SYNC_ASSETS" assets-bucket)
    (aset "COGNITO_ISSUER" (:cognito-issuer cfg))
    (aset "COGNITO_CLIENT_ID" (:cognito-client-id cfg))
    (aset "COGNITO_JWKS_URL" (:cognito-jwks-url cfg))))

(defn graph-context
  [{:keys [config index-db assets-bucket]} graph-id]
  (let [{:keys [sql]} (storage/open-graph-db (:data-dir config) graph-id)
        state (make-state)
        env (env-object config index-db assets-bucket)]
    #js {:state state
         :env env
         :sql sql
         :conn nil
         :schema-ready false}))

(defn get-or-create-graph
  [registry deps graph-id]
  (or (get @registry graph-id)
      (let [ctx (graph-context deps graph-id)]
        (swap! registry assoc graph-id ctx)
        ctx)))

(defn close-graphs! [registry]
  (doseq [[_ ^js ctx] @registry]
    (when-let [^js sql (.-sql ctx)]
      (when-let [close (.-close sql)]
        (close)))))
