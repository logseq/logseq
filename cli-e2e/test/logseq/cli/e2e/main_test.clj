(ns logseq.cli.e2e.main-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.main :as main]))

(def sample-cases
  [{:id "global-help"
    :cmd "node static/logseq-cli.js --help"
    :covers {:options {:global ["--help"]}}
    :tags [:global :smoke]}
   {:id "graph-create"
    :cmd "node static/logseq-cli.js graph create --graph demo"
    :covers {:commands ["graph create"]
             :options {:graph ["--type"]}}
    :tags [:graph]}
   {:id "graph-list"
    :cmd "node static/logseq-cli.js graph list"
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
                              :cmd "node static/logseq-cli.js --help"
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
                                    :cmd "node static/logseq-cli.js --help"
                                    :covers {:options {:global ["--help"]}}}
                                   {:id "graph-create"
                                    :cmd "node static/logseq-cli.js graph create --type markdown"
                                    :covers {:commands ["graph create"]
                                             :options {:graph ["--type"]}}}
                                   {:id "graph-list"
                                    :cmd "node static/logseq-cli.js graph list --file demo.edn"
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
                                      :cmd "node static/logseq-cli.js --help"
                                      :covers {:options {:global ["--help"]}}}
                                     {:id "graph-create"
                                      :cmd "node static/logseq-cli.js graph create --graph demo"
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
                                           :cmd (:cmd case)})}))]
    (is (string/includes? output "==> Running cli-e2e cases"))
    (is (string/includes? output "==> Build preflight: running..."))
    (is (string/includes? output "==> Build preflight: skipped (--skip-build)"))
    (is (string/includes? output "==> Prepared 2 case(s), starting execution"))
    (is (string/includes? output "[1/2] ▶ global-help"))
    (is (string/includes? output "[1/2] ✓ global-help"))
    (is (string/includes? output "[2/2] ▶ graph-list"))
    (is (string/includes? output "[2/2] ✓ graph-list"))
    (is (string/includes? output "Summary: 2 passed, 0 failed"))))

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
    (is (string/includes? output "--case ID"))))

(deftest test-single-case-enables-detailed-command-logging
  (let [command-opts (atom nil)
        output (with-out-str
                 (main/test! {:inventory complete-inventory
                              :cases [{:id "global-help"
                                       :cmd "node static/logseq-cli.js --help"
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
                                          (let [result (run-command {:cmd (:cmd case)
                                                                     :phase :main
                                                                     :step-index 1
                                                                     :step-total 1})]
                                            {:id (:id case)
                                             :status :ok
                                             :cmd (:cmd result)}) )}))]
    (is (string/includes? output "==> Detailed case logging enabled (--case global-help)"))
    (is (string/includes? output "    [main] $ node static/logseq-cli.js --help"))
    (is (true? (:stream-output? @command-opts)))))
