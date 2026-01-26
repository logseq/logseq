(ns logseq.db-sync.worker.ws
  (:require [lambdaisland.glogi :as log]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.worker.coerce :as coerce]))

(defn ws-open? [ws]
  (= 1 (.-readyState ws)))

(defn coerce-ws-client-message [message]
  (when message
    (let [coerced (coerce/coerce db-sync-schema/ws-client-message-coercer message {:schema :ws/client})]
      (when-not (= coerced coerce/invalid-coerce)
        coerced))))

(defn coerce-ws-server-message [message]
  (when message
    (let [coerced (coerce/coerce db-sync-schema/ws-server-message-coercer message {:schema :ws/server})]
      (when-not (= coerced coerce/invalid-coerce)
        coerced))))

(defn send! [ws msg]
  (when (ws-open? ws)
    (if-let [coerced (coerce-ws-server-message msg)]
      (.send ws (protocol/encode-message coerced))
      (do
        (log/error :db-sync/ws-response-invalid {:message msg})
        (.send ws (protocol/encode-message {:type "error" :message "server error"}))))))

(defn broadcast! [^js self sender msg]
  (let [clients (.getWebSockets (.-state self))]
    (doseq [ws clients]
      (when (and (not= ws sender) (ws-open? ws))
        (send! ws msg)))))
