(ns frontend.worker.shared-service
  "This allows multiple workers to share some resources (e.g. db access)"
  (:require [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

;; Idea and code copied from https://github.com/Matt-TOTW/shared-service/blob/master/src/sharedService.ts
;; Related thread: https://github.com/rhashimoto/wa-sqlite/discussions/81

(log/set-level 'frontend.worker.shared-service :debug)

(defonce *master-client? (atom false))

(defonce *master-re-check-trigger (atom nil))

;;; common-channel - Communication related to master-client election.
;;; client-channel - For API request-response data communication.
;;; master-slave-channels - Registered slave channels for master, all the slave
;;;                         channels need to be closed to not receive further
;;;                         messages when the master has been changed to slave.
(defonce *common-channel (atom nil))
(defonce *client-channel (atom nil))
(defonce *master-slave-channels (atom #{}))

;;; record channel-listener here, to able to remove old listener before we addEventListener new one
(defonce *common-channel-listener (atom nil))
(defonce *client-channel-listener (atom nil))

(defonce *current-request-id (volatile! 0))
(defonce *requests-in-flight (volatile! (sorted-map))) ;sort by request-id
;;; The unique identity of the context where `js/navigator.locks.request` is called
(defonce *client-id (atom nil))
(defonce *master-client-lock (atom nil))

(defn- next-request-id
  []
  (vswap! *current-request-id inc))

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

(defn- do-not-wait
  [promise]
  promise
  nil)

(defn- <get-client-id
  []
  (let [id (random-id)]
    (p/let [client-id (js/navigator.locks.request id #js {:mode "exclusive"}
                                                  (fn [_]
                                                    (p/let [^js locks (js/navigator.locks.query)]
                                                      (->> (.-held locks)
                                                           (some #(when (= (.-name %) id) %))
                                                           .-clientId))))]
      (assert (some? client-id))
      (do-not-wait
       (js/navigator.locks.request client-id #js {:mode "exclusive"}
                                   ;; never release it
                                   (fn [_] (p/deferred))))
      (log/debug :client-id client-id)
      client-id)))

(defn- <ensure-client-id
  []
  (or @*client-id
      (p/let [client-id (<get-client-id)]
        (reset! *client-id client-id))))

(defn- ensure-common-channel
  [service-name]
  (or @*common-channel
      (reset! *common-channel (js/BroadcastChannel. (str "shared-service-common-channel-" service-name)))))

(defn- ensure-client-channel
  [slave-client-id service-name]
  (or @*client-channel
      (reset! *client-channel (js/BroadcastChannel. (get-broadcast-channel-name slave-client-id service-name)))))

(defn- listen-common-channel
  [common-channel listener-fn]
  (when-let [old-listener @*common-channel-listener]
    (.removeEventListener common-channel "message" old-listener))
  (reset! *common-channel-listener listener-fn)
  (.addEventListener common-channel "message" listener-fn))

(defn- listen-client-channel
  [client-channel listener-fn]
  (when-let [old-listener @*client-channel-listener]
    (.removeEventListener client-channel "message" old-listener))
  (reset! *client-channel-listener listener-fn)
  (.addEventListener client-channel "message" listener-fn))

(defn- <apply-target-f!
  [target method args]
  (let [f (gobj/get target method)]
    (assert (some? f) {:method method})
    (apply f args)))

(defn- <check-master-or-slave-client!
  "Check if the current client is the master (otherwise, it is a slave)"
  [service-name <on-become-master <on-become-slave]
  (p/let [client-id (<ensure-client-id)]
    (do-not-wait
     (js/navigator.locks.request
      service-name #js {:mode "exclusive", :ifAvailable true}
      (fn [lock]
        (p/let [^js locks (js/navigator.locks.query)
                locked? (some #(when (and (= (.-name %) service-name)
                                          (= (.-clientId %) client-id))
                                 true)
                              (.-held locks))]
          (cond
            (and locked? lock) ;become master
            (p/do!
             (reset! *master-client? true)
             (<on-become-master)
             (reset! *master-client-lock (p/deferred))
              ;; Keep lock until context destroyed
             @*master-client-lock)

            (and locked? (nil? lock)) ;already locked by this client, do nothing
            (assert (true? @*master-client?))

            (not locked?) ;become slave
            (p/do!
             (reset! *master-client? false)
             (<on-become-slave)))))))))

(defn- clear-old-service!
  []
  (release-master-client-lock!)
  (reset! *master-client? false)
  (let [channels (into @*master-slave-channels [@*common-channel @*client-channel])]
    (doseq [^js channel channels]
      (when channel
        (.close channel))))
  (reset! *common-channel nil)
  (reset! *client-channel nil)
  (reset! *master-slave-channels #{})
  (reset! *common-channel-listener nil)
  (reset! *client-channel-listener nil)
  (vreset! *requests-in-flight (sorted-map))
  (remove-watch *master-re-check-trigger :check-master))

(defn- on-response-handler
  [event]
  (let [{:keys [id type error result]} (bean/->clj (.-data event))]
    (when (identical? "response" type)
      (when-let [{:keys [resolve-fn reject-fn]} (get @*requests-in-flight id)]
        (vswap! *requests-in-flight dissoc id)
        (if error
          (do (log/error :error-process-request error)
              (reject-fn error))
          (resolve-fn result))))))

(defn- create-on-request-handler
  [client-channel target]
  (fn [event]
    (let [{:keys [type method args id]} (bean/->clj (.-data event))]
      (when (identical? "request" type)
        (p/let [[result error]
                (-> (p/then (<apply-target-f! target method args)
                            (fn [res] [res nil]))
                    (p/catch
                     (fn [e] [nil (if (instance? js/Error e)
                                    (bean/->clj e)
                                    e)])))]
          (.postMessage client-channel (bean/->js
                                        {:id id
                                         :type "response"
                                         :result result
                                         :error error
                                         :method-key (first args)})))))))

(defn- <slave-registered-handler
  [service-name slave-client-id event *register-finish-promise?]
  (let [slave-client-id* (:slave-client-id event)]
    (when (= slave-client-id slave-client-id*)
      (p/let [^js locks (js/navigator.locks.query)
              already-watching?
              (some
               (fn [l] (and (= service-name (.-name l))
                            (= slave-client-id (.-clientId l))))
               (.-pending locks))]
        (when-not already-watching?     ;dont watch multiple times
          (do-not-wait
           (js/navigator.locks.request service-name #js {:mode "exclusive"}
                                       (fn [_lock]
                                         ;; The master has gone, elect the new master
                                         (log/debug "master has gone" nil)
                                         (reset! *master-re-check-trigger :re-check)))))
        (p/resolve! @*register-finish-promise?)))))

(defn- <re-requests-in-flight-on-slave!
  [client-channel]
  (when (seq @*requests-in-flight)
    (log/debug "Requests were in flight when master changed. Requeuing..." (count @*requests-in-flight))
    (->>
     @*requests-in-flight
     (p/run!
      (fn [[id {:keys [method args _resolve-fn _reject-fn]}]]
        (.postMessage client-channel (bean/->js {:id id
                                                 :type "request"
                                                 :method method
                                                 :args args})))))))

(defn- <re-requests-in-flight-on-master!
  [target]
  (when (seq @*requests-in-flight)
    (log/debug "Requests were in flight when tab became master. Requeuing..." (count @*requests-in-flight))
    (->>
     @*requests-in-flight
     (p/run!
      (fn [[id {:keys [method args resolve-fn reject-fn]}]]
        (->
         (p/let [result (<apply-target-f! target method args)]
           (resolve-fn result))
         (p/catch (fn [e]
                    (log/error "Error processing request" e)
                    (reject-fn e)))
         (p/finally (fn []
                      (vswap! *requests-in-flight dissoc id)))))))))

(defn- <on-become-slave
  [slave-client-id service-name common-channel broadcast-data-types status-ready-promise]
  (let [client-channel (ensure-client-channel slave-client-id service-name)
        *register-finish-promise? (atom nil)
        <register #(do (.postMessage common-channel #js {:type "slave-register"
                                                         :slave-client-id slave-client-id})
                       (reset! *register-finish-promise? (p/deferred))
                       @*register-finish-promise?)]
    (listen-client-channel client-channel on-response-handler)
    (listen-common-channel
     common-channel
     (fn [event]
       (let [{:keys [type data] :as event*} (bean/->clj (.-data event))]
         (if (contains? broadcast-data-types type)
           (.postMessage js/self data)
           (case type
             "master-changed"
             (p/do!
              (log/debug "master-client change detected. Re-registering..." nil)
              (<register)
              (<re-requests-in-flight-on-slave! client-channel))
             "slave-registered"
             (<slave-registered-handler service-name slave-client-id event* *register-finish-promise?)

             "slave-register"
             (log/debug :ignored-event event*)

             (log/error :unknown-event event*))))))
    (->
     (p/do!
      (<register)
      (p/resolve! status-ready-promise))
     (p/catch (fn [e]
                (log/error :on-become-slave e)
                (p/rejected e))))))

(defn- <on-become-master
  [master-client-id service-name common-channel target on-become-master-handler status-ready-deferred-p]
  (log/debug :become-master master-client-id :service service-name)
  (listen-common-channel
   common-channel
   (fn [event]
     (let [{:keys [slave-client-id type]} (bean/->clj (.-data event))]
       (when (= type "slave-register")
         (let [client-channel (js/BroadcastChannel. (get-broadcast-channel-name slave-client-id service-name))]
           (swap! *master-slave-channels conj client-channel)
           (do-not-wait
            (js/navigator.locks.request slave-client-id #js {:mode "exclusive"}
                                        (fn [_]
                                          (log/debug :slave-has-gone slave-client-id)
                                          (.close client-channel))))
           (listen-client-channel client-channel (create-on-request-handler client-channel target))
           (.postMessage common-channel (bean/->js {:type "slave-registered"
                                                    :slave-client-id slave-client-id
                                                    :master-client-id master-client-id
                                                    :serviceName service-name})))))))
  (.postMessage common-channel #js {:type "master-changed"
                                    :master-client-id master-client-id
                                    :serviceName service-name})
  (->
   (p/do!
    (on-become-master-handler service-name)
    (<re-requests-in-flight-on-master! target))
   (p/finally
     (fn []
       (p/resolve! status-ready-deferred-p)))))

(defn <create-service
  "broadcast-data-types - For data matching these types,
                          forward the data broadcast from the master client directly to the UI thread."
  [service-name target on-become-master-handler broadcast-data-types {:keys [import?]}]
  (clear-old-service!)
  (when import? (reset! *master-client? true))
  (p/let [broadcast-data-types (set broadcast-data-types)
          status {:ready (p/deferred)}
          common-channel (ensure-common-channel service-name)
          client-id (<ensure-client-id)
          <check-master-slave-fn!
          (fn []
            (<check-master-or-slave-client!
             service-name
             #(<on-become-master
               client-id service-name common-channel target
               on-become-master-handler (:ready status))
             #(<on-become-slave
               client-id service-name common-channel broadcast-data-types (:ready status))))]
    (<check-master-slave-fn!)

    (add-watch *master-re-check-trigger :check-master
               (fn [_ _ _ new-value]
                 (when (= new-value :re-check)
                   (p/do!
                    (p/delay 100)      ; why need delay here?
                    (<check-master-slave-fn!)))))

    {:proxy (js/Proxy. target
                       #js {:get (fn [target method]
                                   (if (= "remoteInvoke" method)
                                     (fn [args]
                                       (cond
                                         @*master-client?
                                         (<apply-target-f! target method args)

                                         :else
                                         (let [request-id (next-request-id)
                                               client-channel (ensure-client-channel client-id service-name)]
                                           (p/create
                                            (fn [resolve-fn reject-fn]
                                              (vswap! *requests-in-flight assoc request-id {:method method
                                                                                            :args args
                                                                                            :resolve-fn resolve-fn
                                                                                            :reject-fn reject-fn})
                                              (.postMessage client-channel (bean/->js
                                                                            {:id request-id
                                                                             :type "request"
                                                                             :method method
                                                                             :args args})))))))
                                     (log/error :invalid-invoke-method method)))})
     :status status}))

(defn broadcast-to-clients!
  [type' data]
  (let [transit-payload (ldb/write-transit-str [type' data])]
    (when (exists? js/self) (.postMessage js/self transit-payload))
    (when-let [common-channel @*common-channel]
      (let [str-type' (common-util/keyword->string type')]
        (.postMessage common-channel #js {:type str-type'
                                          :data transit-payload})))))
