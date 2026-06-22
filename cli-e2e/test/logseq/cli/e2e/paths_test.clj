(ns logseq.cli.e2e.paths-test
  (:require [clojure.test :refer [deftest is]]
            [logseq.cli.e2e.paths :as paths]))

(deftest repo-root-does-not-depend-on-runtime-file-binding
  (let [expected (paths/repo-root)]
    (binding [*file* nil]
      (is (= expected
             (paths/repo-root))))))

(deftest required-artifacts-include-cli-runtime-contract
  (is (= [(paths/repo-path "cli" "_build" "default" "dist" "logseq-cli.js")
          (paths/repo-path "static" "logseq-cli.js")
          (paths/repo-path "static" "db-worker-node.js")
          (paths/repo-path "dist" "db-worker-node.js")
          (paths/repo-path "dist" "db-worker-node-assets.json")
          (paths/repo-path "deps" "db-sync" "worker" "dist" "node-adapter.js")]
         (paths/required-artifacts))))
