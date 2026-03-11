(ns logseq.cli.transport
  "HTTP transport for communicating with db-worker-node."
  (:require ["fs" :as fs]
            ["http" :as http]
            ["https" :as https]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.cli.log :as cli-log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- request-module
  [^js parsed]
  (if (= "https:" (.-protocol parsed))
    https
    http))

(defn- base-headers
  []
  {"Content-Type" "application/json"
   "Accept" "application/json"})

(defn- request-port
  [^js parsed]
  (let [port (.-port parsed)]
    (if (seq port)
      port
      (if (= "https:" (.-protocol parsed)) 443 80))))

(defn- <raw-request
  [{:keys [method url headers body timeout-ms]}]
  (p/create
   (fn [resolve reject]
     (let [parsed (js/URL. url)
           module (request-module parsed)
           timeout-ms (or timeout-ms 10000)
           req (.request
                module
                #js {:method method
                     :hostname (.-hostname parsed)
                     :port (request-port parsed)
                     :path (str (.-pathname parsed) (.-search parsed))
                     :headers (clj->js headers)}
                (fn [^js res]
                  (let [chunks (array)]
                    (.on res "data" (fn [chunk] (.push chunks chunk)))
                    (.on res "end" (fn []
                                     (let [buf (js/Buffer.concat chunks)]
                                       (resolve {:status (.-statusCode res)
                                                 :body (.toString buf "utf8")}))))
                    (.on res "error" reject))))
           timeout-id (js/setTimeout
                       (fn []
                         (.destroy req)
                         (reject (ex-info "request timeout" {:code :timeout})))
                       timeout-ms)]
       (.on req "error" (fn [err]
                          (js/clearTimeout timeout-id)
                          (reject err)))
       (when body
         (.write req body))
       (.end req)
       (.on req "response" (fn [_]
                             (js/clearTimeout timeout-id)))))))

(defn request
  [{:keys [method url headers body timeout-ms]}]
  (p/let [response (<raw-request {:method method
                                  :url url
                                  :headers headers
                                  :body body
                                  :timeout-ms timeout-ms})]
    (if (<= 200 (:status response) 299)
      response
      (throw (ex-info "http request failed"
                      {:code :http-error
                       :status (:status response)
                       :body (:body response)})))))

(defn invoke
  [{:keys [base-url timeout-ms]}
   method direct-pass? args]
  (let [url (str (string/replace base-url #"/$" "") "/v1/invoke")
        method* (cond
                  (keyword? method) (subs (str method) 1)
                  (string? method) method
                  (nil? method) nil
                  :else (str method))
        start-ms (js/Date.now)
        args-preview (cli-log/truncate-preview args)
        payload (if direct-pass?
                  {:method method*
                   :directPass true
                   :args args}
                  {:method method*
                   :directPass false
                   :argsTransit (ldb/write-transit-str args)})
        body (js/JSON.stringify (clj->js payload))]
    (log/debug :event :cli.transport/invoke
               :method method*
               :direct-pass? direct-pass?
               :args args-preview
               :url url)
    (p/let [{:keys [body]} (request {:method "POST"
                                     :url url
                                     :headers (base-headers)
                                     :body body
                                     :timeout-ms timeout-ms})
            {:keys [result resultTransit]} (js->clj (js/JSON.parse body) :keywordize-keys true)]
      (if direct-pass?
        (let [response-preview (cli-log/truncate-preview result)]
          (log/debug :event :cli.transport/response
                     :method method*
                     :direct-pass? direct-pass?
                     :elapsed-ms (- (js/Date.now) start-ms)
                     :response response-preview)
          result)
        (let [decoded (ldb/read-transit-str resultTransit)
              response-preview (cli-log/truncate-preview decoded)]
          (log/debug :event :cli.transport/response
                     :method method*
                     :direct-pass? direct-pass?
                     :elapsed-ms (- (js/Date.now) start-ms)
                     :response response-preview)
          decoded)))))

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

(defn connect-events!
  [{:keys [base-url]} on-event]
  (let [handler (or on-event (fn [_event-type _payload] nil))
        url (js/URL. (str (string/replace (or base-url "") #"/$" "") "/v1/events"))
        buffer (atom "")
        *req (atom nil)
        *res (atom nil)
        *closed? (atom false)
        dispatch! (fn [event-text]
                    (when-let [line (data-line event-text)]
                      (try
                        (let [event-map (js->clj (js/JSON.parse line) :keywordize-keys true)
                              [event-type payload] (decode-event event-map)]
                          (when (some? event-type)
                            (handler event-type payload)))
                        (catch :default e
                          (log/debug :event :cli.transport/events-parse-failed
                                     :error e
                                     :line line)))))
        consume-chunk! (fn [chunk]
                         (swap! buffer str (.toString chunk "utf8"))
                         (loop []
                           (let [current @buffer
                                 idx (string/index-of current "\n\n")]
                             (when (some? idx)
                               (let [event-text (subs current 0 idx)
                                     rest-text (subs current (+ idx 2))]
                                 (reset! buffer rest-text)
                                 (dispatch! event-text)
                                 (recur))))))
        close! (fn []
                 (reset! *closed? true)
                 (when-let [^js res @*res]
                   (try
                     (.destroy res)
                     (catch :default _ nil)))
                 (when-let [^js req @*req]
                   (try
                     (.destroy req)
                     (catch :default _ nil)))
                 nil)]
    (try
      (let [req (.request
                 (request-module url)
                 #js {:method "GET"
                      :hostname (.-hostname url)
                      :port (request-port url)
                      :path (str (.-pathname url) (.-search url))
                      :headers (clj->js {"Accept" "text/event-stream"})}
                 (fn [^js res]
                   (reset! *res res)
                   (.on res "data"
                        (fn [chunk]
                          (when-not @*closed?
                            (consume-chunk! chunk))))
                   (.on res "error"
                        (fn [e]
                          (when-not @*closed?
                            (log/debug :event :cli.transport/events-stream-error
                                       :error e))))))]
        (reset! *req req)
        (.on req "error"
             (fn [e]
               (when-not @*closed?
                 (log/debug :event :cli.transport/events-request-error
                            :error e))))
        (.end req))
      (catch :default e
        (log/debug :event :cli.transport/events-connect-failed
                   :error e)))
    {:close! close!}))

(defn write-output
  [{:keys [format path data]}]
  (case format
    :edn
    (fs/writeFileSync path (pr-str data))

    :db
    (let [buffer (if (instance? js/Buffer data)
                   data
                   (js/Buffer.from data))]
      (fs/writeFileSync path buffer))

    :sqlite
    (let [buffer (if (instance? js/Buffer data)
                   data
                   (js/Buffer.from data))]
      (fs/writeFileSync path buffer))

    (throw (ex-info "unsupported output format" {:format format}))))

(defn read-input
  [{:keys [format path]}]
  (case format
    :edn
    (reader/read-string (.toString (fs/readFileSync path) "utf8"))

    :db
    (fs/readFileSync path)

    :sqlite
    (fs/readFileSync path)

    (throw (ex-info "unsupported input format" {:format format}))))
