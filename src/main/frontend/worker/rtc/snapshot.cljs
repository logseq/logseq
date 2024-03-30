(ns frontend.worker.rtc.snapshot
  "snapshot remote graphs and related apis"
  (:require [frontend.worker.async-util :include-macros true :refer [<? go-try]]
            [frontend.worker.rtc.ws :as ws]))




(defn <snapshot-graph
  [state graph-uuid]
  (go-try
   (select-keys (<? (ws/<send&receive state {:action "snapshot-graph"
                                             :graph-uuid graph-uuid}))
                [:snapshot-uuid :graph-uuid])))

(defn <snapshot-list
  [state graph-uuid]
  (go-try
   (:snapshot-list
    (<? (ws/<send&receive state {:action "snapshot-list"
                                 :graph-uuid graph-uuid})))))
