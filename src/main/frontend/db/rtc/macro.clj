(ns frontend.db.rtc.macro)


(defmacro with-sub-data-from-ws
  "- sub :data-from-ws-pub
  - run body, use `get-req-id` to get req-id, and `get-result-ch` to get result-ch
  - unsub :data-from-ws-pub"
  [state & body]
  `(let [~'req-id (str (random-uuid))
         data-from-ws-pub# (:data-from-ws-pub ~state)
         ~'result-ch (cljs.core.async/chan 1)]
     (cljs.core.async/sub data-from-ws-pub# ~'req-id ~'result-ch)
     (try
       ~@body
       (finally
         (cljs.core.async/unsub data-from-ws-pub# ~'req-id ~'result-ch)))))


(defmacro get-req-id [] 'req-id)
(defmacro get-result-ch [] 'result-ch)
