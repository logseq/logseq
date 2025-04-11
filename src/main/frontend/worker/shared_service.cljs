(ns frontend.worker.shared-service
  (:require [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [promesa.core :as p]))

;; Idea and code copied from https://github.com/Matt-TOTW/shared-service/blob/master/src/sharedService.ts
;; Related thread: https://github.com/rhashimoto/wa-sqlite/discussions/81

(defn get-broadcast-channel-name [client-id service-name]
  (str client-id "-" service-name))

(defn- random-id
  []
  (str (random-uuid)))

(defn get-client-id []
  (p/let [id (random-id)
          client-id (js/navigator.locks.request id #js {:mode "exclusive"}
                                                (fn [_]
                                                  (p/let [^js locks (.query js/navigator.locks)]
                                                    (->> (.-held locks)
                                                         first
                                                         .-clientId))))]
    (.request js/navigator.locks client-id #js {:mode "exclusive"}
              (fn [_]
                (p/deferred))) ;; Keeps lock until context destroyed
    client-id))

(defn create-service
  [service-name target {:keys [on-provider-change]}]
  (let [common-channel (js/BroadcastChannel. (str "shared-service-common-channel-" service-name))
        *requests-in-flight (atom {})
        *broadcast-channel (atom nil)
        *ready-resolve (atom nil)
        get-on-request-listener (fn get-on-request-listener [id' resolve-fn reject-fn]
                                  (let [*listener (atom nil)
                                        listener (fn [event]
                                                   (let [{:keys [id type error result]}
                                                         (bean/->clj (.-data event))]
                                                     (when (and (= id id') (not= type "request"))
                                                       (swap! *requests-in-flight dissoc id')
                                                       (.removeEventListener @*broadcast-channel "message" @*listener)
                                                       (if error
                                                         (do (js/console.error "Error processing request" error)
                                                             (reject-fn error))
                                                         (resolve-fn result)))))]
                                    (reset! *listener listener)
                                    listener))
        on-not-provider (fn [provider?]
                          (p/let [client-id (get-client-id)]
                            (reset! *broadcast-channel (js/BroadcastChannel. (get-broadcast-channel-name client-id service-name)))

                            (let [register (fn register []
                                             (p/promise
                                              (fn [resolve _]
                                                (let [*listener (atom nil)
                                                      listener (fn [event]
                                                                 (let [{:keys [clientId type]} (bean/->clj (.-data event))]
                                                                   (when (and (= clientId client-id) (= type "registered"))
                                                                     (.removeEventListener common-channel "message" @*listener)
                                                                     (resolve nil))))]
                                                  (reset! *listener listener)
                                                  (.addEventListener common-channel "message" listener)
                                                  (.postMessage common-channel #js {:type "register" :clientId client-id})))))]
                              (.addEventListener common-channel "message"
                                                 (fn [event]
                                                   (p/let [{:keys [type]} (js->clj (.-data event) :keywordize-keys true)]
                                                     (when (and (= type "providerChange") (not provider?))
                                                       (js/console.log "Provider change detected. Re-registering...")
                                                       (when on-provider-change
                                                         (on-provider-change client-id provider?))
                                                       (register)
                                                       (when (seq @*requests-in-flight)
                                                         (js/console.log "Requests were in flight when provider changed. Requeuing...")
                                                         (doseq [[id {:keys [method args resolve reject]}] @*requests-in-flight]
                                                           (let [listener (get-on-request-listener id resolve reject)]
                                                             (.addEventListener @*broadcast-channel "message" listener)
                                                             (.postMessage @*broadcast-channel (bean/->js {:id id
                                                                                                           :type "request"
                                                                                                           :method method
                                                                                                           :args args})))))))))
                              (p/do!
                               (register)
                               (when-let [resolve @*ready-resolve]
                                 (resolve))
                               (reset! *ready-resolve nil)))))

        status {:ready (atom (p/create (fn [resolve] (reset! *ready-resolve resolve))))
                :is-service-provider (atom
                                      (p/create (fn [resolve]
                                                  (p/let [^js locks (.query js/navigator.locks)
                                                          provider? (nil? (some #(= (.-name %) service-name) (.-held locks)))]
                                                    (resolve provider?)
                                                    (when-not provider?
                                                      (on-not-provider provider?))))))}
        on-become-provider (fn []
                             (p/do!
                              (reset! (:is-service-provider status) (p/resolved true))
                              (when (nil? @*ready-resolve)
                                (reset! (:ready status) (p/create (fn [resolve] (reset! *ready-resolve resolve)))))
                              (.addEventListener
                               common-channel "message"
                               (fn [event]
                                 (let [{:keys [clientId type]} (js->clj (.-data event) :keywordize-keys true)]
                                   (when (= type "register")
                                     (let [client-channel (js/BroadcastChannel. (get-broadcast-channel-name clientId service-name))]
                                       (.request js/navigator.locks clientId #js {:mode "exclusive"}
                                                 (fn [_]
                                                   ;; The client has gone. Clean up
                                                   (.close client-channel)))

                                       (.addEventListener client-channel "message"
                                                          (fn [event]
                                                            (p/let [{:keys [type method args id]} (js->clj (.-data event) :keywordize-keys true)]
                                                              (when (not= type "response")
                                                                (p/let [[result error] (p/catch
                                                                                        (p/then (js-invoke target method (clj->js args))
                                                                                                (fn [res] [res nil]))
                                                                                        (fn [e] [nil (if (instance? js/Error e)
                                                                                                       (js->clj e :keywordize-keys true)
                                                                                                       e)]))]
                                                                  (.postMessage client-channel (bean/->js
                                                                                                {:id id
                                                                                                 :type "response"
                                                                                                 :result result
                                                                                                 :error error
                                                                                                 :method method})))))))
                                       (.postMessage common-channel (bean/->js {:type "registered"
                                                                                :clientId clientId
                                                                                :serviceName service-name}))))))

                               (.postMessage common-channel #js {:type "providerChange" :serviceName service-name})
                               (when on-provider-change
                                 (p/let [provider? @(:is-service-provider status)]
                                   (on-provider-change nil provider?)))

                               (when (seq @*requests-in-flight)
                                 (js/console.log "Requests were in flight when tab became provider. Requeuing...")
                                 (doseq [[id {:keys [method args resolve reject]}] @*requests-in-flight]
                                   (->
                                    (p/let [result (js-invoke target method (clj->js args))]
                                      (resolve result))
                                    (p/catch (fn [e]
                                               (js/console.error "Error processing request" e)
                                               (reject e)))
                                    (p/finally (fn []
                                                 (swap! *requests-in-flight dissoc id))))))

                               (when-let [resolve @*ready-resolve]
                                 (resolve))
                               (reset! *ready-resolve nil))))]

    (.request js/navigator.locks service-name #js {:mode "exclusive"}
              (fn [_]
                (p/do!
                 (on-become-provider)
                 (p/deferred))))  ;; Keep lock until context destroyed

    {:proxy (js/Proxy. target
                       #js {:get (fn [target method]
                                   (cond
                                     (#{:then :catch :finally} (keyword method))
                                     ;; Return nil for these methods to allow promise chaining to work correctly
                                     nil

                                     :else
                                     (fn [args]
                                       (p/let [provider? @(:is-service-provider status)]
                                         (if provider?
                                           (let [f (gobj/get target method)]
                                             (apply f args))
                                           (p/create
                                            (fn [resolve reject]
                                              (let [id (random-id)
                                                    listener (get-on-request-listener id resolve reject)]
                                                (.addEventListener @*broadcast-channel "message" listener)
                                                (.postMessage @*broadcast-channel (bean/->js
                                                                                   {:id id
                                                                                    :type "request"
                                                                                    :method method
                                                                                    :args args}))
                                                (swap! *requests-in-flight assoc id {:method method
                                                                                     :args args
                                                                                     :resolve resolve
                                                                                     :reject reject})))))))))})
     :status status}))
