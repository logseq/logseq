(ns frontend.worker.rtc.ws2
  "Websocket wrapped by missionary.
  based on
  https://github.com/ReilySiegel/missionary-websocket/blob/master/src/com/reilysiegel/missionary/websocket.cljs"
  (:require [frontend.worker.rtc.const :as rtc-const]
            [logseq.common.missionary-util :as c.m]
            [missionary.core :as m]))

(defn- get-state
  [ws]
  (case (.-readyState ws)
    0 :connecting
    1 :open
    2 :closing
    3 :closed))

(defn- open-ws-task
  [url]
  (fn [s! f!]
    (try
      (let [ws (js/WebSocket. url)]
        (set! (.-onopen ws)
              (fn [_]
                (let [close-dfv (m/dfv)
                      mbx (m/mbx)]
                  (set! (.-onopen ws) nil)
                  (set! (.-onmessage ws) (fn [e] (mbx (.-data e))))
                  (set! (.-onclose ws) (fn [e]
                                         (set! (.-onclose ws) nil)
                                         (close-dfv e)))
                  (s! [mbx ws close-dfv]))))
        (set! (.-onclose ws)
              (fn [e]
                (set! (.-onopen ws) nil)
                (set! (.-onclose ws) nil)
                (f! e)))
        (fn canceller []
          ;; canceller will be called(no gua) even this task succeed
          ;; should only cancel :connecting state websocket
          ;; see also some explanations from lib author about canceller:
          ;; https://clojurians.slack.com/archives/CL85MBPEF/p1714323302110269
          (when (= :connecting (get-state ws))
            (.close ws))))
      (catch :default e
        (f! e) #(do)))))

(defn- handle-close
  [x]
  (if (instance? js/CloseEvent x)
    (throw x)
    x))

(defn- create-mws*
  [url]
  (m/sp
    (if-let [[mbx ws close-dfv] (m/? (open-ws-task url))]
      {:raw-ws ws
       :send (fn [data]
               (m/sp
                 (handle-close
                  (m/?
                   (m/race close-dfv
                           (m/sp (while (< 4096 (.-bufferedAmount ws))
                                   (m/? (m/sleep 50)))
                                 (.send ws data)))))))
       :recv-flow
       (m/stream
        (m/ap
          (loop []
            (m/amb
             (handle-close
              (m/? (m/race close-dfv mbx)))
             (recur)))))}
      (throw (ex-info "open ws timeout(10s)" {:missionary/retry true})))))

(defn- closed?
  [m-ws]
  (contains? #{:closing :closed} (get-state (:raw-ws m-ws))))

(defn get-mws-create
  "Returns a task to get a mws(missionary-websocket), creating one if needed.
  Always try to produce NOT-closed websocket.
  When failed to open websocket, retry with backoff.
  TODO: retry ASAP once network condition changed"
  [url & {:keys [retry-count open-ws-timeout] :or {retry-count 10 open-ws-timeout 10000}}]
  (assert (and (pos-int? retry-count)
               (pos-int? open-ws-timeout))
          [retry-count open-ws-timeout])
  (let [*last-m-ws (atom nil)
        backoff-create-ws-task
        (c.m/backoff
         (take retry-count c.m/delays)
         (m/sp
           (let [m-ws
                 (try
                   (m/? (m/timeout (create-mws* url) open-ws-timeout))
                   (catch js/CloseEvent e
                     (throw (ex-info "failed to open websocket conn"
                                     {:missionary/retry true}
                                     e))))]
             (reset! *last-m-ws m-ws)
             m-ws)))]
    (m/sp
      (let [m-ws @*last-m-ws]
        (if (and m-ws (not (closed? m-ws)))
          m-ws
          (m/? backoff-create-ws-task))))))
(comment
  (defn close
    [m-ws]
    (.close (:raw-ws m-ws))))

(defn send
  "Returns a task: send message and return mws"
  [get-mws-task message]
  (m/sp
    (let [mws (m/? get-mws-task)
          decoded-message (rtc-const/data-to-ws-coercer message)
          message-str (js/JSON.stringify (clj->js (rtc-const/data-to-ws-encoder decoded-message)))]
      (m/? ((:send mws) message-str))
      mws)))

(defn recv-flow
  [m-ws]
  (m/eduction
   (map #(js->clj (js/JSON.parse %) :keywordize-keys true))
   (:recv-flow m-ws)))

(defn send&recv
  "Return a task: send message wait to recv its response and return it"
  [get-mws-task message & {:keys [timeout-ms] :or {timeout-ms 10000}}]
  (assert (pos-int? timeout-ms))
  (let [req-id (str (random-uuid))
        message (assoc message :req-id req-id)]
    (m/sp
      (let [mws (m/? (send get-mws-task message))]
        (m/? (m/timeout
              (m/reduce
               (fn [_ v]
                 (when (= req-id (:req-id v))
                   (reduced v)))
               (recv-flow mws))
              timeout-ms))))))

(comment
  (do
    (def url "wss://ws-dev.logseq.com/rtc-sync?token=????")
    (def get-mws-task (get-mws-create url)))
  (def cancel1
    (get-mws-task #(prn :s %) #(js/console.log %)))
  (cancel1)

  (do
    (def cancel ((m/sp
                   (m/? (send&recv get-mws-task {:action "list-graphs"} :timeout-ms 1000))
                   (m/? (send&recv get-mws-task {:action "list-graphs"})))
                 #(prn :s %) #(js/console.log :f %)))
    (cancel)))
