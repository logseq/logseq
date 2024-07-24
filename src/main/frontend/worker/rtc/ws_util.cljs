(ns frontend.worker.rtc.ws-util
  "Add RTC related logic to the function based on ws."
  (:require [frontend.worker.rtc.exception :as r.ex]
            [frontend.worker.rtc.ws :as ws]
            [frontend.worker.state :as worker-state]
            [goog.string :as gstring]
            [missionary.core :as m]))

(defn- handle-remote-ex
  [resp]
  (if-let [e ({:graph-not-exist r.ex/ex-remote-graph-not-exist
               :graph-not-ready r.ex/ex-remote-graph-not-ready}
              (:type (:ex-data resp)))]
    (throw e)
    resp))

(defn send&recv
  "Return a task: throw exception if recv ex-data response"
  [get-ws-create-task message]
  (m/sp
    (let [ws (m/? get-ws-create-task)
          opts (when (and (= "apply-ops" (:action message))
                          (< 400 (count (:ops message))))
                 {:timeout-ms 20000})]
      (handle-remote-ex (m/? (ws/send&recv ws message opts))))))

(defn get-ws-url
  [token]
  (gstring/format @worker-state/*rtc-ws-url token))
