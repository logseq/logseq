(ns frontend.worker.shared-service
  (:require [cljs-bean.core :as bean]
            [frontend.worker.util :as worker-util]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [promesa.core :as p]))

;; Idea and code copied from https://github.com/Matt-TOTW/shared-service/blob/master/src/sharedService.ts
;; Related thread: https://github.com/rhashimoto/wa-sqlite/discussions/81

(defonce *provider? (atom false))
(defonce *common-channel (atom nil))
(defonce *client-channel (atom nil))
(defonce *ready-resolve (atom nil))
(defonce *requests-in-flight (atom {}))
(defonce *client-id (atom nil))
(defonce *provider-lock (atom nil))

(defn- release-provider-lock!
  []
  (when-let [d @*provider-lock]
    (p/resolve! d nil)
    nil))

(defn get-broadcast-channel-name [client-id service-name]
  (str client-id "-" service-name))

(defn- random-id
  []
  (str (random-uuid)))

(defn get-client-id []
  (let [id (random-id)]
    (p/let [client-id (js/navigator.locks.request id #js {:mode "exclusive"}
                                                  (fn [_]
                                                    (p/let [^js locks (.query js/navigator.locks)]
                                                      (->> (.-held locks)
                                                           (some #(when (= (.-name %) id) %))
                                                           .-clientId))))]
      (when client-id (reset! *client-id client-id))
      (js/setTimeout #(js/navigator.locks.request client-id #js {:mode "exclusive"}
                                                  (fn [_]
                                                    (p/deferred))))

      client-id)))

(defn- apply-target-f!
  [target method args]
  (let [f (gobj/get target method)]
    (apply f args)))

(defn check-provider?
  [service-name {:keys [on-become-provider on-not-provider]}]
  (js/navigator.locks.request service-name #js {:mode "exclusive", :ifAvailable true}
                              (fn [lock]
                                (p/let [^js locks (.query js/navigator.locks)]
                                  (js/console.dir (.-held locks)))
                                (if lock
                                  (p/do!
                                   (reset! *provider? true)
                                   (on-become-provider)
                                   (reset! *provider-lock (p/deferred))
                                   ;; Keep lock until context destroyed
                                   @*provider-lock)
                                  (do
                                    (reset! *provider? false)
                                    (on-not-provider))))))

(defn- clear-old-service!
  []
  (p/do!
   (release-provider-lock!)
   (reset! *provider? false)
   (reset! *ready-resolve nil)
   (when-let [^js channel @*common-channel]
     (.close channel))
   (when-let [^js channel @*client-channel]
     (.close channel))
   (reset! *common-channel nil)
   (reset! *client-channel nil)
   (reset! *requests-in-flight {})))

(defn create-service
  [service-name target {:keys [on-provider-change]}]
  (p/do!
   (clear-old-service!)
   (let [common-channel (or @*common-channel
                            (let [channel (js/BroadcastChannel. (str "shared-service-common-channel-" service-name))]
                              (reset! *common-channel channel)
                              channel))
         get-on-request-listener (fn get-on-request-listener [id' resolve-fn reject-fn]
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
         on-not-provider (fn []
                           (->
                            (p/let [client-id (get-client-id)]
                              (reset! *client-channel (js/BroadcastChannel. (get-broadcast-channel-name client-id service-name)))
                              (let [register (fn register []
                                               (p/create
                                                (fn [resolve _]
                                                  (letfn [(listener [event]
                                                            (let [{:keys [providerId clientId type]} (bean/->clj (.-data event))]
                                                              (.request js/navigator.locks providerId #js {:mode "exclusive"}
                                                                        (fn [_]
                                                                         ;; The provider has gone, elect the new provider
                                                                          (prn :debug "Provider has gone")
                                                                          (reset! *provider? :re-check)))
                                                              (when (and (= clientId client-id) (= type "registered"))
                                                                (.removeEventListener common-channel "message" listener)
                                                                (resolve nil))))]
                                                    (.addEventListener common-channel "message" listener)
                                                    (.postMessage common-channel #js {:type "register" :clientId client-id})))))]
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
                                                                     (fn [[id {:keys [method args resolve reject]}]]
                                                                       (let [listener (get-on-request-listener id resolve reject)]
                                                                         (.addEventListener @*client-channel "message" listener)
                                                                         (.postMessage @*client-channel (bean/->js {:id id
                                                                                                                    :type "request"
                                                                                                                    :method method
                                                                                                                    :args args}))))
                                                                     @*requests-in-flight))))

                                                         "sync-db-changes"
                                                         (worker-util/post-message :sync-db-changes (ldb/read-transit-str data))

                                                         nil))))
                                (p/do!
                                 (register)
                                 (when-let [resolve @*ready-resolve]
                                   (resolve))
                                 (reset! *ready-resolve nil))))
                            (p/catch (fn [error]
                                       (js/console.error error)))))

         status {:ready (atom (p/create (fn [resolve] (reset! *ready-resolve resolve))))}
         on-become-provider (fn [_re-elect?]
                              (when (nil? @*ready-resolve)
                                (reset! (:ready status) (p/create (fn [resolve] (reset! *ready-resolve resolve)))))
                              (p/let [provider-id (get-client-id)]
                                (.addEventListener
                                 common-channel "message"
                                 (fn [event]
                                   (let [{:keys [clientId type]} (bean/->clj (.-data event))]
                                     (when (= type "register")
                                       (let [client-channel (js/BroadcastChannel. (get-broadcast-channel-name clientId service-name))]
                                         (.request js/navigator.locks clientId #js {:mode "exclusive"}
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
                                                                                  :providerId provider-id
                                                                                  :serviceName service-name})))))))
                                (.postMessage common-channel #js {:type "providerChange"
                                                                  :providerId provider-id
                                                                  :serviceName service-name})
                                (p/let [_ (when on-provider-change (on-provider-change service-name))
                                        _ (when (seq @*requests-in-flight)
                                            (js/console.log "Requests were in flight when tab became provider. Requeuing...")
                                            (p/all (map
                                                    (fn [[id {:keys [method args resolve reject]}]]
                                                      (->
                                                       (p/let [result (apply-target-f! target method args)]
                                                         (resolve result))
                                                       (p/catch (fn [e]
                                                                  (js/console.error "Error processing request" e)
                                                                  (reject e)))
                                                       (p/finally (fn []
                                                                    (swap! *requests-in-flight dissoc id)))))
                                                    @*requests-in-flight)))]

                                  (when-let [resolve @*ready-resolve]
                                    (resolve))
                                  (reset! *ready-resolve nil))))
         check-provider-f (fn [re-elect?]
                            (check-provider? service-name {:on-become-provider #(on-become-provider re-elect?)
                                                           :on-not-provider on-not-provider}))]
     (check-provider-f false)

     (add-watch *provider? :check-provider
                (fn [_ _ _ new-value]
                  (when (= new-value :re-check)
                    (check-provider-f true))))

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
                                             (fn [resolve reject]
                                               (let [id (random-id)
                                                     listener (get-on-request-listener id resolve reject)]
                                                 (.addEventListener @*client-channel "message" listener)
                                                 (.postMessage @*client-channel (bean/->js
                                                                                 {:id id
                                                                                  :type "request"
                                                                                  :method method
                                                                                  :args args}))
                                                 (swap! *requests-in-flight assoc id {:method method
                                                                                      :args args
                                                                                      :resolve resolve
                                                                                      :reject reject})))))))))})
      :status status})))

(defn broadcast-to-clients!
  [payload]
  (when-let [channel @*common-channel]
    (.postMessage channel payload)))
