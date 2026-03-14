(ns logseq.cli.command.completion-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.completion :as completion-command]
            [logseq.cli.commands :as commands]))

(deftest test-completion-command-registration
  (testing "completion entry has correct structure"
    (let [entry (first completion-command/entries)]
      (is (= ["completion"] (:cmds entry)))
      (is (= :completion (:command entry)))
      (is (= ["zsh" "bash"] (get-in entry [:spec :shell :values])))))
  (testing "completion entry has long-desc with setup instructions"
    (let [entry (first completion-command/entries)]
      (is (some? (:long-desc entry)))
      (is (string/includes? (:long-desc entry) "autoload -Uz compinit"))
      (is (string/includes? (:long-desc entry) "eval \"$(logseq completion zsh)\""))))
  (testing "completion entry has examples metadata"
    (let [entry (first completion-command/entries)]
      (is (= ["logseq completion zsh"
              "logseq completion bash"]
             (:examples entry))))))

(deftest test-parse-args-completion-shell
  (testing "parse-args recognizes completion --shell zsh"
    (let [result (commands/parse-args ["completion" "--shell" "zsh"])]
      (is (true? (:ok? result)))
      (is (= :completion (:command result)))))
  (testing "parse-args recognizes completion with positional arg"
    (let [result (commands/parse-args ["completion" "zsh"])]
      (is (true? (:ok? result)))
      (is (= :completion (:command result))))))

(deftest test-parse-args-completion-help
  (testing "parse-args completion --help returns help with setup instructions and examples"
    (let [result (commands/parse-args ["completion" "--help"])]
      (is (false? (:ok? result)))
      (is (true? (:help? result)))
      (is (string/includes? (:summary result) "autoload -Uz compinit"))
      (is (string/includes? (:summary result) "eval \"$(logseq completion bash)\""))
      (is (string/includes? (:summary result) "Examples:"))
      (is (string/includes? (:summary result) "logseq completion zsh")))))

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

(deftest test-parse-args-completion-validation
  (testing "completion with no shell arg returns invalid-options error"
    (let [result (commands/parse-args ["completion"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))
  (testing "completion with unsupported shell returns invalid-options error"
    (let [result (commands/parse-args ["completion" "fish"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))
