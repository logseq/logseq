(ns client2-edits
  (:require [cljs.test :as t :refer [is]]
            [const]
            [datascript.core :as d]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.core :as rtc-core]
            [helper]
            [missionary.core :as m]))

(def step1--task-start-rtc
  (m/sp
    (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
      (is (nil? r)))))

(def step2--task-wait-page1-synced
  (c.m/backoff
   (take 4 c.m/delays)
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)
           page1 (d/pull @conn '[*] [:block/uuid const/page1-uuid])
           block1 (d/pull @conn '[*] [:block/uuid const/block1-uuid])]
       (when-not (:block/uuid page1)
         (throw (ex-info "wait page1 synced" {:missionary/retry true})))
       (is
        (= {:block/title "basic-edits-test"
            :block/name "basic-edits-test"
            :block/type "page"}
           (select-keys page1 [:block/title :block/name :block/type])))
       (is
        (= {:block/title "block1"
            :block/order "a0"
            :block/parent {:db/id (:db/id page1)}}
           (select-keys block1 [:block/title :block/order :block/parent])))))))
