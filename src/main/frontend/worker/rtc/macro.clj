(ns frontend.worker.rtc.macro
  "Macros that are used for rtc")

(def ^:private magic-str "YBTFRD")

(defmacro with-sub-data-from-ws
  "TODO: result-ch also sub exception response (:req-id=nil in response)
  - sub :data-from-ws-pub
  - run body, use `get-req-id` to get req-id, and `get-result-ch` to get result-ch
  - unsub :data-from-ws-pub"
  [state & body]
  (let [req-id-sym (symbol (str magic-str "-req-id"))
        result-ch-sym (symbol (str magic-str "-result-ch"))]
    `(let [~req-id-sym (str (random-uuid))
           data-from-ws-pub# (:data-from-ws-pub ~state)
           ~result-ch-sym (cljs.core.async/chan 1)]
       (cljs.core.async/sub data-from-ws-pub# ~req-id-sym ~result-ch-sym)
       (try
         ~@body
         (finally
           (cljs.core.async/unsub data-from-ws-pub# ~req-id-sym ~result-ch-sym))))))

(defmacro get-req-id [] (symbol (str magic-str "-req-id")))
(defmacro get-result-ch [] (symbol (str magic-str "-result-ch")))
