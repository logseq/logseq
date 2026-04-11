(ns logseq.cli.e2e.sync-fixture-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is]]
            [logseq.cli.e2e.sync-fixture :as sync-fixture]))

(deftest prepare-case-removes-heavy-steps-and-injects-lightweight-ones
  (let [suite-context {:suite-auth-path "/tmp/suite/auth.json"
                       :suite-config-path "/tmp/suite/config.edn"
                       :sync-port "18080"
                       :sync-http-base "http://127.0.0.1:18080"
                       :sync-ws-url "ws://127.0.0.1:18080/sync/%s"}
        input-case {:id "sync-case"
                    :vars {:existing true}
                    :setup ["mkdir -p '{{tmp-dir}}/home/logseq'"
                            "cp ~/logseq/auth.json '{{tmp-dir}}/home/logseq/auth.json'"
                            "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{config-path}}'"
                            "python3 '{{repo-root}}/cli-e2e/scripts/db_sync_server.py' start --port 18080"
                            "{{cli-home}} --data-dir {{data-dir-arg}} --config {{config-path-arg}} --output json graph create --graph {{graph-arg}} >/dev/null"]
                    :cleanup ["{{cli}} --data-dir {{data-dir-arg}} --config {{config-path-arg}} --output json server stop --graph {{graph-arg}}"
                              "python3 '{{repo-root}}/cli-e2e/scripts/db_sync_server.py' stop --pid-file '{{tmp-dir}}/db-sync-server.pid'"]}
        prepared (sync-fixture/prepare-case input-case suite-context)]
    (is (= "sync-case" (:id prepared)))
    (is (= 5 (count (:setup prepared))))
    (is (= "mkdir -p '{{tmp-dir}}/home/logseq'" (first (:setup prepared))))
    (is (string/includes? (second (:setup prepared)) "suite-auth-path"))
    (is (not-any? #(string/includes? % "prepare_sync_config.py") (:setup prepared)))
    (is (not-any? #(string/includes? % "db_sync_server.py' start") (:setup prepared)))
    (is (= ["{{cli}} --data-dir {{data-dir-arg}} --config {{config-path-arg}} --output json server stop --graph {{graph-arg}}"]
           (:cleanup prepared)))
    (is (= "/tmp/suite/auth.json" (get-in prepared [:vars :suite-auth-path])))
    (is (= "http://127.0.0.1:18080" (get-in prepared [:vars :sync-http-base])))))

(deftest before-and-after-suite-run-expected-commands
  (let [calls (atom [])
        run-command (fn [opts]
                      (swap! calls conj opts)
                      {:exit 0
                       :out ""
                       :err ""})
        suite-context (sync-fixture/before-suite! {:run-command run-command})]
    (is (= 3 (count @calls)))
    (is (string/includes? (:cmd (first @calls)) "cp ~/logseq/auth.json"))
    (is (string/includes? (:cmd (second @calls)) "prepare_sync_config.py"))
    (is (string/includes? (:cmd (nth @calls 2)) "db_sync_server.py"))
    (is (string/includes? (:cmd (nth @calls 2)) " start "))
    (is (string/includes? (:cmd (nth @calls 2)) "--port 18080"))
    (is (string/includes? (:cmd (nth @calls 2)) "--startup-timeout-s 60"))
    (sync-fixture/after-suite! suite-context {:run-command run-command})
    (is (= 4 (count @calls)))
    (is (string/includes? (:cmd (last @calls)) "db_sync_server.py"))
    (is (string/includes? (:cmd (last @calls)) " stop "))
    (is (false? (:throw? (last @calls))))))
