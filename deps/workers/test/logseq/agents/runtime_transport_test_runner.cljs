(ns logseq.agents.runtime-transport-test-runner
  (:require [cljs.test :as ct]
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
                 #'logseq.agents.sandbox-test/session-endpoint-test
                 #'logseq.agents.sandbox-test/create-session-payload-test
                 #'logseq.agents.sandbox-test/send-message-uses-acp-prompt-test
                 #'logseq.agents.sandbox-test/acp-envelope-event-test]))
