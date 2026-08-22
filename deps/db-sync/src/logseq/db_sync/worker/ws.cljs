(ns logseq.db-sync.worker.ws
  (:require [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.worker.coerce :as coerce]))

(def ^:private text-encoder (js/TextEncoder.))

(defn- sse-clients [^js self]
  (or (.-sseClients self)
      (let [clients (js/Set.)]
        (set! (.-sseClients self) clients)
        clients)))

(defn- reset-frame []
  (str "event: reset\n"
       "data: " (common/write-transit {:reason "graph-changed"
                                        :snapshot-required true}) "\n\n"))

(defn- close-sse-clients! [^js self]
  (let [clients (sse-clients self)
        frame (.encode text-encoder (reset-frame))]
    (doseq [controller (js/Array.from clients)]
      (try
        (.enqueue controller frame)
        (.close controller)
        (catch :default _ nil)))
    (.clear clients)))

(defn events-response [^js self since current-t]
  (let [clients (sse-clients self)
        controller* (atom nil)
        stream (js/ReadableStream.
                #js {:start (fn [controller]
                              (reset! controller* controller)
                              (if (> current-t since)
                                (do
                                  (.enqueue controller (.encode text-encoder (reset-frame)))
                                  (.close controller))
                                (do
                                  (.add clients controller)
                                  (.enqueue controller (.encode text-encoder ": connected\n\n")))))
                     :cancel (fn []
                               (when-let [controller @controller*]
                                 (.delete clients controller)))})]
    (js/Response. stream
                  #js {:status 200
                       :headers #js {"content-type" "text/event-stream"
                                     "cache-control" "no-cache"
                                     "connection" "keep-alive"}})))

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
  (when-let [state (some-> self .-state)]
    (when (fn? (.-getWebSockets state))
      (let [clients (.getWebSockets state)]
        (doseq [ws clients]
          (when (and (not= ws sender) (ws-open? ws))
            (send! ws msg))))))
  (when (= "changed" (:type msg))
    (close-sse-clients! self)))
