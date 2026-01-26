(ns logseq.db-sync.worker-routes-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.routes :as routes]))

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
