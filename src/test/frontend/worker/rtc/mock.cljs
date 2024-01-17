(ns frontend.worker.rtc.mock
  (:require [clojure.core.async :as async]
            [frontend.worker.rtc.const :as rtc-const]
            [spy.core :as spy]))

;;; websocket
(defrecord Mock-WebSocket [onopen onmessage onclose onerror readyState push-data-to-client-chan ^:mutable handler-fn]
  Object
  (close [_]
    (prn :mock-ws :closed)
    (when (fn? onclose) (onclose)))
  (send [_ s]
    (let [msg (-> s
                  js/JSON.parse
                  (js->clj :keywordize-keys true)
                  rtc-const/data-to-ws-coercer)]
      (handler-fn msg push-data-to-client-chan)))

  (set-handler-fn [_ f]
    (set! handler-fn f)))

(defn default-handler
  [msg push-data-to-client-chan]
  (case (:action msg)
    "register-graph-updates"
    (async/offer! push-data-to-client-chan (select-keys msg [:req-id]))
    ;; default

    nil))


(defn mock-websocket
  [data-from-ws-chan]
  (->Mock-WebSocket nil (async/chan 10) nil nil 1
                    data-from-ws-chan (spy/spy default-handler)))


;; (defn set-ws-handler-fn
;;   [ws f]
;;   (.set-handler-fn ws f))

;;; websocket ends ;;;;
