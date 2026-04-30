(ns logseq.cli.e2e.coverage-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.coverage :as coverage]
            [logseq.cli.e2e.manifests :as manifests]))

(def sample-inventory
  {:excluded-command-prefixes ["sync" "login" "logout"]
   :scopes {:global {:options ["--help" "--version"]}
            :graph {:commands ["graph list" "graph create"]
                    :options ["--file" "--type"]}}})

(deftest reports-missing-commands-and-options
  (let [cases [{:id "global-help"
                :covers {:options {:global ["--help"]}}}
               {:id "graph-list"
                :covers {:commands ["graph list"]
                         :options {:graph ["--file"]}}}]
        report (coverage/coverage-report sample-inventory cases)]
    (is (= ["graph create"] (:missing-commands report)))
    (is (= ["--version"] (get-in report [:missing-options :global])))
    (is (= ["--type"] (get-in report [:missing-options :graph])))))

(deftest rejects-excluded-commands-in-inventory
  (let [inventory (assoc-in sample-inventory [:scopes :bad :commands] ["login"])]
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Excluded commands"
         (coverage/validate-inventory! inventory)))))

(deftest rejects-excluded-commands-in-case-covers
  (let [cases [{:id "bad-login"
                :covers {:commands ["logout"]}}]]
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Excluded commands"
         (coverage/validate-cases! sample-inventory cases)))))

(deftest complete-coverage-is-recognized
  (let [cases [{:id "global"
                :covers {:options {:global ["--help" "--version"]}}}
               {:id "graph-create"
                :covers {:commands ["graph create"]
                         :options {:graph ["--type"]}}}
               {:id "graph-list"
                :covers {:commands ["graph list"]
                         :options {:graph ["--file"]}}}]
        report (coverage/coverage-report sample-inventory cases)]
    (is (coverage/complete? report))))

(deftest sync-suite-manifests-cover-mvp-commands
  (let [inventory (manifests/load-inventory :sync)
        cases (manifests/load-cases :sync)
        covered-commands (set (mapcat #(get-in % [:covers :commands]) cases))
        report (coverage/coverage-report inventory cases)]
    (is (contains? covered-commands "sync upload"))
    (is (contains? covered-commands "sync download"))
    (is (contains? covered-commands "sync status"))
    (is (coverage/complete? report))))
