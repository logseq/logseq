(ns logseq.agents.routes-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.agents.routes :as routes]))

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
      (is (= "session-4" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "GET" "/sessions/session-5/terminal")]
      (is (= :sessions/terminal (:handler match)))
      (is (= "session-5" (get-in match [:path-params :session-id]))))))

(deftest match-route-sessions-events-test
  (testing "sessions events routes"
    (let [match (routes/match-route "GET" "/sessions/session-9/events")]
      (is (= :sessions/events (:handler match)))
      (is (= "session-9" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "GET" "/sessions/session-9/branches")]
      (is (= :sessions/branches (:handler match)))
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
      (is (= "session-13" (get-in match [:path-params :session-id]))))
    (let [match (routes/match-route "POST" "/sessions/session-14/snapshot")]
      (is (= :sessions/snapshot (:handler match)))
      (is (= "session-14" (get-in match [:path-params :session-id]))))))

(deftest match-route-runners-test
  (testing "runner routes"
    (let [match (routes/match-route "POST" "/runners")]
      (is (= :runners/register (:handler match))))
    (let [match (routes/match-route "GET" "/runners")]
      (is (= :runners/list (:handler match))))
    (let [match (routes/match-route "GET" "/runners/runner-1")]
      (is (= :runners/get (:handler match)))
      (is (= "runner-1" (get-in match [:path-params :runner-id]))))
    (let [match (routes/match-route "POST" "/runners/runner-2/heartbeat")]
      (is (= :runners/heartbeat (:handler match)))
      (is (= "runner-2" (get-in match [:path-params :runner-id]))))))

(deftest match-route-auth-test
  (testing "managed auth routes"
    (let [match (routes/match-route "POST" "/auth/chatgpt/import")]
      (is (= :auth.chatgpt/import (:handler match))))
    (let [match (routes/match-route "GET" "/auth/chatgpt/status")]
      (is (= :auth.chatgpt/status (:handler match))))))

(deftest match-route-planning-test
  (testing "planning routes"
    (let [match (routes/match-route "POST" "/planning/sessions")]
      (is (= :planning.sessions/create (:handler match))))
    (let [match (routes/match-route "GET" "/planning/sessions/plan-1")]
      (is (= :planning.sessions/get (:handler match)))
      (is (= "plan-1" (get-in match [:path-params :planning-session-id]))))
    (let [match (routes/match-route "POST" "/planning/sessions/plan-1/approval")]
      (is (= :planning.sessions/approval (:handler match)))
      (is (= "plan-1" (get-in match [:path-params :planning-session-id]))))
    (let [match (routes/match-route "POST" "/planning/sessions/plan-1/replan")]
      (is (= :planning.sessions/replan (:handler match)))
      (is (= "plan-1" (get-in match [:path-params :planning-session-id]))))
    (let [match (routes/match-route "GET" "/planning/chat/plan-1")]
      (is (= :planning.chat/transport (:handler match)))
      (is (= "plan-1" (get-in match [:path-params :planning-session-id]))))
    (let [match (routes/match-route "POST" "/planning/workflows")]
      (is (= :planning.workflows/create (:handler match))))
    (let [match (routes/match-route "GET" "/planning/workflows/workflow-1")]
      (is (= :planning.workflows/get (:handler match)))
      (is (= "workflow-1" (get-in match [:path-params :workflow-id]))))))
