(ns logseq.agents.runtime-transport-test-runner
  (:require [cljs.test :as ct]
            [logseq.agents.handler-test]
            [logseq.agents.planning-workflow-test]
            [logseq.agents.request-test]
            [logseq.agents.routes-test]
            [logseq.agents.runtime-provider-test]
            [logseq.agents.sandbox-test]
            [shadow.test :as st]
            [shadow.test.env :as env]))

(derive ::node ::ct/default)

(defmethod ct/report [::node :end-run-tests] [m]
  (if (ct/successful? m)
    (js/process.exit 0)
    (js/process.exit 1)))

(defn ^:dev/after-load reset-test-data! []
  (when-let [test-data (env/get-test-data)]
    (env/reset-test-data! test-data)))

(defn main [& _args]
  (reset-test-data!)
  (ct/test-vars [#'logseq.agents.runtime-provider-test/local-runner-provider-provision-test
                 #'logseq.agents.planning-workflow-test/build-plan-test
                 #'logseq.agents.planning-workflow-test/run-awaits-approval-before-dispatch-test
                 #'logseq.agents.planning-workflow-test/run-dispatches-approved-repo-aware-tasks-and-schedules-replan-test
                 #'logseq.agents.planning-workflow-test/run-replanning-preserves-execution-owned-fields-test
                 #'logseq.agents.routes-test/match-route-planning-test
                 #'logseq.agents.request-test/normalize-planning-create-test
                 #'logseq.agents.request-test/normalize-planning-workflow-create-test
                 #'logseq.agents.request-test/normalize-planning-workflow-create-defaults-test
                 #'logseq.agents.handler-test/planning-session-get-requires-planning-store-test
                 #'logseq.agents.handler-test/planning-chat-transport-requires-agent-binding-test
                 #'logseq.agents.handler-test/planning-session-replan-requires-workflow-binding-test
                 #'logseq.agents.sandbox-test/session-endpoint-test
                 #'logseq.agents.sandbox-test/create-session-payload-test
                 #'logseq.agents.sandbox-test/send-message-uses-acp-prompt-test
                 #'logseq.agents.sandbox-test/acp-envelope-event-test]))
