(ns frontend.db.rtc.ws)


(defn send
  [ws message]
  (assert (= js/WebSocket.OPEN (.-readyState ws)))
  (.send ws (js/JSON.stringify (clj->js message))))

(defn stop
  [ws]
  (set! (.-onopen ws) nil)
  (set! (.-onclose ws) nil)
  (set! (.-onmessage ws) nil)
  (set! (.-onerror ws) nil)
  (.close ws))
