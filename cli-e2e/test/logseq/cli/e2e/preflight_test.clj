(ns logseq.cli.e2e.preflight-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.preflight :as preflight]))

(deftest build-plan-matches-required-commands
  (is (= ["clojure -M:cljs compile logseq-cli db-worker-node"
          "yarn db-worker-node:compile:bundle"]
         (mapv :cmd preflight/build-plan))))

(deftest missing-artifacts-returns-unreadable-paths
  (let [artifacts ["/repo/static/logseq-cli.js"
                   "/repo/static/db-worker-node.js"
                   "/repo/dist/db-worker-node.js"]
        present? #{"/repo/static/logseq-cli.js"}]
    (is (= ["/repo/static/db-worker-node.js"
            "/repo/dist/db-worker-node.js"]
           (preflight/missing-artifacts artifacts present?)))))

(deftest skip-build-avoids-running-shell-commands
  (let [called? (atom false)
        result (preflight/run! {:skip-build true
                                :run-command (fn [_]
                                               (reset! called? true))
                                :file-exists? (constantly false)})]
    (is (= :skipped (:status result)))
    (is (false? @called?))))

(deftest build-runs-commands-before-verifying-artifacts
  (let [calls (atom [])
        existing (atom #{"/repo/static/logseq-cli.js"
                         "/repo/static/db-worker-node.js"
                         "/repo/dist/db-worker-node.js"
                         "/repo/dist/db-worker-node-assets.json"})]
    (with-redefs [logseq.cli.e2e.paths/repo-root (constantly "/repo")
                  logseq.cli.e2e.paths/required-artifacts (fn []
                                                            ["/repo/static/logseq-cli.js"
                                                             "/repo/static/db-worker-node.js"
                                                             "/repo/dist/db-worker-node.js"
                                                             "/repo/dist/db-worker-node-assets.json"])]
      (let [result (preflight/run! {:run-command (fn [{:keys [cmd]}]
                                                   (swap! calls conj cmd)
                                                   {:cmd cmd
                                                    :exit 0
                                                    :out ""
                                                    :err ""})
                                    :file-exists? @existing})]
        (is (= :ok (:status result)))
        (is (= ["clojure -M:cljs compile logseq-cli db-worker-node"
                "yarn db-worker-node:compile:bundle"]
               @calls))))))
