(ns frontend.persist-db.remote
  "Remote `PersistentDB` implementation for Electron renderer via db-worker-node HTTP and SSE."
  (:require [clojure.string :as string]
            [frontend.persist-db.protocol :as protocol]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- normalize-base-url
  [base-url]
  (string/replace (or base-url "") #"/$" ""))

(defn- invoke-url
  [base-url]
  (str (normalize-base-url base-url) "/v1/invoke"))

(defn- events-url
  [base-url]
  (str (normalize-base-url base-url) "/v1/events"))

(defn- base-headers
  [auth-token]
  (cond-> {"Content-Type" "application/json"
           "Accept" "application/json"}
    (seq auth-token)
    (assoc "Authorization" (str "Bearer " auth-token))))

(defn- parse-response-body
  [body]
  (cond
    (string? body) (js->clj (js/JSON.parse body) :keywordize-keys true)
    (map? body) body
    :else {}))

(defn- normalize-code
  [code]
  (cond
    (keyword? code) code
    (string? code) (keyword code)
    :else :invoke-failed))

(defn- decode-event
  [{:keys [type payload]}]
  (let [decoded (when (some? payload)
                  (try
                    (ldb/read-transit-str payload)
                    (catch :default _
                      payload)))]
    (if (and (vector? decoded)
             (= 2 (count decoded))
             (keyword? (first decoded)))
      [(first decoded) (second decoded)]
      [(when type (keyword type)) decoded])))

(defn- data-line
  [event-text]
  (some (fn [line]
          (when (string/starts-with? line "data: ")
            (subs line 6)))
        (string/split-lines event-text)))

(defn create-client
  [{:keys [fetch-fn open-sse-fn schedule-fn reconnect-delay-ms] :as opts}]
  (let [default-fetch-fn
        (fn [{:keys [method url headers body]}]
          (p/let [^js res (js/fetch url (clj->js (cond-> {:method method
                                                          :headers (or headers {})}
                                                   body (assoc :body body))))
                  text (.text res)]
            {:status (.-status res)
             :body text}))
        default-open-sse-fn
        (fn [{:keys [url on-message on-error]}]
          (if (exists? js/EventSource)
            (let [es (js/EventSource. url)]
              (set! (.-onmessage es)
                    (fn [event]
                      (when on-message
                        (on-message (str "data: " (.-data event) "\n\n")))))
              (set! (.-onerror es)
                    (fn [event]
                      (when on-error
                        (on-error event))))
              {:close! (fn []
                         (.close es))})
            {:close! (fn [] nil)}))]
  (assoc opts
         :fetch-fn (or fetch-fn default-fetch-fn)
         :open-sse-fn (or open-sse-fn default-open-sse-fn)
         :schedule-fn (or schedule-fn (fn [f delay-ms]
                                        (js/setTimeout f delay-ms)))
         :reconnect-delay-ms (or reconnect-delay-ms 1000))))

(defn invoke!
  [{:keys [base-url auth-token fetch-fn]} method direct-pass? args]
  (let [payload (js/JSON.stringify
                 (clj->js (if direct-pass?
                            {:method method
                             :directPass true
                             :args args}
                            {:method method
                             :directPass false
                             :argsTransit (ldb/write-transit-str args)})))]
    (p/let [{:keys [status body]}
            (fetch-fn {:method "POST"
                       :url (invoke-url base-url)
                       :headers (base-headers auth-token)
                       :body payload})
            parsed (parse-response-body body)]
      (if (<= 200 status 299)
        (if direct-pass?
          (:result parsed)
          (ldb/read-transit-str (:resultTransit parsed)))
        (let [error (:error parsed)]
          (throw (ex-info (or (:message error) "db-worker invoke failed")
                          (cond-> {:status status
                                   :code (normalize-code (:code error))}
                            error (assoc :error error)))))))))

(defn connect-events!
  [{:keys [base-url auth-token event-handler open-sse-fn schedule-fn reconnect-delay-ms]} wrapped-worker]
  (let [connected? (atom true)
        buffer (atom "")
        subscription (atom nil)
        dispatch! (fn [event-str]
                    (when-let [line (data-line event-str)]
                      (let [event (parse-response-body line)
                            [event-type payload] (decode-event event)]
                        (when (and event-handler event-type)
                          (event-handler event-type wrapped-worker payload)))))]
    (letfn [(open! []
              (when @connected?
                (reset! subscription
                        (open-sse-fn
                         {:url (events-url base-url)
                          :headers (base-headers auth-token)
                          :on-message (fn [chunk]
                                        (when @connected?
                                          (swap! buffer str chunk)
                                          (loop []
                                            (when-let [idx (string/index-of @buffer "\n\n")]
                                              (let [event-str (subs @buffer 0 idx)
                                                    next-buffer (subs @buffer (+ idx 2))]
                                                (reset! buffer next-buffer)
                                                (dispatch! event-str)
                                                (recur))))))
                          :on-error (fn [_error]
                                      (when @connected?
                                        (schedule-fn open! reconnect-delay-ms)))}))))]
      (open!)
      {:disconnect! (fn []
                      (reset! connected? false)
                      (when-let [close! (:close! @subscription)]
                        (close!))
                      nil)})))

(defn- method->str
  [qkw]
  (str (namespace qkw) "/" (name qkw)))

(defrecord InRemote [client wrapped-worker disconnect!]
  protocol/PersistentDB
  (<new [_this repo opts]
    (invoke! client "thread-api/create-or-open-db" false [repo opts]))

  (<list-db [_this]
    (invoke! client "thread-api/list-db" false []))

  (<unsafe-delete [_this repo]
    (invoke! client "thread-api/unsafe-unlink-db" false [repo]))

  (<release-access-handles [_this repo]
    (invoke! client "thread-api/release-access-handles" false [repo]))

  (<fetch-initial-data [_this repo opts]
    (p/let [_ (invoke! client "thread-api/create-or-open-db" false [repo opts])]
      (invoke! client "thread-api/get-initial-data" false [repo opts])))

  (<export-db [_this repo opts]
    (p/let [data (invoke! client "thread-api/export-db" true [repo])]
      (if (:return-data? opts)
        data
        data)))

  (<import-db [_this repo data]
    (invoke! client "thread-api/import-db" true [repo data])))

(defn start!
  [{:keys [base-url auth-token event-handler] :as opts}]
  (let [client (create-client (assoc opts :base-url base-url :auth-token auth-token))
        wrapped-worker (fn [qkw direct-pass? & args]
                         (invoke! client (method->str qkw) direct-pass? args))
        {:keys [disconnect!]} (connect-events! (assoc client
                                                      :event-handler event-handler
                                                      :auth-token auth-token)
                                               wrapped-worker)]
    (->InRemote client wrapped-worker disconnect!)))

(defn stop!
  [remote-client]
  (when-let [disconnect! (:disconnect! remote-client)]
    (disconnect!))
  (p/resolved true))
