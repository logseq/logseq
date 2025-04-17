(ns frontend.worker.shared-service
  "This allows multiple workers to share some resources (e.g. db access)"
  (:require [cljs-bean.core :as bean]
            [frontend.worker.util :as worker-util]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [promesa.core :as p]))

;; TODO:
;; - client-channel close before re-creating new one
;; - change all 'provider' to 'master-client' & 'slave-client'

;; Idea and code copied from https://github.com/Matt-TOTW/shared-service/blob/master/src/sharedService.ts
;; Related thread: https://github.com/rhashimoto/wa-sqlite/discussions/81

(defonce *provider? (atom false))
(defonce *common-channel (atom nil))
(defonce *client-channel (atom nil))
(defonce *requests-in-flight (atom {}))
;;; The unique identity of the context where `js/navigator.locks.request` is called
(defonce *client-id (atom nil))
(defonce *provider-lock (atom nil))

(defn- release-provider-lock!
  []
  (when-let [d @*provider-lock]
    (p/resolve! d nil)
    nil))

(defn- get-broadcast-channel-name [client-id service-name]
  (str client-id "-" service-name))

(defn- random-id
  []
  (str (random-uuid)))

(defn- get-client-id []
  (let [id (random-id)]
    (p/let [client-id (js/navigator.locks.request id #js {:mode "exclusive"}
                                                  (fn [_]
                                                    (p/let [^js locks (js/navigator.locks.query)]
                                                      (->> (.-held locks)
                                                           (some #(when (= (.-name %) id) %))
                                                           .-clientId))))]
      (assert (some? client-id))
      (reset! *client-id client-id)
      (do ;; don't wait this promise
        (js/navigator.locks.request client-id #js {:mode "exclusive"}
                                    (fn [_] (p/deferred)))
        nil)
      client-id)))

(defn- apply-target-f!
  [target method args]
  (when-let [f (gobj/get target method)]
    (apply f args)))

(defn- check-provider?
  [service-name {:keys [on-become-provider on-not-provider]}]
  (p/let [client-id (or @*client-id (get-client-id))]
    (js/navigator.locks.request service-name #js {:mode "exclusive", :ifAvailable true}
                                (fn [_lock]
                                  (p/let [^js locks (js/navigator.locks.query)
                                          locked? (some #(when (and (= (.-name %) service-name)
                                                                    (= (.-clientId %) client-id))
                                                           true)
                                                        (.-held locks))]
                                    (if locked?
                                      (p/do!
                                       (reset! *provider? true)
                                       (on-become-provider)
                                       (reset! *provider-lock (p/deferred))
                                       ;; Keep lock until context destroyed
                                       @*provider-lock)
                                      (do
                                        (reset! *provider? false)
                                        (on-not-provider))))))))

(defn- clear-old-service!
  []
  (p/do!
   (release-provider-lock!)
   (reset! *provider? false)
   (when-let [^js channel @*common-channel]
     (.close channel))
   (when-let [^js channel @*client-channel]
     (.close channel))
   (reset! *common-channel nil)
   (reset! *client-channel nil)
   (reset! *requests-in-flight {})))

(defn- get-on-request-listener
  [id' resolve-fn reject-fn]
  (letfn [(listener [event]
            (let [{:keys [id type error result]} (bean/->clj (.-data event))]
              (when (and (= id id') (not= type "request"))
                (swap! *requests-in-flight dissoc id')
                (.removeEventListener @*client-channel "message" listener)
                (if error
                  (do (js/console.error "Error processing request" error)
                      (reject-fn error))
                  (resolve-fn result)))))]
    listener))

(defn- ensure-common-channel
  [service-name]
  (or @*common-channel
      (let [channel (js/BroadcastChannel. (str "shared-service-common-channel-" service-name))]
        (reset! *common-channel channel)
        channel)))

(defn- on-slave-client
  [slave-client-id service-name common-channel status-ready-deferred-p]
  (reset! *client-channel (js/BroadcastChannel. (get-broadcast-channel-name slave-client-id service-name)))
  (let [register (fn register []
                   (p/create
                    (fn [resolve-fn _]
                      (letfn [(listener [event]
                                (let [{:keys [_providerId clientId type]} (bean/->clj (.-data event))]
                                  (when (and (= clientId slave-client-id) (= type "registered"))
                                    (js/navigator.locks.request service-name #js {:mode "exclusive"}
                                                                (fn [_lock]
                                                                  ;; The provider has gone, elect the new provider
                                                                  (prn :debug "Provider has gone")
                                                                  (reset! *provider? :re-check)))
                                    (.removeEventListener common-channel "message" listener)
                                    (resolve-fn nil))))]
                        (.addEventListener common-channel "message" listener)
                        (.postMessage common-channel #js {:type "register" :clientId slave-client-id})))))]
    (.addEventListener common-channel "message"
                       (fn [event]
                         (let [{:keys [type data]} (bean/->clj (.-data event))]
                           (case type
                             "providerChange"
                             (do
                               (js/console.log "Provider change detected. Re-registering...")
                               (register)
                               (when (seq @*requests-in-flight)
                                 (js/console.log "Requests were in flight when provider changed. Requeuing...")
                                 (p/all (map
                                         (fn [[id {:keys [method args resolve-fn reject-fn]}]]
                                           (let [listener (get-on-request-listener id resolve-fn reject-fn)]
                                             (when-let [channel @*client-channel]
                                               (.addEventListener channel "message" listener)
                                               (.postMessage channel (bean/->js {:id id
                                                                                 :type "request"
                                                                                 :method method
                                                                                 :args args})))))
                                         @*requests-in-flight))))

                             "sync-db-changes"
                             (worker-util/post-message :sync-db-changes (ldb/read-transit-str data))

                             nil))))
    (->
     (p/do!
      (register)
      (p/resolve! status-ready-deferred-p))
     (p/catch (fn [error]
                (js/console.error error))))))

(defn ^:large-vars/cleanup-todo create-service
  [service-name target {:keys [on-provider-change]}]
  (p/let [_ (clear-old-service!)
          status {:ready (p/deferred)}
          common-channel (ensure-common-channel service-name)
          client-id (or @*client-id (get-client-id))
          on-become-provider (fn [_re-elect?]
                               (p/let [master-client-id client-id]
                                 (prn :debug :become-master master-client-id :service service-name)
                                 (.addEventListener
                                  common-channel "message"
                                  (fn [event]
                                    (let [{:keys [clientId type]} (bean/->clj (.-data event))]
                                      (when (= type "register")
                                        (let [client-channel (js/BroadcastChannel. (get-broadcast-channel-name clientId service-name))]
                                          (js/navigator.locks.request clientId #js {:mode "exclusive"}
                                                                      (fn [_]
                                                                       ;; The client has gone. Clean up
                                                                        (.close client-channel)))

                                          (.addEventListener client-channel "message"
                                                             (fn [event]
                                                               (let [{:keys [type method args id]} (bean/->clj (.-data event))]
                                                                 (when (not= type "response")
                                                                   (p/let [[result error] (p/catch
                                                                                           (p/then (apply-target-f! target method args)
                                                                                                   (fn [res] [res nil]))
                                                                                           (fn [e] [nil (if (instance? js/Error e)
                                                                                                          (bean/->clj e)
                                                                                                          e)]))]
                                                                     (.postMessage client-channel (bean/->js
                                                                                                   {:id id
                                                                                                    :type "response"
                                                                                                    :result result
                                                                                                    :error error
                                                                                                    :method-key (first args)})))))))
                                          (.postMessage common-channel (bean/->js {:type "registered"
                                                                                   :clientId clientId
                                                                                   :providerId master-client-id
                                                                                   :serviceName service-name})))))))
                                 (.postMessage common-channel #js {:type "providerChange"
                                                                   :providerId master-client-id
                                                                   :serviceName service-name})
                                 (p/let [_ (when on-provider-change (on-provider-change service-name))
                                         _ (when (seq @*requests-in-flight)
                                             (js/console.log "Requests were in flight when tab became provider. Requeuing...")
                                             (p/all (map
                                                     (fn [[id {:keys [method args resolve-fn reject-fn]}]]
                                                       (->
                                                        (p/let [result (apply-target-f! target method args)]
                                                          (resolve-fn result))
                                                        (p/catch (fn [e]
                                                                   (js/console.error "Error processing request" e)
                                                                   (reject-fn e)))
                                                        (p/finally (fn []
                                                                     (swap! *requests-in-flight dissoc id)))))
                                                     @*requests-in-flight)))]
                                   (p/resolve! (:ready status)))))
          check-provider-f (fn [re-elect?]
                             (check-provider? service-name
                                              {:on-become-provider #(on-become-provider re-elect?)
                                               :on-not-provider #(on-slave-client client-id service-name common-channel (:ready status))}))]
    (check-provider-f false)

    (add-watch *provider? :check-provider
               (fn [_ _ _ new-value]
                 (when (= new-value :re-check)
                   (p/do!
                    (p/delay 100)
                    (check-provider-f true)))))

    {:proxy (js/Proxy. target
                       #js {:get (fn [target method]
                                   (cond
                                     (#{:then :catch :finally} (keyword method))
                                       ;; Return nil for these methods to allow promise chaining to work correctly
                                     nil

                                     :else
                                     (fn [args]
                                       (let [provider? @*provider?]
                                         (if provider?
                                           (apply-target-f! target method args)
                                           (p/create
                                            (fn [resolve-fn reject-fn]
                                              (let [id (random-id)
                                                    listener (get-on-request-listener id resolve-fn reject-fn)
                                                    channel @*client-channel]
                                                (when channel
                                                  (.addEventListener channel "message" listener)
                                                  (.postMessage channel (bean/->js
                                                                         {:id id
                                                                          :type "request"
                                                                          :method method
                                                                          :args args})))
                                                (swap! *requests-in-flight assoc id {:method method
                                                                                     :args args
                                                                                     :resolve-fn resolve-fn
                                                                                     :reject-fn reject-fn})))))))))})
     :status status}))

(defn broadcast-to-clients!
  [payload]
  (when-let [channel @*common-channel]
    (.postMessage channel payload)))
