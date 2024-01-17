(ns frontend.worker.rtc.asset-sync
  "Fns for syncing assets"
  {:clj-kondo/ignore true}              ;; TODO: remove when this ns is ready
  (:require [malli.core :as m]
            [malli.util :as mu]
            [cljs.core.async :as async :refer [<! >! chan go go-loop]]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.ws :as ws]
            [frontend.worker.async-util :include-macros true :refer [<?]]
            [datascript.core :as d]
            [frontend.worker.state :as state]))

(def state-schema
  [:map {:closed true}
   [:*graph-uuid :any]
   [:*repo :any]
   [:*db-conn :any]
   [:*token :any]
   [:*date-formatter :any]
   [:*ws :any]
   [:*assets-update-state :any]
   [:data-from-ws-chan :any]
   [:data-from-ws-pub :any]
   [:*auto-push-assets-update-ops? :any]
   [:toggle-auto-push-assets-update-ops-chan :any]
   [:*stop-asset-sync-loop-chan :any]])

(def state-validator
  (let [validator (m/validator state-schema)]
    (fn [data]
      (if (validator data)
        true
        (prn (mu/explain-data state-schema data))))))

(defonce *asset-sync-state (atom nil))

(defn init-state-from-rtc-state
  [rtc-state]
  {:post [(m/validate state-schema %)]}
  {:*graph-uuid (atom nil)
   :*repo (atom nil)
   :*db-conn (atom nil)
   :*token (:*token rtc-state)
   :*date-formatter (atom nil)
   :*ws (:*ws rtc-state)
   :*assets-update-state (atom nil)
   :data-from-ws-chan (:data-from-ws-chan rtc-state)
   :data-from-ws-pub (:data-from-ws-pub rtc-state)
   :*auto-push-assets-update-ops? (atom true :validator boolean?)
   :toggle-auto-push-assets-update-ops-chan (chan (async/sliding-buffer 1))
   :*stop-asset-sync-loop-chan (atom nil)})


(defn- <push-data-from-ws-handler
  [repo push-data-from-ws]
  (prn ::push-data-from-ws :push-data-from-ws)
  (go nil)
  ;; TODO
  )

(defn <upload-client-op-loop
  [state graph-uuid repo conn]
  (go-loop []
    (when-let [{min-epoch-asset-ops :ops asset-uuid :asset-uuid} (op-mem-layer/get-min-epoch-asset-ops repo)]
      (let [recur?
            (try
              (doseq [[tp _op] min-epoch-asset-ops]
                (case tp
                  :update-asset
                  (let [asset-entity (d/pull @conn '[*] [:asset/uuid asset-uuid])
                        r (<? (ws/<send&receive state {:action "update-assets" :graph-uuid graph-uuid
                                                       :create [{:asset-uuid asset-uuid
                                                                 :asset-name (or (some-> asset-entity :asset/meta :name)
                                                                                 "default-name")}]}))]
                    (when (:ex-data r)
                      (throw (ex-info (:ex-message r) (:ex-data r)))))

                  :remove-asset
                  (let [r (<? (ws/<send&receive state {:action "update-assets" :graph-uuid graph-uuid
                                                       :delete [asset-uuid]}))]
                    (when (:ex-data r)
                      (throw (ex-info (:ex-message r) (:ex-data r)))))))
              (op-mem-layer/remove-asset-ops! repo asset-uuid)
              :recur
              (catch :default e
                (prn ::unknown-ex e)
                nil))]
        (when (= :recur recur?)
          (recur))))))


(defn- <client-op-update-handler
  [state]
  {:pre [(some? @(:*graph-uuid state))
         (some? @(:*repo state))
         (some? @(:*db-conn state))]}
  (go
    (let [repo @(:*repo state)
          conn @(:*db-conn state)
          graph-uuid @(:*graph-uuid state)]
      (<! (<upload-client-op-loop state graph-uuid repo conn)))))


(defn- make-push-assets-update-ops-timeout-ch
  [repo never-timeout?]
  (if never-timeout?
    (chan)
    (go
      (<! (async/timeout 2000))
      ;; TODO: get-unpushed-assets-update-count
      (pos? (op-mem-layer/get-unpushed-asset-update-count repo)))))

(defn <loop-for-assets-sync
  [state graph-uuid repo conn]
  {:pre [(state-validator state)]}
  (go
    (reset! (:*repo state) repo)
    (reset! (:*graph-uuid state) graph-uuid)
    (reset! (:*db-conn state) conn)
    (let [{:keys [data-from-ws-pub]} state
          *auto-push-assets-update-ops? (:*auto-push-assets-update-ops? state)
          toggle-auto-push-assets-update-ops-ch (:toggle-auto-push-assets-update-ops-chan state)
          push-data-from-ws-ch (chan (async/sliding-buffer 100) (map rtc-const/data-from-ws-coercer))
          stop-assets-sync-loop-chan (chan)]
      (reset! (:*stop-asset-sync-loop-chan state) stop-assets-sync-loop-chan)
      (async/sub data-from-ws-pub "push-assets-updates" push-data-from-ws-ch)
      (<! (go-loop [push-assets-update-ops-ch
                    (make-push-assets-update-ops-timeout-ch repo (not @*auto-push-assets-update-ops?))]
            (let [{:keys [continue push-data-from-ws client-assets-update stop]}
                  (async/alt!
                    toggle-auto-push-assets-update-ops-ch {:continue true}
                    push-assets-update-ops-ch ([v] (if (and @*auto-push-assets-update-ops? (true? v))
                                                     {:client-assets-update true}
                                                     {:continue true}))
                    push-data-from-ws-ch ([v] {:push-data-from-ws v})
                    stop-assets-sync-loop-chan {:stop true}
                    :priority true)]
              (cond
                continue
                (recur (make-push-assets-update-ops-timeout-ch repo (not @*auto-push-assets-update-ops?)))

                push-data-from-ws
                (let [r (<push-data-from-ws-handler repo push-data-from-ws)]
                  (prn ::<push-data-from-ws-handler r)
                  (recur (make-push-assets-update-ops-timeout-ch repo (not @*auto-push-assets-update-ops?))))

                client-assets-update
                ;; TODO: <wrap-ensure-id&access-token, ensure token not expired
                ;; because this ns is running in db-worker now, need to move(or copy) <wrap-ensure-id&access-token
                ;; to db-worker again
                (let [maybe-exp (<! (<client-op-update-handler state))]
                  (if (= :expired-token (:anom (ex-data maybe-exp)))
                    (prn ::<loop-for-assets-sync "quitting loop" maybe-exp)
                    (recur (make-push-assets-update-ops-timeout-ch repo (not @*auto-push-assets-update-ops?)))))

                stop
                ;; (ws/stop @(:*ws state)) ;; use same ws with <rtc-loop
                (reset! (:*assets-update-state state) :closed)

                :else nil))))
      (async/unsub data-from-ws-pub "push-assets-update" push-data-from-ws-ch))))
