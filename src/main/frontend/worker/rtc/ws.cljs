(ns frontend.worker.rtc.ws
  "Websocket related util-fns"
  (:require-macros
   [frontend.worker.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [cljs-http.client :as http]
            [cljs.core.async :as async :refer [<! chan offer!]]
            [frontend.worker.async-util :include-macros true :refer [<? go-try]]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.state :as worker-state]
            [goog.string :as gstring]))

(def WebSocketOPEN (if (= *target* "nodejs")
                     1
                     js/WebSocket.OPEN))

(defn ws-listen
  [token data-from-ws-chan ws-opened-ch]
  (let [ws (js/WebSocket. (gstring/format @worker-state/*rtc-ws-url token))]
    (set! (.-onopen ws) (fn [_e] (async/close! ws-opened-ch)))
    (set! (.-onmessage ws) (fn [e]
                             (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                               (offer! data-from-ws-chan data))))

    (set! (.-onclose ws) (fn [e]
                           (println :ws-stopped)
                           (js/console.error e)))
    ws))

(defn send!
  [ws message]
  (assert (= WebSocketOPEN (.-readyState ws)))
  (let [decoded-message (rtc-const/data-to-ws-coercer message)]
    (.send ws (js/JSON.stringify (clj->js (rtc-const/data-to-ws-encoder decoded-message))))))

(declare <send!)
(defn <ensure-ws-open!
  "ensure websocket in state is OPEN, if not, make a connection, and
  call init 'register-graph-updates' message"
  [state]
  (go-try
   (let [ws @(:*ws state)]
     (when (or (nil? ws)
               (> (.-readyState ws) WebSocketOPEN))
       (let [ws-opened-ch (chan)
             ws* (ws-listen @(:*token state) (:data-from-ws-chan state) ws-opened-ch)]
         (<! ws-opened-ch)
         (reset! (:*ws state) ws*)
         (when-let [graph-uuid @(:*graph-uuid state)]
           (with-sub-data-from-ws state
             (<? (<send! state {:action "register-graph-updates" :req-id (get-req-id) :graph-uuid graph-uuid}))
             (<! (get-result-ch)))))))))

(defn <send!
  "ensure ws state=open, then send messages"
  [state message]
  (go-try
   (<? (<ensure-ws-open! state))
   (send! @(:*ws state) message)))

(defn <send&receive
  "Send 'message' to ws, and return response of this request.
  When this response is too huge, backend will put it in s3 and return the presigned-url,
  this fn will handle this case."
  [state message]
  (go-try
   (with-sub-data-from-ws state
     (<? (<send! state (assoc message :req-id (get-req-id))))
     (let [resp (<! (get-result-ch))
           resp*
           (if-let [s3-presign-url (:s3-presign-url resp)]
             (let [{:keys [status body]} (<! (http/get s3-presign-url {:with-credentials? false}))]
               (if (http/unexceptional-status? status)
                 (js->clj (js/JSON.parse body) :keywordize-keys true)
                 {:req-id (get-req-id)
                  :ex-message "get s3 object failed"
                  :ex-data {:type :get-s3-object-failed :status status :body body}}))
             resp)]
       (rtc-const/data-from-ws-coercer resp*)))))


(defn stop
  [ws]
  (set! (.-onopen ws) nil)
  (set! (.-onclose ws) nil)
  (set! (.-onmessage ws) nil)
  (set! (.-onerror ws) nil)
  (.close ws))

(defn get-state
  [ws]
  (case (.-readyState ws)
    0 :connecting
    1 :open
    2 :closing
    3 :closed))
