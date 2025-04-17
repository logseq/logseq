(ns frontend.worker.shared-service
  "This allows multiple workers to share some resources (e.g. db access)"
  (:require [cljs-bean.core :as bean]
            [frontend.worker.util :as worker-util]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [promesa.core :as p]))

;; TODO:
;; - client-channel close before re-creating new one

;; Idea and code copied from https://github.com/Matt-TOTW/shared-service/blob/master/src/sharedService.ts
;; Related thread: https://github.com/rhashimoto/wa-sqlite/discussions/81

(defonce *master-client? (atom false))
;;; common-channel - Communication related to master-client election.
;;; client-channel - For API request-response data communication.
(defonce *common-channel (atom nil))
(defonce *client-channel (atom nil))

(defonce *requests-in-flight (atom {}))
;;; The unique identity of the context where `js/navigator.locks.request` is called
(defonce *client-id (atom nil))
(defonce *master-client-lock (atom nil))

(defn- release-master-client-lock!
  []
  (when-let [d @*master-client-lock]
    (p/resolve! d)
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

(defn- check-master-or-slave-client!
  "Check if the current client is the master (otherwise, it is a slave)"
  [service-name on-become-master on-become-slave]
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
                                       (reset! *master-client? true)
                                       (on-become-master)
                                       (reset! *master-client-lock (p/deferred))
                                       ;; Keep lock until context destroyed
                                       @*master-client-lock)
                                      (p/do!
                                       (reset! *master-client? false)
                                       (on-become-slave))))))))

(defn- clear-old-service!
  []
  (p/do!
   (release-master-client-lock!)
   (reset! *master-client? false)
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

(defn- on-become-slave
  [slave-client-id service-name common-channel status-ready-deferred-p]
  (reset! *client-channel (js/BroadcastChannel. (get-broadcast-channel-name slave-client-id service-name)))
  (let [register (fn register []
                   (p/create
                    (fn [resolve-fn _]
                      (letfn [(listener [event]
                                (let [{:keys [_master-client-id type]
                                       slave-client-id* :slave-client-id} (bean/->clj (.-data event))]
                                  (when (and (= slave-client-id* slave-client-id) (= type "slave-registered"))
                                    (js/navigator.locks.request service-name #js {:mode "exclusive"}
                                                                (fn [_lock]
                                                                  ;; The master has gone, elect the new master
                                                                  (prn :debug "master has gone")
                                                                  (reset! *master-client? :re-check)))
                                    (.removeEventListener common-channel "message" listener)
                                    (resolve-fn nil))))]
                        (.addEventListener common-channel "message" listener)
                        (.postMessage common-channel #js {:type "slave-register" :slave-client-id slave-client-id})))))]
    (.addEventListener common-channel "message"
                       (fn [event]
                         (let [{:keys [type data]} (bean/->clj (.-data event))]
                           (case type
                             "master-changed"
                             (p/do!
                              (js/console.log "master-client change detected. Re-registering...")
                              (register)
                              (when (seq @*requests-in-flight)
                                (js/console.log "Requests were in flight when master changed. Requeuing...")
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
  [service-name target on-become-master-handler]
  (p/let [_ (clear-old-service!)
          status {:ready (p/deferred)}
          common-channel (ensure-common-channel service-name)
          client-id (or @*client-id (get-client-id))
          on-become-master (fn [_re-elect?]
                             (p/let [master-client-id client-id]
                               (prn :debug :become-master master-client-id :service service-name)
                               (.addEventListener
                                common-channel "message"
                                (fn [event]
                                  (let [{:keys [slave-client-id type]} (bean/->clj (.-data event))]
                                    (when (= type "slave-register")
                                      (let [client-channel (js/BroadcastChannel. (get-broadcast-channel-name slave-client-id service-name))]
                                        (js/navigator.locks.request slave-client-id #js {:mode "exclusive"}
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
                                        (.postMessage common-channel (bean/->js {:type "slave-registered"
                                                                                 :slave-client-id slave-client-id
                                                                                 :master-client-id master-client-id
                                                                                 :serviceName service-name})))))))
                               (.postMessage common-channel #js {:type "master-changed"
                                                                 :master-client-id master-client-id
                                                                 :serviceName service-name})
                               (p/let [_  (on-become-master-handler service-name)
                                       _ (when (seq @*requests-in-flight)
                                           (js/console.log "Requests were in flight when tab became master. Requeuing...")
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
          check-master-slave-fn! (fn [re-elect?]
                                   (check-master-or-slave-client!
                                    service-name
                                    #(on-become-master re-elect?)
                                    #(on-become-slave client-id service-name common-channel (:ready status))))]
    (check-master-slave-fn! false)

    (add-watch *master-client? :check-master
               (fn [_ _ _ new-value]
                 (when (= new-value :re-check)
                   (p/do!
                    (p/delay 100)
                    (check-master-slave-fn! true)))))

    {:proxy (js/Proxy. target
                       #js {:get (fn [target method]
                                   (cond
                                     (#{:then :catch :finally} (keyword method))
                                       ;; Return nil for these methods to allow promise chaining to work correctly
                                     nil

                                     :else
                                     (fn [args]
                                       (let [master-client? @*master-client?]
                                         (if master-client?
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
