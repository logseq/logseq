(ns logseq.cli.command.completion-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.command.completion :as completion-command]
            [logseq.cli.commands :as commands]))

(deftest test-completion-command-registration
  (testing "completion entry has correct structure"
    (let [entry (first completion-command/entries)]
      (is (= ["completion"] (:cmds entry)))
      (is (= :completion (:command entry)))
      (is (= ["zsh" "bash"] (get-in entry [:spec :shell :values]))))))

(deftest test-parse-args-completion-shell
  (testing "parse-args recognizes completion --shell zsh"
    (let [result (commands/parse-args ["completion" "--shell" "zsh"])]
      (is (true? (:ok? result)))
      (is (= :completion (:command result)))))
  (testing "parse-args recognizes completion with positional arg"
    (let [result (commands/parse-args ["completion" "zsh"])]
      (is (true? (:ok? result)))
      (is (= :completion (:command result))))))

(deftest test-build-action-completion
  (testing "build-action for :completion returns correct action"
    (let [parsed {:ok? true
                  :command :completion
                  :options {:shell "zsh"}
                  :args []}
          action (commands/build-action parsed {})]
      (is (true? (:ok? action)))
      (is (= :completion (get-in action [:action :type])))
      (is (= "zsh" (get-in action [:action :shell])))))
  (testing "build-action with positional arg"
    (let [parsed {:ok? true
                  :command :completion
                  :options {}
                  :args ["bash"]}
          action (commands/build-action parsed {})]
      (is (true? (:ok? action)))
      (is (= "bash" (get-in action [:action :shell]))))))
