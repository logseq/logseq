(ns logseq.cli.command.completions-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.command.completions :as completions-command]
            [logseq.cli.commands :as commands]))

(deftest test-completions-command-registration
  (testing "completions entry has correct structure"
    (let [entry (first completions-command/entries)]
      (is (= ["completions"] (:cmds entry)))
      (is (= :completions (:command entry)))
      (is (= ["zsh" "bash"] (get-in entry [:spec :shell :values]))))))

(deftest test-parse-args-completions-shell
  (testing "parse-args recognizes completions --shell zsh"
    (let [result (commands/parse-args ["completions" "--shell" "zsh"])]
      (is (true? (:ok? result)))
      (is (= :completions (:command result)))))
  (testing "parse-args recognizes completions with positional arg"
    (let [result (commands/parse-args ["completions" "zsh"])]
      (is (true? (:ok? result)))
      (is (= :completions (:command result))))))

(deftest test-build-action-completions
  (testing "build-action for :completions returns correct action"
    (let [parsed {:ok? true
                  :command :completions
                  :options {:shell "zsh"}
                  :args []}
          action (commands/build-action parsed {})]
      (is (true? (:ok? action)))
      (is (= :completions (get-in action [:action :type])))
      (is (= "zsh" (get-in action [:action :shell])))))
  (testing "build-action with positional arg"
    (let [parsed {:ok? true
                  :command :completions
                  :options {}
                  :args ["bash"]}
          action (commands/build-action parsed {})]
      (is (true? (:ok? action)))
      (is (= "bash" (get-in action [:action :shell]))))))
