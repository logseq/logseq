(ns frontend.db.rtc.ws
  "TODO"                                ; @zhiyuan
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [frontend.db.rtc.const :as rtc-const]
            [cljs.core.async :as async :refer [<! chan go offer!]]))


(def ws-addr config/RTC-WS-URL)

(defn ws-listen
  [user-uuid data-from-ws-chan ws-opened-ch]
  (let [ws (js/WebSocket. (util/format ws-addr user-uuid))]
    (set! (.-onopen ws) (fn [_e] (async/close! ws-opened-ch)))
    (set! (.-onmessage ws) (fn [e]
                                     (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                                       (offer! data-from-ws-chan data))))

    (set! (.-onclose ws) (fn [_e] (println :ws-stopped)))
    ws))

(defn send!
  [ws message]
  (assert (= js/WebSocket.OPEN (.-readyState ws)))
  (let [decoded-message (rtc-const/data-to-ws-decoder message)]
    (assert (rtc-const/data-to-ws-validator decoded-message) message)
    (.send ws (js/JSON.stringify (clj->js (rtc-const/data-to-ws-encoder decoded-message))))))

(declare <send!)
(defn <ensure-ws-open!
  "ensure websocket in state is OPEN, if not, make a connection, and
  call init 'register-graph-updates' message"
  [state]
  (go
    (let [ws @(:*ws state)]
      (when (or (nil? ws)
                (> (.-readyState ws) js/WebSocket.OPEN))
        (let [ws-opened-ch (chan)
              ws* (ws-listen (:user-uuid state) (:data-from-ws-chan state) ws-opened-ch)]
          (<! ws-opened-ch)
          (reset! (:*ws state) ws*)
          (when-let [graph-uuid @(:*graph-uuid state)]
            (with-sub-data-from-ws state
              (<! (<send! state {:action "register-graph-updates" :req-id (get-req-id) :graph-uuid graph-uuid}))
              (<! (get-result-ch)))))))))

(defn <send!
  "ensure ws state=open, then send messages"
  [state message]
  (go
    (<! (<ensure-ws-open! state))
    (send! @(:*ws state) message)))


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
