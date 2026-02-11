(ns logseq.db-sync.worker-routes-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.routes.index :as routes]))

(deftest match-route-graphs-test
  (testing "graphs routes"
    (let [match (routes/match-route "GET" "/graphs")]
      (is (= :graphs/list (:handler match))))
    (let [match (routes/match-route "POST" "/graphs")]
      (is (= :graphs/create (:handler match))))
    (let [match (routes/match-route "GET" "/graphs/graph-1/access")]
      (is (= :graphs/access (:handler match)))
      (is (= "graph-1" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "GET" "/graphs/graph-2/members")]
      (is (= :graph-members/list (:handler match)))
      (is (= "graph-2" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "POST" "/graphs/graph-3/members")]
      (is (= :graph-members/create (:handler match))))
    (let [match (routes/match-route "PUT" "/graphs/graph-4/members/user-9")]
      (is (= :graph-members/update (:handler match)))
      (is (= "graph-4" (get-in match [:path-params :graph-id])))
      (is (= "user-9" (get-in match [:path-params :member-id]))))
    (let [match (routes/match-route "DELETE" "/graphs/graph-5")]
      (is (= :graphs/delete (:handler match)))
      (is (= "graph-5" (get-in match [:path-params :graph-id]))))))

(deftest match-route-e2ee-test
  (testing "e2ee routes"
    (let [match (routes/match-route "GET" "/e2ee/user-keys")]
      (is (= :e2ee/user-keys-get (:handler match))))
    (let [match (routes/match-route "POST" "/e2ee/user-keys")]
      (is (= :e2ee/user-keys-post (:handler match))))
    (let [match (routes/match-route "GET" "/e2ee/user-public-key")]
      (is (= :e2ee/user-public-key-get (:handler match))))
    (let [match (routes/match-route "GET" "/e2ee/graphs/graph-7/aes-key")]
      (is (= :e2ee/graph-aes-key-get (:handler match)))
      (is (= "graph-7" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "POST" "/e2ee/graphs/graph-8/aes-key")]
      (is (= :e2ee/graph-aes-key-post (:handler match)))
      (is (= "graph-8" (get-in match [:path-params :graph-id]))))
    (let [match (routes/match-route "POST" "/e2ee/graphs/graph-9/grant-access")]
      (is (= :e2ee/grant-access (:handler match)))
      (is (= "graph-9" (get-in match [:path-params :graph-id]))))))

(deftest match-route-method-mismatch-test
  (testing "method mismatch returns nil"
    (is (nil? (routes/match-route "GET" "/graphs/graph-1/members/user-9")))
    (is (nil? (routes/match-route "PUT" "/e2ee/user-keys")))))

(deftest match-route-sessions-test
  (testing "sessions routes"
    (let [match (routes/match-route "POST" "/sessions")]
      (is (= :sessions/create (:handler match))))
    (let [match (routes/match-route "GET" "/sessions/session-1")]
      (is (= :sessions/get (:handler match)))
      (is (= "session-1" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "POST" "/sessions/session-2/messages")]
      (is (= :sessions/messages (:handler match)))
      (is (= "session-2" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "POST" "/sessions/session-3/cancel")]
      (is (= :sessions/cancel (:handler match)))
      (is (= "session-3" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "GET" "/sessions/session-4/stream")]
      (is (= :sessions/stream (:handler match)))
      (is (= "session-4" (get-in match [:path-params :session-id]))))))

(deftest match-route-sessions-events-test
  (testing "sessions events routes"
    (let [match (routes/match-route "GET" "/sessions/session-9/events")]
      (is (= :sessions/events (:handler match)))
      (is (= "session-9" (get-in match [:path-params :session-id]))))))

(deftest match-route-sessions-control-test
  (testing "sessions control routes"
    (let [match (routes/match-route "POST" "/sessions/session-10/pause")]
      (is (= :sessions/pause (:handler match)))
      (is (= "session-10" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "POST" "/sessions/session-11/resume")]
      (is (= :sessions/resume (:handler match)))
      (is (= "session-11" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "POST" "/sessions/session-12/interrupt")]
      (is (= :sessions/interrupt (:handler match)))
      (is (= "session-12" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "POST" "/sessions/session-13/pr")]
      (is (= :sessions/pr (:handler match)))
      (is (= "session-13" (get-in match [:path-params :session-id]))))))
