(ns frontend.persist-db.node
  "Node client for db-worker daemon."
  (:require [clojure.string :as string]
            [goog.object :as gobj]
            [frontend.persist-db.protocol :as protocol]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- node-runtime?
  []
  (and (exists? js/process)
       (not (exists? js/window))))

(defn- require-node
  [module-name]
  (when (node-runtime?)
    (js/require module-name)))

(defonce ^:private http-module (delay (require-node "http")))
(defonce ^:private https-module (delay (require-node "https")))

(defn- request-module
  [^js url]
  (let [https? (= "https:" (.-protocol url))
        module (if https? @https-module @http-module)]
    (or module
        (throw (ex-info "Node runtime required for db-worker client" {:protocol (.-protocol url)})))))

(defn- base-headers
  [auth-token]
  (cond-> {"Content-Type" "application/json"
           "Accept" "application/json"}
    (seq auth-token)
    (assoc "Authorization" (str "Bearer " auth-token))))

(defn- <request
  [method url headers body]
  (p/create
   (fn [resolve reject]
     (let [req (.request (request-module url)
                         #js {:method method
                              :hostname (.-hostname url)
                              :port (or (.-port url) (if (= "https:" (.-protocol url)) 443 80))
                              :path (str (.-pathname url) (.-search url))
                              :headers (clj->js headers)}
                         (fn [^js res]
                           (let [chunks (array)]
                             (.on res "data" (fn [chunk] (.push chunks chunk)))
                             (.on res "end" (fn []
                                              (let [buf (js/Buffer.concat chunks)]
                                                (resolve {:status (.-statusCode res)
                                                          :body (.toString buf "utf8")}))))
                             (.on res "error" reject))))]
       (.on req "error" reject)
       (when body
         (.write req body))
       (.end req)))))

(defn- <invoke
  [{:keys [base-url auth-token]} method direct-pass? args]
  (let [url (js/URL. (str (string/replace base-url #"/$" "") "/v1/invoke"))
        payload (js/JSON.stringify
                 (clj->js (if direct-pass?
                            {:method method
                             :directPass true
                             :args args}
                            {:method method
                             :directPass false
                             :argsTransit (ldb/write-transit-str args)})))]
    (p/let [{:keys [status body]} (<request "POST" url (base-headers auth-token) payload)]
      (if (<= 200 status 299)
        (let [{:keys [result resultTransit]} (js->clj (js/JSON.parse body) :keywordize-keys true)]
          (if direct-pass?
            result
            (ldb/read-transit-str resultTransit)))
        (do
          (log/error :db-worker-node-invoke-failed {:status status :body body})
          (throw (ex-info "db-worker-node invoke failed" {:status status :body body})))))))

(defn- connect-events!
  [{:keys [base-url auth-token event-handler]} wrapped-worker]
  (let [url (js/URL. (str (string/replace base-url #"/$" "") "/v1/events"))
        headers (base-headers auth-token)
        buffer (atom "")
        handler (or event-handler (fn [_type _payload _wrapped-worker] nil))]
    (let [req (.request
               (request-module url)
               #js {:method "GET"
                    :hostname (.-hostname url)
                    :port (or (.-port url) (if (= "https:" (.-protocol url)) 443 80))
                    :path (str (.-pathname url) (.-search url))
                    :headers (clj->js headers)}
               (fn [^js res]
                 (.on res "data"
                      (fn [chunk]
                        (swap! buffer str (.toString chunk "utf8"))
                        (loop []
                          (when-let [idx (string/index-of @buffer "\n\n")]
                            (let [event-text (subs @buffer 0 idx)
                                  rest-text (subs @buffer (+ idx 2))]
                              (reset! buffer rest-text)
                              (when-let [line (some-> event-text
                                                      (string/split-lines)
                                                      (->> (some #(when (string/starts-with? % "data: ")
                                                                    (subs % 6)))))]
                                (let [{:keys [type payload]} (js->clj (js/JSON.parse line) :keywordize-keys true)
                                      decoded (when (some? payload)
                                                (try
                                                  (ldb/read-transit-str payload)
                                                  (catch :default _ payload)))
                                      [event-type event-payload] (if (and (vector? decoded)
                                                                          (= 2 (count decoded))
                                                                          (keyword? (first decoded)))
                                                                   [(first decoded) (second decoded)]
                                                                   [(keyword type) decoded])]
                                  (when (some? type)
                                    (handler event-type event-payload wrapped-worker)))))
                            (recur)))))
                 (.on res "error" (fn [e]
                                    (log/error :db-worker-node-events-error e)))))]
      (.on req "error" (fn [e]
                         (log/error :db-worker-node-events-error e)))
      (.end req))
    nil))

(defrecord InNode [client wrapped-worker]
  protocol/PersistentDB
  (<new [_this repo opts]
    (<invoke client "thread-api/create-or-open-db" false [repo opts]))

  (<list-db [_this]
    (<invoke client "thread-api/list-db" false []))

  (<unsafe-delete [_this repo]
    (<invoke client "thread-api/unsafe-unlink-db" false [repo]))

  (<release-access-handles [_this repo]
    (<invoke client "thread-api/release-access-handles" false [repo]))

  (<fetch-initial-data [_this repo opts]
    (p/let [_ (<invoke client "thread-api/create-or-open-db" false [repo opts])]
      (<invoke client "thread-api/get-initial-data" false [repo opts])))

  (<export-db [_this repo opts]
    (p/let [data (<invoke client "thread-api/export-db" true [repo])]
      (if (:return-data? opts)
        data
        data)))

  (<import-db [_this repo data]
    (<invoke client "thread-api/import-db" true [repo data])))

(defn create-client
  [{:keys [base-url auth-token]}]
  {:base-url base-url
   :auth-token auth-token})

(defn default-config
  []
  {:base-url (or (gobj/get (.-env js/process) "LOGSEQ_DB_WORKER_URL")
                 "http://127.0.0.1:9101")
   :auth-token (gobj/get (.-env js/process) "LOGSEQ_DB_WORKER_AUTH_TOKEN")})

(defn start!
  [{:keys [base-url auth-token event-handler]}]
  (let [client (create-client {:base-url base-url :auth-token auth-token})
        wrapped-worker (fn [qkw direct-pass? & args]
                         (<invoke client (str (namespace qkw) "/" (name qkw)) direct-pass? args))]
    (connect-events! (assoc client :event-handler event-handler) wrapped-worker)
    (->InNode client wrapped-worker)))
