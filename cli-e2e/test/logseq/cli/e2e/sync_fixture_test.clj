(ns logseq.cli.e2e.sync-fixture-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.sync-fixture :as sync-fixture]))

(deftest prepare-case-injects-case-local-sync-resources
  (let [suite-context {:sync-port "18080"
                       :sync-http-base "http://127.0.0.1:18080"
                       :sync-ws-url "ws://127.0.0.1:18080/sync/%s"}
        input-case {:id "sync-case"
                    :vars {:existing true}
                    :setup ["mkdir -p '{{tmp-dir}}/graphs-b'"
                            "mkdir -p '{{tmp-dir}}/home/logseq'"
                            "cp ~/logseq/auth.json '{{tmp-dir}}/home/logseq/auth.json'"
                            "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{config-path}}' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
                            "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{tmp-dir}}/cli-b.edn' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
                            "python3 '{{repo-root}}/cli-e2e/scripts/db_sync_server.py' start --port 18080"
                            "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json graph create --graph {{graph-arg}} >/dev/null"]
                    :cleanup ["{{cli}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json server stop --graph {{graph-arg}}"
                              "python3 '{{repo-root}}/cli-e2e/scripts/db_sync_server.py' stop --pid-file '{{tmp-dir}}/db-sync-server.pid'"]}
        prepared (sync-fixture/prepare-case input-case suite-context)]
    (is (= "sync-case" (:id prepared)))
    (is (= ["mkdir -p '{{tmp-dir}}/graphs-b'"
            "mkdir -p '{{tmp-dir}}/home/logseq'"
            "cp ~/logseq/auth.json '{{tmp-dir}}/home/logseq/auth.json'"
            "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{config-path}}' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
            "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{tmp-dir}}/cli-b.edn' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
            "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json graph create --graph {{graph-arg}} >/dev/null"]
           (:setup prepared)))
    (is (= ["{{cli}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json server stop --graph {{graph-arg}}"]
           (:cleanup prepared)))
    (is (= "http://127.0.0.1:18080" (get-in prepared [:vars :sync-http-base])))
    (is (= "ws://127.0.0.1:18080/sync/%s" (get-in prepared [:vars :sync-ws-url])))
    (is (= "18080" (get-in prepared [:vars :sync-port])))
    (is (= "11111" (get-in prepared [:vars :e2ee-password])))
    (is (= "11111" (get-in prepared [:vars :e2ee-password-arg])))
    (is (not (contains? (:vars prepared) :suite-auth-path)))
    (is (not (contains? (:vars prepared) :suite-config-path)))
    (is (not-any? #(string/includes? % "suite-auth-path") (:setup prepared)))
    (is (not-any? #(string/includes? % "suite-config-path") (:setup prepared)))
    (is (not-any? #(string/includes? % "db_sync_server.py' start") (:setup prepared)))
    (is (not-any? #(string/includes? % "db_sync_server.py' stop") (:cleanup prepared)))))

(deftest prepare-case-places-case-local-auth-before-cli-sync-commands
  (let [suite-context {:suite-tmp-dir "/tmp/sync-suite"
                       :sync-port "18080"
                       :sync-http-base "http://127.0.0.1:18080"
                       :sync-ws-url "ws://127.0.0.1:18080/sync/%s"}
        prepared (sync-fixture/prepare-case
                  {:id "sync-case"
                   :setup ["mkdir -p '{{tmp-dir}}/graphs-b'"
                           "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json graph create --graph {{graph-arg}} >/dev/null"
                           "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json sync ensure-keys --graph {{graph-arg}} --e2ee-password {{e2ee-password-arg}}"]
                   :cleanup []}
                  suite-context)
        setup (:setup prepared)
        bootstrap-cmd (nth setup 5)]
    (is (= "mkdir -p '{{tmp-dir}}/graphs-b'" (first setup)))
    (is (= "mkdir -p '{{tmp-dir}}/home/logseq'" (second setup)))
    (is (= "cp ~/logseq/auth.json '{{tmp-dir}}/home/logseq/auth.json'" (nth setup 2)))
    (is (= "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{config-path}}' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
           (nth setup 3)))
    (is (= "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{tmp-dir}}/cli-b.edn' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
           (nth setup 4)))
    (is (string/includes? bootstrap-cmd "sync ensure-keys"))
    (is (string/includes? bootstrap-cmd "--upload-keys"))
    (is (string/includes? bootstrap-cmd "/tmp/sync-suite/user-rsa-keys.lock"))
    (is (string/includes? bootstrap-cmd "/tmp/sync-suite/user-rsa-keys.ready"))
    (is (= "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json graph create --graph {{graph-arg}} >/dev/null"
           (nth setup 6)))
    (is (= "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json sync ensure-keys --graph {{graph-arg}} --e2ee-password {{e2ee-password-arg}}"
           (nth setup 7)))
    (is (not-any? #(and (string/includes? % "sync ensure-keys")
                        (not= % bootstrap-cmd)
                        (string/includes? % "--upload-keys"))
                  setup))))

(deftest prepare-case-accepts-custom-e2ee-password
  (let [suite-context {:sync-port "18080"
                       :sync-http-base "http://127.0.0.1:18080"
                       :sync-ws-url "ws://127.0.0.1:18080/sync/%s"
                       :e2ee-password "pass word"}
        prepared (sync-fixture/prepare-case {:id "sync-case"
                                             :setup []
                                             :cleanup []}
                                            suite-context)]
    (is (= "pass word" (get-in prepared [:vars :e2ee-password])))
    (is (= "'pass word'" (get-in prepared [:vars :e2ee-password-arg])))))

(deftest before-and-after-suite-only-manage-shared-sync-server-lifecycle
  (let [calls (atom [])
        run-command (fn [opts]
                      (swap! calls conj opts)
                      {:exit 0
                       :out ""
                       :err ""})
        suite-context (sync-fixture/before-suite! {:run-command run-command})]
    (testing "before-suite only starts the shared server"
      (is (= 1 (count @calls)))
      (is (string/includes? (:cmd (first @calls)) "db_sync_server.py"))
      (is (string/includes? (:cmd (first @calls)) " start "))
      (is (string/includes? (:cmd (first @calls)) "--data-dir"))
      (is (not (string/includes? (:cmd (first @calls)) "--root-dir")))
      (is (string/includes? (:cmd (first @calls)) "--port 18080"))
      (is (string/includes? (:cmd (first @calls)) "--startup-timeout-s 60"))
      (is (not (string/includes? (:cmd (first @calls)) "prepare_sync_config.py")))
      (is (not (contains? suite-context :suite-auth-path)))
      (is (not (contains? suite-context :suite-config-path))))
    (sync-fixture/after-suite! suite-context {:run-command run-command})
    (testing "after-suite only stops the shared server once"
      (is (= 2 (count @calls)))
      (is (string/includes? (:cmd (last @calls)) "db_sync_server.py"))
      (is (string/includes? (:cmd (last @calls)) " stop "))
      (is (false? (:throw? (last @calls)))))))
