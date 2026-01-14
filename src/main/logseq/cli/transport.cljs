(ns logseq.cli.transport
  "HTTP transport for communicating with db-worker-node."
  (:require [clojure.string :as string]
            [logseq.db :as ldb]
            [promesa.core :as p]
            ["fs" :as fs]
            ["http" :as http]
            ["https" :as https]
            ["url" :as url]))

(defn- request-module
  [^js parsed]
  (if (= "https:" (.-protocol parsed))
    https
    http))

(defn- base-headers
  [auth-token]
  (cond-> {"Content-Type" "application/json"
           "Accept" "application/json"}
    (seq auth-token)
    (assoc "Authorization" (str "Bearer " auth-token))))

(defn- <raw-request
  [{:keys [method url headers body timeout-ms]}]
  (p/create
   (fn [resolve reject]
     (let [parsed (url/parse url)
           module (request-module parsed)
           timeout-ms (or timeout-ms 10000)
           req (.request
                module
                #js {:method method
                     :hostname (.-hostname parsed)
                     :port (or (.-port parsed) (if (= "https:" (.-protocol parsed)) 443 80))
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

(defn- retryable-error?
  [error]
  (let [{:keys [code status]} (ex-data error)]
    (or (= :timeout code)
        (and (= :http-error code)
             (>= (or status 0) 500)))))

(defn request
  [{:keys [method url headers body timeout-ms retries]
    :or {retries 0}}]
  (letfn [(attempt-request [attempt]
            (-> (p/let [response (<raw-request {:method method
                                                :url url
                                                :headers headers
                                                :body body
                                                :timeout-ms timeout-ms})]
                  (if (<= 200 (:status response) 299)
                    response
                    (throw (ex-info "http request failed"
                                    {:code :http-error
                                     :status (:status response)
                                     :body (:body response)}))))
                (p/catch (fn [error]
                           (if (and (< attempt retries) (retryable-error? error))
                             (attempt-request (inc attempt))
                             (throw error))))))]
    (attempt-request 0)))

(defn invoke
  [{:keys [base-url auth-token timeout-ms retries]}
   method direct-pass? args]
  (let [url (str (string/replace base-url #"/$" "") "/v1/invoke")
        payload (if direct-pass?
                  {:method method
                   :directPass true
                   :args args}
                  {:method method
                   :directPass false
                   :argsTransit (ldb/write-transit-str args)})
        body (js/JSON.stringify (clj->js payload))]
    (p/let [{:keys [body]} (request {:method "POST"
                                    :url url
                                    :headers (base-headers auth-token)
                                    :body body
                                    :timeout-ms timeout-ms
                                    :retries retries})
            {:keys [result resultTransit]} (js->clj (js/JSON.parse body) :keywordize-keys true)]
      (if direct-pass?
        result
        (ldb/read-transit-str resultTransit)))))

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

    (throw (ex-info "unsupported output format" {:format format}))))
