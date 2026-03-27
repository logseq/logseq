(ns logseq.cli.command.example-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.command.example :as example-command]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.command.query :as query-command]
            [logseq.cli.command.remove :as remove-command]
            [logseq.cli.command.search :as search-command]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.command.upsert :as upsert-command]))

(def ^:private phase1-base-table
  (vec (concat graph-command/entries
               list-command/entries
               upsert-command/entries
               remove-command/entries
               query-command/entries
               search-command/entries
               show-command/entries)))

(deftest test-phase1-target-filter
  (let [targets (example-command/phase1-target-entries phase1-base-table)
        groups (set (map (comp first :cmds) targets))]
    (testing "phase1 includes inspect/edit groups"
      (is (contains? groups "list"))
      (is (contains? groups "upsert"))
      (is (contains? groups "remove"))
      (is (contains? groups "query"))
      (is (contains? groups "search"))
      (is (contains? groups "show")))

    (testing "phase1 excludes graph management commands"
      (is (not (contains? groups "graph"))))))

(deftest test-build-example-entries
  (let [entries (example-command/build-example-entries phase1-base-table)
        cmds-set (set (map :cmds entries))]
    (testing "builds prefix selectors"
      (is (contains? cmds-set ["example" "upsert"]))
      (is (contains? cmds-set ["example" "query"]))
      (is (contains? cmds-set ["example" "show"])))

    (testing "builds exact selectors"
      (is (contains? cmds-set ["example" "upsert" "page"]))
      (is (contains? cmds-set ["example" "search" "block"]))
      (is (contains? cmds-set ["example" "query" "list"])))

    (testing "does not build uncovered selectors"
      (is (not (contains? cmds-set ["example" "graph"])))))

  (testing "all generated entries use :example command keyword"
    (is (every? #(= :example (:command %))
                (example-command/build-example-entries phase1-base-table)))))

(deftest test-build-action
  (testing "builds exact selector action"
    (let [result (example-command/build-action phase1-base-table ["example" "upsert" "page"])]
      (is (true? (:ok? result)))
      (is (= :example (get-in result [:action :type])))
      (is (= "upsert page" (get-in result [:action :selector])))
      (is (= ["upsert page"] (get-in result [:action :matched-commands])))
      (is (seq (get-in result [:action :examples])))))

  (testing "builds prefix selector action"
    (let [result (example-command/build-action phase1-base-table ["example" "upsert"])]
      (is (true? (:ok? result)))
      (is (= "upsert" (get-in result [:action :selector])))
      (is (<= 2 (count (get-in result [:action :matched-commands]))))))

  (testing "rejects unknown selector"
    (let [result (example-command/build-action phase1-base-table ["example" "graph"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code])))))

  (testing "rejects matched commands with missing examples metadata"
    (let [mock-base-table [{:cmds ["upsert" "page"]
                            :examples ["logseq upsert page --graph my-graph --page Home"]}
                           {:cmds ["upsert" "tag"]
                            :examples []}]
          result (example-command/build-action mock-base-table ["example" "upsert"])]
      (is (false? (:ok? result)))
      (is (= :missing-examples (get-in result [:error :code]))))))
