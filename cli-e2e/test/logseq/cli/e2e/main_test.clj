(ns logseq.cli.e2e.main-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.cleanup :as cleanup]
            [logseq.cli.e2e.main :as main]
            [logseq.cli.e2e.manifests :as manifests]
            [logseq.cli.e2e.sync-fixture :as sync-fixture]))

(def sample-cases
  [{:id "global-help"
    :cmds ["node static/logseq-cli.js --help"]
    :covers {:options {:global ["--help"]}}
    :tags [:global :smoke]}
   {:id "graph-create"
    :cmds ["node static/logseq-cli.js graph create --graph demo"]
    :covers {:commands ["graph create"]
             :options {:graph ["--type"]}}
    :tags [:graph]}
   {:id "graph-list"
    :cmds ["node static/logseq-cli.js graph list"]
    :covers {:commands ["graph list"]
             :options {:graph ["--file"]}}
    :tags [:graph :smoke]}])

(def complete-inventory
  {:excluded-command-prefixes ["sync" "login" "logout"]
   :scopes {:global {:options ["--help"]}
            :graph {:commands ["graph create" "graph list"]
                    :options ["--type" "--file"]}}})

(deftest select-cases-supports-case-id
  (is (= ["graph-create"]
         (mapv :id (main/select-cases sample-cases {:case "graph-create"})))))

(deftest select-cases-supports-include-tags
  (is (= ["global-help" "graph-list"]
         (mapv :id (main/select-cases sample-cases {:include ["smoke"]})))))

(deftest run-fails-on-missing-coverage-before-case-execution
  (let [ran? (atom false)]
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Missing coverage"
         (main/run! {:inventory complete-inventory
                     :cases [{:id "global-help"
                              :cmds ["node static/logseq-cli.js --help"]
                              :covers {:options {:global ["--help"]}}}]
                     :skip-build true
                     :run-command (fn [_]
                                    (reset! ran? true)
                                    {:exit 0
                                     :out ""
                                     :err ""})})))
    (is (false? @ran?))))

(deftest run-succeeds-when-coverage-is-complete
  (let [result (main/run! {:inventory complete-inventory
                           :cases [{:id "global-help"
                                    :cmds ["node static/logseq-cli.js --help"]
                                    :covers {:options {:global ["--help"]}}}
                                   {:id "graph-create"
                                    :cmds ["node static/logseq-cli.js graph create --type markdown"]
                                    :covers {:commands ["graph create"]
                                             :options {:graph ["--type"]}}}
                                   {:id "graph-list"
                                    :cmds ["node static/logseq-cli.js graph list --file demo.edn"]
                                    :covers {:commands ["graph list"]
                                             :options {:graph ["--file"]}}}]
                           :skip-build true
                           :run-command (fn [_]
                                          {:exit 0
                                           :out ""
                                           :err ""})})]
    (is (= :ok (:status result)))
    (is (= 3 (count (:cases result))))))

(deftest targeted-run-skips-full-coverage-check
  (let [executed (atom [])]
    (let [result (main/run! {:inventory complete-inventory
                             :cases [{:id "global-help"
                                      :cmds ["node static/logseq-cli.js --help"]
                                      :covers {:options {:global ["--help"]}}}
                                     {:id "graph-create"
                                      :cmds ["node static/logseq-cli.js graph create --graph demo"]
                                      :covers {:commands ["graph create"]
                                               :options {:graph ["--type"]}}}]
                             :case "global-help"
                             :skip-build true
                             :run-command (fn [_]
                                            {:exit 0
                                             :out ""
                                             :err ""})
                             :run-case (fn [case _opts]
                                         (swap! executed conj (:id case))
                                         {:id (:id case)
                                          :status :ok})})]
      (is (= :ok (:status result)))
      (is (= ["global-help"] @executed)))))

(deftest run-invokes-case-progress-hooks
  (let [events (atom [])]
    (main/run! {:inventory complete-inventory
                :cases sample-cases
                :include ["smoke"]
                :skip-build true
                :run-command (fn [_]
                               {:exit 0
                                :out ""
                                :err ""})
                :run-case (fn [case _opts]
                            {:id (:id case)
                             :status :ok})
                :on-case-start (fn [{:keys [index total case]}]
                                 (swap! events conj [:start index total (:id case)]))
                :on-case-success (fn [{:keys [index total result]}]
                                   (swap! events conj [:ok index total (:id result)]))})
    (is (= [[:start 1 2 "global-help"]
            [:ok 1 2 "global-help"]
            [:start 2 2 "graph-list"]
            [:ok 2 2 "graph-list"]]
           @events))))

(deftest run-loads-non-sync-suite-by-default
  (let [suite-calls (atom [])]
    (with-redefs [manifests/load-inventory (fn [suite]
                                             (swap! suite-calls conj [:inventory suite])
                                             complete-inventory)
                  manifests/load-cases (fn [suite]
                                         (swap! suite-calls conj [:cases suite])
                                         sample-cases)]
      (let [result (main/run! {:skip-build true
                               :run-command (fn [_]
                                              {:exit 0
                                               :out ""
                                               :err ""})
                               :run-case (fn [case _opts]
                                           {:id (:id case)
                                            :status :ok})})]
        (is (= :ok (:status result))))
      (is (= [[:inventory :non-sync]
              [:cases :non-sync]]
             @suite-calls)))))

(deftest run-loads-sync-suite-when-explicit
  (let [suite-calls (atom [])
        sync-inventory {:excluded-command-prefixes ["login" "logout"]
                        :scopes {:sync {:commands ["sync upload"]
                                        :options []}}}
        sync-cases [{:id "sync-upload"
                     :cmds ["node static/logseq-cli.js sync upload"]
                     :covers {:commands ["sync upload"]}}]]
    (with-redefs [manifests/load-inventory (fn [suite]
                                             (swap! suite-calls conj [:inventory suite])
                                             sync-inventory)
                  manifests/load-cases (fn [suite]
                                         (swap! suite-calls conj [:cases suite])
                                         sync-cases)]
      (let [result (main/run! {:suite :sync
                               :skip-build true
                               :run-command (fn [_]
                                              {:exit 0
                                               :out ""
                                               :err ""})
                               :run-case (fn [case _opts]
                                           {:id (:id case)
                                            :status :ok})})]
        (is (= :ok (:status result))))
      (is (= [[:inventory :sync]
              [:cases :sync]]
             @suite-calls)))))

(deftest run-sync-suite-uses-suite-fixture-once
  (let [before-called (atom 0)
        after-called (atom 0)
        prepared-case-ids (atom [])
        run-case-seen (atom [])
        sync-inventory {:excluded-command-prefixes ["login" "logout"]
                        :scopes {:sync {:commands ["sync upload" "sync status"]
                                        :options []}}}
        sync-cases [{:id "sync-upload"
                     :cmds ["node static/logseq-cli.js sync upload"]
                     :covers {:commands ["sync upload"]}}
                    {:id "sync-status"
                     :cmds ["node static/logseq-cli.js sync status"]
                     :covers {:commands ["sync status"]}}]]
    (with-redefs [sync-fixture/before-suite! (fn [_]
                                               (swap! before-called inc)
                                               {:suite :sync})
                  sync-fixture/prepare-case (fn [case _suite-context]
                                              (swap! prepared-case-ids conj (:id case))
                                              (assoc case :prepared? true))
                  sync-fixture/after-suite! (fn [_ _]
                                              (swap! after-called inc))]
      (let [result (main/run! {:suite :sync
                               :inventory sync-inventory
                               :cases sync-cases
                               :skip-build true
                               :run-command (fn [_]
                                              {:exit 0
                                               :out ""
                                               :err ""})
                               :run-case (fn [case _opts]
                                           (swap! run-case-seen conj [(:id case) (:prepared? case)])
                                           {:id (:id case)
                                            :status :ok})})]
        (is (= :ok (:status result)))))
    (is (= 1 @before-called))
    (is (= 1 @after-called))
    (is (= ["sync-upload" "sync-status"] @prepared-case-ids))
    (is (= [["sync-upload" true]
            ["sync-status" true]]
           @run-case-seen))))

(deftest run-sync-suite-forwards-e2ee-password-to-prepare-case
  (let [seen-passwords (atom [])
        sync-inventory {:excluded-command-prefixes ["login" "logout"]
                        :scopes {:sync {:commands ["sync status"]
                                        :options []}}}
        sync-cases [{:id "sync-status"
                     :cmds ["node static/logseq-cli.js sync status"]
                     :covers {:commands ["sync status"]}}]]
    (with-redefs [sync-fixture/before-suite! (fn [_]
                                               {:suite :sync})
                  sync-fixture/prepare-case (fn [case suite-context]
                                              (swap! seen-passwords conj (:e2ee-password suite-context))
                                              case)
                  sync-fixture/after-suite! (fn [_ _] nil)]
      (main/run! {:suite :sync
                  :inventory sync-inventory
                  :cases sync-cases
                  :skip-build true
                  :e2ee-password "abc 123"
                  :run-command (fn [_]
                                 {:exit 0
                                  :out ""
                                  :err ""})
                  :run-case (fn [case _opts]
                              {:id (:id case)
                               :status :ok})}))
    (is (= ["abc 123"] @seen-passwords))))

(deftest list-cases-defaults-to-non-sync
  (let [selected-suite (atom nil)
        output (with-out-str
                 (with-redefs [manifests/load-cases (fn [suite]
                                                      (reset! selected-suite suite)
                                                      [{:id "non-sync-case"}])]
                   (main/list-cases! {})))]
    (is (= :non-sync @selected-suite))
    (is (string/includes? output "non-sync-case"))))

(deftest list-sync-cases-uses-sync-suite
  (let [selected-suite (atom nil)
        output (with-out-str
                 (with-redefs [manifests/load-cases (fn [suite]
                                                      (reset! selected-suite suite)
                                                      [{:id "sync-case"}])]
                   (main/list-sync-cases! {})))]
    (is (= :sync @selected-suite))
    (is (string/includes? output "sync-case"))))

(deftest test-prints-progress-and-summary
  (let [output (with-out-str
                 (main/test! {:inventory complete-inventory
                              :cases sample-cases
                              :include ["smoke"]
                              :skip-build true
                              :run-command (fn [_]
                                             {:exit 0
                                              :out ""
                                              :err ""})
                              :run-case (fn [case _opts]
                                          {:id (:id case)
                                           :status :ok
                                           :cmd (last (:cmds case))})}))]
    (is (string/includes? output "==> Running cli-e2e cases"))
    (is (string/includes? output "==> Build preflight: running..."))
    (is (string/includes? output "==> Build preflight: skipped (--skip-build)"))
    (is (string/includes? output "==> Prepared 2 case(s), starting execution"))
    (is (string/includes? output "[1/2] ▶ global-help"))
    (is (string/includes? output "[1/2] ✓ global-help"))
    (is (string/includes? output "[2/2] ▶ graph-list"))
    (is (string/includes? output "[2/2] ✓ graph-list"))
    (is (string/includes? output "Summary: 2 passed, 0 failed"))))

(deftest test-timings-prints-step-details-and-slow-summary
  (let [output (with-out-str
                 (main/test! {:inventory complete-inventory
                              :cases sample-cases
                              :include ["smoke"]
                              :skip-build true
                              :timings true
                              :run-command (fn [_]
                                             {:exit 0
                                              :out ""
                                              :err ""})
                              :run-case (fn [case _opts]
                                          (if (= "global-help" (:id case))
                                            {:id "global-help"
                                             :status :ok
                                             :timings [{:phase :setup
                                                        :step-index 1
                                                        :step-total 1
                                                        :elapsed-ms 12
                                                        :status :ok
                                                        :cmd "setup-global"}
                                                       {:phase :main
                                                        :step-index 1
                                                        :step-total 1
                                                        :elapsed-ms 55
                                                        :status :ok
                                                        :cmd "main-global"}]}
                                            {:id "graph-list"
                                             :status :ok
                                             :timings [{:phase :main
                                                        :step-index 1
                                                        :step-total 1
                                                        :elapsed-ms 210
                                                        :status :ok
                                                        :cmd "main-graph-list"}]}))}))]
    (is (string/includes? output "==> Step timing enabled (--timings)"))
    (is (string/includes? output "step timings:"))
    (is (string/includes? output "Slow steps (top 10):"))
    (is (string/includes? output "main-graph-list"))))

(deftest test-without-timings-keeps-output-concise
  (let [output (with-out-str
                 (main/test! {:inventory complete-inventory
                              :cases sample-cases
                              :include ["smoke"]
                              :skip-build true
                              :run-command (fn [_]
                                             {:exit 0
                                              :out ""
                                              :err ""})
                              :run-case (fn [case _opts]
                                          {:id (:id case)
                                           :status :ok
                                           :timings [{:phase :main
                                                      :step-index 1
                                                      :step-total 1
                                                      :elapsed-ms 88
                                                      :status :ok
                                                      :cmd "hidden-step"}]})}))]
    (is (not (string/includes? output "==> Step timing enabled (--timings)")))
    (is (not (string/includes? output "step timings:")))
    (is (not (string/includes? output "Slow steps (top 10):")))))

(deftest test-sync-timings-prints-step-details-and-slow-summary
  (let [sync-inventory {:excluded-command-prefixes ["login" "logout"]
                        :scopes {:sync {:commands ["sync status"]
                                        :options []}}}
        sync-cases [{:id "sync-status-case"
                     :cmds ["node static/logseq-cli.js sync status"]
                     :covers {:commands ["sync status"]}}]
        output (with-out-str
                 (main/test-sync! {:inventory sync-inventory
                                   :cases sync-cases
                                   :skip-build true
                                   :timings true
                                   :run-command (fn [_]
                                                  {:exit 0
                                                   :out ""
                                                   :err ""})
                                   :run-case (fn [case _opts]
                                               {:id (:id case)
                                                :status :ok
                                                :timings [{:phase :setup
                                                           :step-index 1
                                                           :step-total 1
                                                           :elapsed-ms 10
                                                           :status :ok
                                                           :cmd "sync-setup"}
                                                          {:phase :main
                                                           :step-index 1
                                                           :step-total 1
                                                           :elapsed-ms 150
                                                           :status :ok
                                                           :cmd "sync-main"}
                                                          {:phase :cleanup
                                                           :step-index 1
                                                           :step-total 1
                                                           :elapsed-ms 20
                                                           :status :ok
                                                           :cmd "sync-cleanup"}]})}))]
    (is (string/includes? output "==> Running cli-e2e cases"))
    (is (string/includes? output "==> Step timing enabled (--timings)"))
    (is (string/includes? output "step timings:"))
    (is (string/includes? output "Slow steps (top 10):"))
    (is (string/includes? output "sync-main"))))

(deftest test-help-prints-usage-and-skips-execution
  (let [ran? (atom false)
        result (atom nil)
        output (with-out-str
                 (reset! result
                         (main/test! {:help true
                                      :run-command (fn [_]
                                                     (reset! ran? true)
                                                     {:exit 0
                                                      :out ""
                                                      :err ""})
                                      :run-case (fn [_ _]
                                                  (reset! ran? true)
                                                  {:id "unexpected"
                                                   :status :ok})}))) ]
    (is (= :help (:status @result)))
    (is (false? @ran?))
    (is (string/includes? output "Usage: bb -f cli-e2e/bb.edn test [options]"))
    (is (string/includes? output "--skip-build"))
    (is (string/includes? output "--include TAG"))
    (is (string/includes? output "--case ID"))
    (is (string/includes? output "--timings"))
    (is (not (string/includes? output "--e2ee-password")))))

(deftest test-sync-help-prints-usage-and-skips-execution
  (let [ran? (atom false)
        result (atom nil)
        output (with-out-str
                 (reset! result
                         (main/test-sync! {:help true
                                           :run-command (fn [_]
                                                          (reset! ran? true)
                                                          {:exit 0
                                                           :out ""
                                                           :err ""})
                                           :run-case (fn [_ _]
                                                       (reset! ran? true)
                                                       {:id "unexpected"
                                                        :status :ok})})))]
    (is (= :help (:status @result)))
    (is (false? @ran?))
    (is (string/includes? output "Usage: bb -f cli-e2e/bb.edn test-sync [options]"))
    (is (string/includes? output "--skip-build"))
    (is (string/includes? output "--include TAG"))
    (is (string/includes? output "--case ID"))
    (is (string/includes? output "--timings"))
    (is (string/includes? output "--e2ee-password VALUE"))
    (is (string/includes? output "Default: 11111"))))

(deftest test-single-case-enables-detailed-command-logging
  (let [command-opts (atom nil)
        output (with-out-str
                 (main/test! {:inventory complete-inventory
                              :cases [{:id "global-help"
                                       :cmds ["node static/logseq-cli.js --help"]
                                       :covers {:options {:global ["--help"]}}}]
                              :case "global-help"
                              :skip-build true
                              :run-command (fn [{:keys [cmd] :as opts}]
                                             (reset! command-opts opts)
                                             {:cmd cmd
                                              :exit 0
                                              :out "ok"
                                              :err ""})
                              :run-case (fn [case {:keys [run-command]}]
                                          (let [result (run-command {:cmd (first (:cmds case))
                                                                     :phase :main
                                                                     :step-index 1
                                                                     :step-total 1})]
                                            {:id (:id case)
                                             :status :ok
                                             :cmd (:cmd result)}) )}))]
    (is (string/includes? output "==> Detailed case logging enabled (--case global-help)"))
    (is (string/includes? output "    [main 1/1] $ node static/logseq-cli.js --help"))
    (is (true? (:stream-output? @command-opts)))))

(deftest cleanup-help-prints-usage
  (let [output (with-out-str (main/cleanup! {:help true}))]
    (is (string/includes? output "Usage: bb -f cli-e2e/bb.edn cleanup"))
    (is (string/includes? output "Terminate cli-e2e db-worker-node processes"))
    (is (string/includes? output "Terminate db-sync server listeners on port 18080"))
    (is (string/includes? output "--dry-run"))))

(deftest cleanup-prints-summary-and-returns-status
  (with-redefs [cleanup/cleanup-db-worker-processes! (fn [_] {:found-pids [101 202]
                                                               :killed-pids [101]
                                                               :failed-pids [202]})
                cleanup/cleanup-db-sync-port-processes! (fn [_] {:found-pids [303]
                                                                  :killed-pids [303]
                                                                  :failed-pids []})
                cleanup/cleanup-temp-graph-dirs! (fn [_] {:found-dirs ["/tmp/logseq-cli-e2e-a/graphs"
                                                                        "/tmp/logseq-cli-e2e-b/graphs"]
                                                           :removed-dirs ["/tmp/logseq-cli-e2e-a/graphs"]
                                                           :failed-dirs ["/tmp/logseq-cli-e2e-b/graphs"]})]
    (let [result (atom nil)
          output (with-out-str
                   (reset! result (main/cleanup! {})))]
      (is (= :ok (:status @result)))
      (is (= [101] (get-in @result [:processes :killed-pids])))
      (is (= [303] (get-in @result [:db-sync-port-processes :killed-pids])))
      (is (= ["/tmp/logseq-cli-e2e-a/graphs"] (get-in @result [:temp-graphs :removed-dirs])))
      (is (string/includes? output "db-worker-node processes: found 2, killed 1, failed 1"))
      (is (string/includes? output "db-sync server processes (port 18080): found 1, killed 1, failed 0"))
      (is (string/includes? output "temp graph directories: found 2, removed 1, failed 1")))))

(deftest cleanup-dry-run-prints-summary-and-passes-option
  (let [process-opts (atom nil)
        db-sync-opts (atom nil)
        dir-opts (atom nil)]
    (with-redefs [cleanup/cleanup-db-worker-processes! (fn [opts]
                                                          (reset! process-opts opts)
                                                          {:dry-run? true
                                                           :found-pids [101 202]
                                                           :would-kill-pids [101 202]
                                                           :killed-pids []
                                                           :failed-pids []})
                  cleanup/cleanup-db-sync-port-processes! (fn [opts]
                                                            (reset! db-sync-opts opts)
                                                            {:dry-run? true
                                                             :found-pids [303]
                                                             :would-kill-pids [303]
                                                             :killed-pids []
                                                             :failed-pids []})
                  cleanup/cleanup-temp-graph-dirs! (fn [opts]
                                                     (reset! dir-opts opts)
                                                     {:dry-run? true
                                                      :found-dirs ["/tmp/logseq-cli-e2e-a/graphs"]
                                                      :would-remove-dirs ["/tmp/logseq-cli-e2e-a/graphs"]
                                                      :removed-dirs []
                                                      :failed-dirs []})]
      (let [result (atom nil)
            output (with-out-str
                     (reset! result (main/cleanup! {:dry-run true})))]
        (is (= {:dry-run true} @process-opts))
        (is (= {:dry-run true} @db-sync-opts))
        (is (= {:dry-run true} @dir-opts))
        (is (= :ok (:status @result)))
        (is (true? (get-in @result [:processes :dry-run?])))
        (is (true? (get-in @result [:db-sync-port-processes :dry-run?])))
        (is (true? (get-in @result [:temp-graphs :dry-run?])))
        (is (string/includes? output "[dry-run] db-worker-node processes: found 2, would kill 2"))
        (is (string/includes? output "[dry-run] db-sync server processes (port 18080): found 1, would kill 1"))
        (is (string/includes? output "[dry-run] temp graph directories: found 1, would remove 1"))))))
