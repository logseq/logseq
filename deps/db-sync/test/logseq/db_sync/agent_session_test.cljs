(ns logseq.db-sync.agent-session-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.agent.session :as session]))

(deftest session-initialization-test
  (testing "builds a created session with task and audit"
    (let [task {:id "task-1"}
          audit {:requested-by "user-1"}
          now 123
          s (session/initial-session task audit now)]
      (is (= "task-1" (:id s)))
      (is (= "created" (:status s)))
      (is (= task (:task s)))
      (is (= audit (:audit s)))
      (is (= now (:created-at s)))
      (is (= now (:updated-at s))))))

(deftest session-event-transition-test
  (testing "session status transitions on lifecycle events"
    (let [task {:id "task-2"}
          audit {:requested-by "user-2"}
          now 100
          s0 (session/initial-session task audit now)
          [s1 events1 e1] (session/append-event s0 [] {:type "session.running" :data {:ok true} :event-id "e1" :ts 101})
          [s2 events2 _e2] (session/append-event s1 events1 {:type "session.paused" :data {} :event-id "e2" :ts 102})
          [s3 events3 _e3] (session/append-event s2 events2 {:type "session.completed" :data {} :event-id "e3" :ts 103})]
      (is (= "running" (:status s1)))
      (is (= "paused" (:status s2)))
      (is (= "completed" (:status s3)))
      (is (= 3 (count events3)))
      (is (= "e1" (:event-id e1)))
      (is (= 103 (:updated-at s3))))))

(deftest session-event-defaults-test
  (testing "append-event assigns defaults when missing"
    (let [task {:id "task-3"}
          audit {:requested-by "user-3"}
          s0 (session/initial-session task audit 1)
          [s1 events1 e1] (session/append-event s0 [] {:type "audit.log" :data {:msg "hi"}})]
      (is (= "created" (:status s1)))
      (is (= 1 (count events1)))
      (is (string? (:event-id e1)))
      (is (number? (:ts e1))))))
