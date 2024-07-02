(ns frontend.worker.rtc.ws-util
  "Add RTC related logic to the function based on ws."
  (:require [missionary.core :as m]
            [frontend.worker.rtc.exception :as r.ex]
            [frontend.worker.rtc.ws :as ws]))

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
    (let [ws (m/? get-ws-create-task)]
      (handle-remote-ex (m/? (ws/send&recv ws message))))))
