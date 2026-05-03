(ns frontend.worker.sync.transport
  "Transport and message-shaping helpers for db sync."
  (:require
   [clojure.string :as string]
   [lambdaisland.glogi :as log]
   [logseq.db-sync.malli-schema :as db-sync-schema]
   [logseq.db.sqlite.util :as sqlite-util]))

(def invalid-coerce ::invalid-coerce)

(defn format-ws-url
  [base graph-id]
  (cond
    (string/includes? base "%s")
    (string/replace base "%s" graph-id)

    (string/ends-with? base "/")
    (str base graph-id)

    :else
    (str base "/" graph-id)))

(defn append-token
  [url token]
  (if (string? token)
    (let [separator (if (string/includes? url "?") "&" "?")]
      (str url separator "token=" (js/encodeURIComponent token)))
    url))

(defn ready-state
  [ws]
  (.-readyState ws))

(defn ws-open?
  [ws]
  (= 1 (ready-state ws)))

(defn coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn coerce-ws-client-message
  [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-client-message-coercer message {:schema :ws/client})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn coerce-ws-server-message
  [message]
  (when message
    (letfn [(uuid-like->string [value]
              (cond
                (uuid? value) (str value)
                (and (map? value) (string? (:uuid value))) (:uuid value)
                :else value))
            (normalize-legacy-tx-reject [m]
              (if (= "tx/reject" (:type m))
                (cond-> m
                  (contains? m :failed-tx-id) (update :failed-tx-id uuid-like->string)
                  (contains? m :success-tx-ids) (update :success-tx-ids
                                                        (fn [ids]
                                                          (mapv uuid-like->string (or ids [])))))
                m))]
      (let [message* (normalize-legacy-tx-reject message)
            coerced (coerce db-sync-schema/ws-server-message-coercer message* {:schema :ws/server})]
        (when-not (= coerced invalid-coerce)
          coerced)))))

(defn parse-transit
  [fail-fast-f value context]
  (try
    (sqlite-util/read-transit-str value)
    (catch :default e
      (fail-fast-f :db-sync/response-parse-failed (assoc context :error e)))))

(defn reconnect-delay-ms
  [attempt {:keys [base-delay-ms max-delay-ms jitter-ms]}]
  (let [exp (js/Math.pow 2 attempt)
        delay (min max-delay-ms (* base-delay-ms exp))
        jitter (rand-int jitter-ms)]
    (+ delay jitter)))

(defn parse-message
  [raw]
  (try
    (js->clj (js/JSON.parse raw) :keywordize-keys true)
    (catch :default _
      nil)))

(defn send!
  [coerce-ws-client-message-f ws message]
  (when (ws-open? ws)
    (if-let [coerced (coerce-ws-client-message-f message)]
      (let [message* (if (= "tx/batch" (:type coerced))
                       (update coerced :txs
                               (fn [txs]
                                 (mapv (fn [tx-entry]
                                         (if-let [tx-id (:tx-id tx-entry)]
                                           (assoc tx-entry :tx-id (str tx-id))
                                           tx-entry))
                                       txs)))
                       coerced)]
        (.send ws (js/JSON.stringify (clj->js message*))))
      (log/error :db-sync/ws-request-invalid {:message message}))))
