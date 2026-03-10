(ns logseq.agents.planning-workflow-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.agents.planning-workflow :as planning-workflow]))

(deftest build-plan-test
  (let [plan (planning-workflow/build-plan
              {:goal {:title "Plan Goal"
                      :description "Build a planner"}
               :tasks [{:title "Task A"
                        :description "Desc A"}
                       {:content "Explicit content"}]})]
    (is (= "Build a planner" (:goal-understanding plan)))
    (is (= [{:title "Task A"
             :content "Task A\nDesc A"
             :description "Desc A"}
            {:title "Task 2"
             :content "Explicit content"}]
           (:tasks plan)))))

(deftest run-awaits-approval-before-dispatch-test
  (async done
         (-> (planning-workflow/run nil
                                    {:planning-session-id "plan-1"
                                     :goal {:title "Plan Goal"
                                            :description "Build planning workflow"}
                                     :tasks [{:title "Task A"
                                              :description "Desc A"}]
                                     :project {:id "project-1"
                                               :repo-url "https://github.com/example/repo"
                                               :base-branch "main"}
                                     :agent {:provider "codex"}
                                     :runtime-provider "local-runner"
                                     :runner-id "runner-1"
                                     :require-approval true
                                     :approval {:decision "pending"}
                                     :auto-dispatch true
                                     :auto-replan true
                                     :replan-delay-sec 300}
                                    nil)
             (.then (fn [result]
                      (is (= "waiting-approval" (:status result)))
                      (is (= [] (:dispatch-sessions result)))
                      (is (= "pending" (get-in result [:planning-state :approval-status])))
                      (is (= "https://github.com/example/repo"
                             (get-in result [:planning-state :repo-aware :repo-url])))
                      (is (= [] (:scheduled-actions result)))
                      (done)))
             (.catch (fn [error]
                       (is false (str "unexpected error: " error))
                       (done))))))

(deftest run-dispatches-approved-repo-aware-tasks-and-schedules-replan-test
  (async done
         (-> (planning-workflow/run nil
                                    {:planning-session-id "plan-2"
                                     :goal {:title "Plan Goal"
                                            :description "Build planning workflow"}
                                     :tasks [{:title "Task A"
                                              :description "Desc A"}]
                                     :project {:id "project-1"
                                               :repo-url "https://github.com/example/repo"
                                               :base-branch "main"}
                                     :agent {:provider "codex"
                                             :mode "gpt-5-codex"}
                                     :runtime-provider "local-runner"
                                     :runner-id "runner-1"
                                     :require-approval true
                                     :approval {:decision "approved"}
                                     :auto-dispatch true
                                     :auto-replan true
                                     :replan-delay-sec 120}
                                    nil)
             (.then (fn [result]
                      (is (= "dispatching" (:status result)))
                      (is (= 1 (count (:dispatch-sessions result))))
                      (is (= "https://github.com/example/repo"
                             (get-in result [:dispatch-sessions 0 :project :repo-url])))
                      (is (= "codex"
                             (get-in result [:dispatch-sessions 0 :agent :provider])))
                      (is (= "local-runner" (get-in result [:dispatch-sessions 0 :runtime-provider])))
                      (is (= "runner-1" (get-in result [:dispatch-sessions 0 :runner-id])))
                      (is (= [{:type "replan"
                               :delay-sec 120}]
                             (:scheduled-actions result)))
                      (done)))
             (.catch (fn [error]
                       (is false (str "unexpected error: " error))
                       (done))))))

(deftest run-replanning-preserves-execution-owned-fields-test
  (async done
         (-> (planning-workflow/run nil
                                    {:planning-session-id "plan-3"
                                     :goal {:title "Plan Goal"}
                                     :tasks [{:task-uuid "task-1"
                                              :title "Task A (replanned)"
                                              :description "Desc A"}
                                             {:task-uuid "task-2"
                                              :title "Task B"
                                              :description "Desc B"}]
                                     :existing-tasks [{:task-uuid "task-1"
                                                       :title "Task A"
                                                       :status "Doing"
                                                       :session-id "sess-1"
                                                       :pr-url "https://github.com/example/repo/pull/1"}]
                                     :project {:id "project-1"
                                               :repo-url "https://github.com/example/repo"}
                                     :agent {:provider "codex"}
                                     :approval {:decision "approved"}
                                     :auto-dispatch false
                                     :auto-replan false}
                                    nil)
             (.then (fn [result]
                      (is (= "Task A" (get-in result [:reconciled-tasks 0 :title])))
                      (is (= "sess-1" (get-in result [:reconciled-tasks 0 :session-id])))
                      (is (= "https://github.com/example/repo/pull/1"
                             (get-in result [:reconciled-tasks 0 :pr-url])))
                      (is (= 2 (count (:reconciled-tasks result))))
                      (done)))
             (.catch (fn [error]
                       (is false (str "unexpected error: " error))
                       (done))))))
