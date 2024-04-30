(ns frontend.worker.rtc.core2
  "Main(use missionary) ns for rtc related fns"
  (:require [frontend.worker.rtc.client :as r.client]
            [frontend.worker.rtc.remote-update :as r.remote-update]
            [frontend.worker.rtc.ws2 :as ws]
            [frontend.worker.state :as worker-state]
            [goog.string :as gstring]
            [logseq.common.missionary-util :as c.m]
            [malli.core :as ma]
            [missionary.core :as m]))

(def ^:private rtc-state-schema
  [:map
   [:ws-state [:enum :connecting :open :closing :closed]]])
(def ^:private rtc-state-validator (ma/validator rtc-state-schema))

(defn- get-ws-url
  [token]
  (gstring/format @worker-state/*rtc-ws-url token))

(def ^:private sentinel (js-obj))
(defn get-remote-updates
  "Return a flow: receive messages from mws, and filter messages with :req-id=`push-updates`."
  [get-mws-create-task]
  (m/stream
   (m/ap
     (loop []
       (let [mws (m/? get-mws-create-task)
             x (try
                 (m/?> (m/eduction
                        (filter (fn [data] (= "push-updates" (:req-id data))))
                        (ws/recv-flow mws)))
                 (catch js/CloseEvent _
                   sentinel))]
         (if (identical? x sentinel)
           (recur)
           (m/amb x (recur))))))))

(defn- create-local-updates-check-flow
  "Return a flow"
  [*auto-push? interval-ms]
  (let [auto-push-flow (m/watch *auto-push?)
        clock-flow (c.m/clock interval-ms :clock)
        merge-flow (m/latest vector auto-push-flow clock-flow)]
    (m/eduction (filter first)
                (map second)
                merge-flow)))

(comment
  (def *push (atom true))
  (def f (create-local-updates-check-flow *push 2000))
  (def cancel ((m/reduce (fn [_ v] (prn :v v) v) f) #(js/console.log :s %) #(js/console.log :f %)))
  (reset! *push not)
  (cancel))

(defn- create-mixed-flow
  "Return a flow that emits all kinds of events:
  `:remote-update`: remote-updates data from server
  `:local-update-check`: event to notify to check if there're some new local-updates, then push to remote."
  [get-mws-create-task *auto-push?]
  (let [remote-updates-flow (m/eduction
                             (map (fn [data] {:type :remote-update :value data}))
                             (get-remote-updates get-mws-create-task))
        local-updates-check-flow (m/eduction
                                  (map (fn [data] {:type :local-update-check :value data}))
                                  (create-local-updates-check-flow *auto-push? 2000))]
    (c.m/mix remote-updates-flow local-updates-check-flow)))

(defn- create-get-mws-create-task
  "Return a task and *current-mws atom:
  get-mws-create-task: get current mws, create one if needed(closed or not created yet)"
  [url & {:keys [retry-count open-ws-timeout]
          :or {retry-count 10 open-ws-timeout 10000}}]
  (let [*current-mws (atom nil)
        mws-create-task (ws/mws-create url {:retry-count retry-count :open-ws-timeout open-ws-timeout})
        get-mws-create-task
        (m/sp
          (let [mws @*current-mws]
            (if (and mws
                     (not (ws/closed? mws)))
              mws
              (let [mws (m/? mws-create-task)]
                (reset! *current-mws mws)
                mws))))]
    [*current-mws get-mws-create-task]))

(defn- create-mws-state-flow
  [*current-mws]
  (m/ap
    (if-let [mws (m/?< (m/watch *current-mws))]
      (m/?< (ws/create-mws-state-flow mws))
      (m/amb))))

(defn- create-rtc-state-flow
  [mws-state-flow]
  (m/latest
   (fn [mws-state]
     {:post [(rtc-state-validator %)]}
     {:ws-state mws-state})
   mws-state-flow))

(defn create-rtc-loop
  "Return a map with [:rtc-log-flow :rtc-state-flow :rtc-loop-task :*rtc-auto-push?]
  TODO: auto refresh token if needed"
  [user-uuid graph-uuid repo conn date-formatter token
   & {:keys [auto-push? debug-ws-url] :or {auto-push? true}}]
  (let [ws-url       (or debug-ws-url (get-ws-url token))
        *auto-push?  (atom auto-push?)
        *log         (atom nil)
        add-log-fn   #(reset! *log [(js/Date.) %])
        [*current-mws get-mws-create-task] (create-get-mws-create-task ws-url)
        get-mws-create-task (r.client/ensure-register-graph-updates get-mws-create-task graph-uuid)
        mixed-flow   (create-mixed-flow get-mws-create-task *auto-push?)]
    {:rtc-log-flow   (m/buffer 100 (m/watch *log))
     :rtc-state-flow (create-rtc-state-flow (create-mws-state-flow *current-mws))
     :*rtc-auto-push? *auto-push?
     :rtc-loop-task
     (m/sp
      ;; init run to open a ws
       (m/? get-mws-create-task)
       (->>
        (let [event (m/?> mixed-flow)]
          (case (:type event)
            :remote-update
            (r.remote-update/apply-remote-update repo conn date-formatter event add-log-fn)

            :local-update-check
            (m/? (r.client/create-push-local-ops-task
                  repo conn user-uuid graph-uuid date-formatter
                  get-mws-create-task add-log-fn))))
        (m/ap)
        (m/reduce {})
        (m/?)))}))

(def send&recv r.client/send&recv)
