(ns frontend.db.rtc.ws
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [cljs.core.async :as async :refer [<! >! chan go go-loop offer!
                                               poll! timeout]]))


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
  (.send ws (js/JSON.stringify (clj->js message))))

(declare <send!)
(defn <ensure-ws-open!
  [state]
  (go
    (let [ws @(:*ws state)]
      (when (> (.-readyState ws) js/WebSocket.OPEN)
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
