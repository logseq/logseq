(ns frontend.worker.ui-request
  "UI request/response manager for worker-side interactive flows."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.platform :as platform]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defonce ^:private *ui-requests-in-flight (atom {}))

(def ^:private default-timeout-ms 60000)

(defn- interactive-runtime?
  []
  (let [env (:env (platform/current))
        runtime (:runtime env)
        owner-source (:owner-source env)]
    (or (= :browser runtime)
        (and (= :node runtime)
             (= :electron owner-source)))))

(defn- ui-interaction-required-error
  [action hint]
  (ex-info "ui-interaction-required"
           (cond-> {:code :ui-interaction-required
                    :action action}
             (seq hint) (assoc :hint hint))))

(defn- normalize-timeout-ms
  [timeout-ms]
  (if (and (number? timeout-ms) (pos? timeout-ms))
    timeout-ms
    default-timeout-ms))

(defn- take-request!
  [request-id]
  (let [request (get @*ui-requests-in-flight request-id)]
    (when request
      (swap! *ui-requests-in-flight dissoc request-id)
      request)))

(defn- timeout-error
  [request-id action timeout-ms]
  (ex-info "ui-request-timeout"
           {:code :ui-request-timeout
            :request-id request-id
            :action action
            :timeout-ms timeout-ms}))

(defn- cancel-error
  [request-id action context]
  (ex-info "ui-request-cancelled"
           {:code :ui-request-cancelled
            :request-id request-id
            :action action
            :context context}))

(defn- reject-error
  [request-id action error]
  (let [data (ex-data error)
        message (or (ex-message error) "ui-request-rejected")]
    (ex-info message
             (merge {:code :ui-request-rejected
                     :request-id request-id
                     :action action}
                    (when (seq data)
                      {:data data})))))

(defn- ->rejectable-error
  [request-id action error]
  (cond
    (instance? cljs.core.ExceptionInfo error)
    (reject-error request-id action error)

    (instance? js/Error error)
    (reject-error request-id action error)

    (map? error)
    (let [message (or (:message error) "ui-request-rejected")
          data (dissoc error :message)]
      (ex-info message
               (merge {:code :ui-request-rejected
                       :request-id request-id
                       :action action}
                      (when (seq data)
                        {:data data}))))

    (string? error)
    (ex-info error
             {:code :ui-request-rejected
              :request-id request-id
              :action action})

    :else
    (ex-info "ui-request-rejected"
             {:code :ui-request-rejected
              :request-id request-id
              :action action
              :error error})))

(defn <request
  ([action payload]
   (<request action payload nil))
  ([action payload {:keys [timeout-ms hint]}]
   (if-not (interactive-runtime?)
     (p/rejected (ui-interaction-required-error action hint))
     (let [request-id (str (random-uuid))
           timeout-ms (normalize-timeout-ms timeout-ms)
           deferred (p/deferred)
           timeout-id (js/setTimeout
                       (fn []
                         (when-let [{:keys [deferred action timeout-ms]} (take-request! request-id)]
                           (p/reject! deferred (timeout-error request-id action timeout-ms))))
                       timeout-ms)]
       (swap! *ui-requests-in-flight assoc request-id
              {:request-id request-id
               :action action
               :deferred deferred
               :timeout-id timeout-id
               :timeout-ms timeout-ms})
       (try
         (platform/post-message! (platform/current)
                                 :db-worker/ui-request
                                 {:request-id request-id
                                  :action action
                                  :payload payload
                                  :timeout-ms timeout-ms})
         (catch :default error
           (when-let [{:keys [deferred timeout-id action]} (take-request! request-id)]
             (js/clearTimeout timeout-id)
             (p/reject! deferred (reject-error request-id action error)))))
       deferred))))

(defn resolve-request!
  [request-id result]
  (if-let [{:keys [deferred timeout-id]} (take-request! request-id)]
    (do
      (js/clearTimeout timeout-id)
      (p/resolve! deferred result)
      {:ok true})
    (do
      (log/warn :db-worker/ui-request-missing-resolve {:request-id request-id})
      {:ok false :reason :request-not-found :request-id request-id})))

(defn reject-request!
  [request-id error]
  (if-let [{:keys [deferred timeout-id action]} (take-request! request-id)]
    (do
      (js/clearTimeout timeout-id)
      (p/reject! deferred (->rejectable-error request-id action error))
      {:ok true})
    (do
      (log/warn :db-worker/ui-request-missing-reject {:request-id request-id
                                                      :error error})
      {:ok false :reason :request-not-found :request-id request-id})))

(defn cancel-all!
  [context]
  (let [requests (vals @*ui-requests-in-flight)]
    (reset! *ui-requests-in-flight {})
    (doseq [{:keys [request-id deferred timeout-id action]} requests]
      (js/clearTimeout timeout-id)
      (p/reject! deferred (cancel-error request-id action context)))
    {:ok true :cancelled (count requests)}))

(def-thread-api :thread-api/resolve-ui-request
  [request-id result]
  (resolve-request! request-id result))

(def-thread-api :thread-api/reject-ui-request
  [request-id error]
  (reject-request! request-id error))

(def-thread-api :thread-api/cancel-ui-requests
  [context]
  (cancel-all! context))
