(ns frontend.worker.rtc.ws
  "Websocket wrapped by missionary.
  based on
  https://github.com/ReilySiegel/missionary-websocket/blob/master/src/com/reilysiegel/missionary/websocket.cljs"
  (:require [cljs-http.client :as http]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.exception :as r.ex]
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

(defn closed?
  [mws]
  (contains? #{:closing :closed} (get-state (:raw-ws mws))))

(defn mws-create
  "Return a task that create a mws (missionary wrapped websocket).
  When failed to open websocket, retry with backoff.
  TODO: retry ASAP once network condition changed"
  [url & {:keys [retry-count open-ws-timeout]
          :or {retry-count 10 open-ws-timeout 10000}}]
  (assert (and (pos-int? retry-count)
               (pos-int? open-ws-timeout))
          [retry-count open-ws-timeout])
  (c.m/backoff
   (take retry-count c.m/delays)
   (m/sp
     (try
       (if-let [ws (m/? (m/timeout (create-mws* url) open-ws-timeout))]
         ws
         (throw (ex-info "open websocket timeout" {:missionary/retry true})))
       (catch js/CloseEvent e
         (throw (ex-info "failed to open websocket conn"
                         {:missionary/retry true}
                         e)))))))

(defn create-mws-state-flow
  [mws]
  (m/relieve
   (m/observe
    (fn ctor [emit!]
      (let [ws (:raw-ws mws)
            old-onclose (.-onclose ws)
            old-onerror (.-onerror ws)
            old-onopen (.-onopen ws)]
        (set! (.-onclose ws) (fn [e]
                               (when old-onclose (old-onclose e))
                               (emit! (get-state ws))))
        (set! (.-onerror ws) (fn [e]
                               (when old-onerror (old-onerror e))
                               (emit! (get-state ws))))
        (set! (.-onopen ws) (fn [e]
                              (when old-onopen (old-onopen e))
                              (emit! (get-state ws))))
        (emit! (get-state ws))
        (fn dtor []
          (set! (.-onclose ws) old-onclose)
          (set! (.-onerror ws) old-onerror)
          (set! (.-onopen ws) old-onopen)))))))

(comment
  (defn close
    [m-ws]
    (.close (:raw-ws m-ws))))

(defn send
  "Returns a task: send message"
  [mws message]
  (m/sp
    (let [decoded-message (rtc-const/data-to-ws-coercer message)
          message-str (js/JSON.stringify (clj->js (rtc-const/data-to-ws-encoder decoded-message)))]
      (m/? ((:send mws) message-str)))))

(defn- recv-flow*
  "Throw if recv `Internal server error`"
  [m-ws]
  (assert (some? (:recv-flow m-ws)) m-ws)
  (m/eduction
   (map #(js->clj (js/JSON.parse %) :keywordize-keys true))
   (map (fn [m]
          (if (= "Internal server error" (:message m))
            (throw r.ex/ex-unknown-server-error)
            m)))
   (map rtc-const/data-from-ws-coercer)
   (:recv-flow m-ws)))

(defn recv-flow
  "Throw if recv `Internal server error`.
  Also take care of :s3-presign-url.(when response is too huge, it's stored in s3)"
  [m-ws]
  (let [f (recv-flow* m-ws)]
    (m/ap
      (let [resp (m/?> f)]
        (if-let [s3-presign-url (:s3-presign-url resp)]
          (let [{:keys [status body]} (c.m/<? (http/get s3-presign-url {:with-credentials? false}))]
            (if (http/unexceptional-status? status)
              (rtc-const/data-from-ws-coercer (js->clj (js/JSON.parse body) :keywordize-keys true))
              {:req-id (:req-id resp)
               :ex-message "get s3 object failed"
               :ex-data {:type :rtc.exception/get-s3-object-failed :status status :body body}}))
          resp)))))

(defn- send&recv*
  "Return a task: send message wait to recv its response and return it.
  Throw if timeout"
  [mws message & {:keys [timeout-ms] :or {timeout-ms 10000}}]
  {:pre [(pos-int? timeout-ms)
         (some? (:req-id message))]}
  (m/sp
    (m/? (send mws message))
    (let [req-id (:req-id message)
          result (m/?
                  (m/timeout
                   (m/reduce
                    (fn [_ v]
                      (when (= req-id (:req-id v))
                        (reduced v)))
                    (recv-flow mws))
                   timeout-ms))]
      (when-not result
        (throw (ex-info (str "recv timeout (" timeout-ms "ms)") {:missionary/retry true
                                                                 :message message})))
      result)))

(defn send&recv
  "Return a task that send the message then wait to recv its response.
  Throw if timeout"
  [mws message & {:keys [timeout-ms] :or {timeout-ms 10000}}]
  (m/sp
    (let [req-id (str (random-uuid))
          message (assoc message :req-id req-id)]
      (m/? (send&recv* mws message :timeout-ms timeout-ms)))))
