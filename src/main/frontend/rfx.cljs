(ns frontend.rfx
  "RFX integration for frontend application state, subscriptions, and events."
  (:require ["react" :as react]
            [io.factorhouse.rfx.core :as rfx]
            [io.factorhouse.rfx.registry :as registry]
            [io.factorhouse.rfx.store :as store]
            [promesa.core :as p]))

(defonce !context
  (atom nil))

(defonce ^:private !state-listeners
  (atom {}))

(defn- pub-event-deferred
  [event]
  (-> event meta ::deferred))

(defn- errors->exception
  [errors origin]
  (ex-info (or (:message (first errors))
               "RFX event failed.")
           {:errors errors
            :origin origin}))

(defn- error-handler
  [{:keys [errors origin] :as ctx}]
  (if-let [deferred (pub-event-deferred origin)]
    (p/reject! deferred (errors->exception errors origin))
    (rfx/log-and-continue-error-handler ctx)))

(defn- register-built-in-fx!
  [rfx-registry]
  (registry/reg-fx rfx-registry ::resolve-pub-event
                   (fn [_ {:keys [deferred value]}]
                     (p/resolve! deferred value)))
  (registry/reg-fx rfx-registry ::reject-pub-event
                   (fn [_ {:keys [deferred error]}]
                     (p/reject! deferred error))))

(defn- new-context
  [opts]
  (let [ctx (rfx/init (update opts :error-handler #(or % error-handler)))]
    (register-built-in-fx! (:registry ctx))
    ctx))

(defn context
  []
  (or @!context
      (reset! !context (new-context {:initial-value {}
                                     :registry (atom {})}))))

(defn init!
  [{:keys [initial-value registry] :as opts}]
  (let [ctx (new-context (assoc opts
                                :initial-value (or initial-value {})
                                :registry (or registry (atom {}))))]
    (reset! !context ctx)
    ctx))

(defn current-registry
  []
  (:registry (context)))

(defn snapshot
  []
  (rfx/snapshot (context)))

(defn replace-state!
  [db]
  (let [next-db (store/next-state! (:store (context)) db)]
    (doseq [listener (vals @!state-listeners)]
      (listener next-db))
    next-db))

(defn listen!
  [listener-id f]
  (swap! !state-listeners assoc listener-id f)
  #(swap! !state-listeners dissoc listener-id))

(defn update-state!
  [f & args]
  (replace-state! (apply f (snapshot) args)))

(defn snapshot-sub
  [sub]
  (rfx/snapshot-sub (context) sub))

(defn dispatch-sync!
  [event]
  (rfx/dispatch-sync (context) event))

(defn use-sub
  [sub]
  (rfx/use-sub sub))

(defn provider
  [child]
  (react/createElement rfx/RfxContextProvider #js {:value (context)} child))

(defn reg-sub!
  ([sub-id]
   (reg-sub! sub-id [] (fn [db _] db)))
  ([sub-id sub-f]
   (reg-sub! sub-id [] sub-f))
  ([sub-id signals sub-f]
   (registry/reg-sub (current-registry) sub-id signals sub-f)))

(defn- with-pub-event-resolution
  [event-f]
  (fn [coeffects event]
    (let [effects (event-f coeffects event)
          deferred (-> event meta ::deferred)]
      (cond-> (dissoc effects ::result ::error)
        (and deferred (contains? effects ::result))
        (assoc ::resolve-pub-event {:deferred deferred
                                    :value (get effects ::result)})

        (and deferred (contains? effects ::error))
        (assoc ::reject-pub-event {:deferred deferred
                                   :error (get effects ::error)})

        (and deferred
             (not (contains? effects ::result))
             (not (contains? effects ::error)))
        (assoc ::resolve-pub-event {:deferred deferred
                                    :value nil})))))

(defn reg-event-fx!
  ([event-id event-f]
   (reg-event-fx! event-id [] event-f))
  ([event-id interceptors event-f]
   (registry/reg-event-fx (current-registry) event-id interceptors
                          (with-pub-event-resolution event-f))))

(defn reg-event-db!
  ([event-id event-f]
   (reg-event-db! event-id [] event-f))
  ([event-id interceptors event-f]
   (reg-event-fx! event-id interceptors
                  (fn [{:keys [db]} event]
                    {:db (event-f db event)}))))

(defn pub-event!
  [event]
  (let [deferred (p/deferred)]
    (try
      (dispatch-sync! (with-meta event {::deferred deferred}))
      (catch :default e
        (p/reject! deferred e)))
    deferred))
