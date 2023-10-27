(ns frontend.db.rtc.mock
  (:require [clojure.core.async :as async]
            [frontend.db.rtc.const :as rtc-const]
            [spy.core :as spy]))

;;; websocket
(defrecord Mock-WebSocket [onopen onmessage onclose onerror readyState push-data-chan ^:mutable push-data-fn]
  Object
  (close [_]
    (prn :mock-ws :closed)
    (when (fn? onclose) (onclose)))
  (send [_ s]
    (let [msg (-> s
                  js/JSON.parse
                  (js->clj :keywordize-keys true)
                  rtc-const/data-to-ws-decoder)]
      (async/put! onmessage msg)))

  (set-push-data-fn [_ f]
    (set! push-data-fn f)))

(defn default-push-data-fn
  [msg push-data-chan]
  (case (:action msg)
    "register-graph-updates"
    (async/offer! push-data-chan (select-keys msg [:req-id]))
    ;; default

    nil))


(defn mock-websocket
  [data-from-ws-chan]
  (let [stop-push-data-loop-ch (async/chan)
        ws (->Mock-WebSocket nil (async/chan 10) nil nil 1
                             data-from-ws-chan (spy/spy default-push-data-fn))]
    (async/go-loop []
      (let [{:keys [stop msg]}
            (async/alt!
              stop-push-data-loop-ch {:stop true}
              (.-onmessage ws) ([msg] {:msg msg}))]
        (cond
          (or stop (nil? msg))
          (do (prn :mock-ws-loop-stop) nil)

          msg
          (do (when-let [push-data-fn (:push-data-fn ws)]
                (push-data-fn msg (:push-data-chan ws)))
              (recur)))))
    ws))


;; (defn mock-ws-push-data-fn
;;   [ws f]
;;   (.set-push-data-fn ws f))

;;; websocket ends ;;;;


;;; frontend.db.rtc.op mock
;; (def *ops-store (atom {}))

;; (defn <get-ops&local-tx
;;   [repo]

;;   )



;;; frontend.db.rtc.op mock ends
