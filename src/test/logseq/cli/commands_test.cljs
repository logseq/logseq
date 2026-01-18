(ns logseq.cli.commands-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.commands :as commands]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]))

(deftest test-help-output
  (testing "top-level help lists command groups"
    (let [result (commands/parse-args ["--help"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "Graph Inspect and Edit"))
      (is (string/includes? summary "Graph Management"))
      (is (string/includes? summary "list"))
      (is (string/includes? summary "add"))
      (is (string/includes? summary "remove"))
      (is (string/includes? summary "search"))
      (is (string/includes? summary "show"))
      (is (string/includes? summary "graph"))
      (is (string/includes? summary "server")))))

(deftest test-parse-args
  (testing "graph group shows subcommands"
    (let [result (commands/parse-args ["graph"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "graph list"))
      (is (string/includes? summary "graph create"))))

  (testing "list group shows subcommands"
    (let [result (commands/parse-args ["list"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "list page"))
      (is (string/includes? summary "list tag"))
      (is (string/includes? summary "list property"))))

  (testing "add group shows subcommands"
    (let [result (commands/parse-args ["add"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "add block"))
      (is (string/includes? summary "add page"))))

  (testing "remove group shows subcommands"
    (let [result (commands/parse-args ["remove"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "remove block"))
      (is (string/includes? summary "remove page"))))

  (testing "server group shows subcommands"
    (let [result (commands/parse-args ["server"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "server list"))
      (is (string/includes? summary "server start"))))

  (testing "graph group aligns subcommand columns"
    (let [result (commands/parse-args ["graph"])
          summary (:summary result)
          subcommand-lines (let [lines (string/split-lines summary)
                                 start (inc (.indexOf lines "Subcommands:"))]
                             (->> lines
                                  (drop start)
                                  (take-while (complement string/blank?))))
          desc-starts (->> subcommand-lines
                           (keep (fn [line]
                                   (when-let [[_ desc] (re-matches #"^\s+.*?\s{2,}(.+)$" line)]
                                     (.indexOf line desc)))))]
      (is (seq subcommand-lines))
      (is (apply = desc-starts))))

  (testing "list group aligns subcommand columns"
    (let [result (commands/parse-args ["list"])
          summary (:summary result)
          subcommand-lines (let [lines (string/split-lines summary)
                                 start (inc (.indexOf lines "Subcommands:"))]
                             (->> lines
                                  (drop start)
                                  (take-while (complement string/blank?))))
          desc-starts (->> subcommand-lines
                           (keep (fn [line]
                                   (when-let [[_ desc] (re-matches #"^\s+.*?\s{2,}(.+)$" line)]
                                     (.indexOf line desc)))))]
      (is (seq subcommand-lines))
      (is (apply = desc-starts))))

  (testing "rejects legacy commands"
    (doseq [command ["graph-list" "graph-create" "graph-switch" "graph-remove"
                     "graph-validate" "graph-info" "block" "tree"
                     "ping" "status" "query" "export"]]
      (let [result (commands/parse-args [command])]
        (is (false? (:ok? result)))
        (is (= :unknown-command (get-in result [:error :code]))))))

  (testing "rejects removed group commands"
    (doseq [args [["block" "add"]
                  ["block" "remove"]
                  ["block" "search"]
                  ["block" "tree"]
                  ["content" "add"]]]
      (let [result (commands/parse-args args)]
        (is (false? (:ok? result)))
        (is (= :unknown-command (get-in result [:error :code]))))))

  (testing "errors on missing command"
    (let [result (commands/parse-args [])]
      (is (false? (:ok? result)))
      (is (= :missing-command (get-in result [:error :code])))))

  (testing "errors on unknown command"
    (let [result (commands/parse-args ["wat"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code])))))

  (testing "global output option is accepted"
    (let [result (commands/parse-args ["--output" "json" "graph" "list"])]
      (is (true? (:ok? result)))
      (is (= "json" (get-in result [:options :output]))))))

(deftest test-list-subcommand-parse
  (testing "list page parses"
    (let [result (commands/parse-args ["list" "page"
                                       "--expand"
                                       "--include-journal"
                                       "--limit" "10"
                                       "--offset" "5"
                                       "--sort" "updated-at"
                                       "--order" "desc"
                                       "--fields" "title,updated-at"])]
      (is (true? (:ok? result)))
      (is (= :list-page (:command result)))
      (is (true? (get-in result [:options :expand])))
      (is (true? (get-in result [:options :include-journal])))
      (is (= 10 (get-in result [:options :limit])))
      (is (= 5 (get-in result [:options :offset])))
      (is (= "updated-at" (get-in result [:options :sort])))
      (is (= "desc" (get-in result [:options :order])))
      (is (= "title,updated-at" (get-in result [:options :fields])))))

  (testing "list tag parses"
    (let [result (commands/parse-args ["list" "tag"
                                       "--expand"
                                       "--include-built-in"
                                       "--with-properties"
                                       "--with-extends"
                                       "--fields" "name,properties"])]
      (is (true? (:ok? result)))
      (is (= :list-tag (:command result)))
      (is (true? (get-in result [:options :expand])))
      (is (true? (get-in result [:options :include-built-in])))
      (is (true? (get-in result [:options :with-properties])))
      (is (true? (get-in result [:options :with-extends])))
      (is (= "name,properties" (get-in result [:options :fields])))))

  (testing "list property parses"
    (let [result (commands/parse-args ["list" "property"
                                       "--expand"
                                       "--include-built-in"
                                       "--with-classes"
                                       "--with-type"
                                       "--fields" "name,type"])]
      (is (true? (:ok? result)))
      (is (= :list-property (:command result)))
      (is (true? (get-in result [:options :expand])))
      (is (true? (get-in result [:options :include-built-in])))
      (is (true? (get-in result [:options :with-classes])))
      (is (true? (get-in result [:options :with-type])))
      (is (= "name,type" (get-in result [:options :fields]))))))

(deftest test-list-subcommand-validation
  (testing "list page rejects mutually exclusive journal flags"
    (let [result (commands/parse-args ["list" "page"
                                       "--include-journal"
                                       "--journal-only"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "list page rejects invalid sort field"
    (let [result (commands/parse-args ["list" "page" "--sort" "wat"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "list tag rejects invalid sort field"
    (let [result (commands/parse-args ["list" "tag" "--sort" "wat"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "list property rejects invalid sort field"
    (let [result (commands/parse-args ["list" "property" "--sort" "wat"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-verb-subcommand-parse
  (testing "add block requires content source"
    (let [result (commands/parse-args ["add" "block"])]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "add block parses with content"
    (let [result (commands/parse-args ["add" "block" "--content" "hello"])]
      (is (true? (:ok? result)))
      (is (= :add-block (:command result)))
      (is (= "hello" (get-in result [:options :content])))))

  (testing "add page requires page name"
    (let [result (commands/parse-args ["add" "page"])]
      (is (false? (:ok? result)))
      (is (= :missing-page-name (get-in result [:error :code])))))

  (testing "add page parses with name"
    (let [result (commands/parse-args ["add" "page" "--page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :add-page (:command result)))
      (is (= "Home" (get-in result [:options :page])))))

  (testing "remove block requires target"
    (let [result (commands/parse-args ["remove" "block"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "remove block parses with block"
    (let [result (commands/parse-args ["remove" "block" "--block" "demo"])]
      (is (true? (:ok? result)))
      (is (= :remove-block (:command result)))
      (is (= "demo" (get-in result [:options :block])))))

  (testing "remove page parses with page"
    (let [result (commands/parse-args ["remove" "page" "--page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :remove-page (:command result)))
      (is (= "Home" (get-in result [:options :page])))))

  (testing "search requires text"
    (let [result (commands/parse-args ["search"])]
      (is (false? (:ok? result)))
      (is (= :missing-search-text (get-in result [:error :code])))))

  (testing "search parses with text"
    (let [result (commands/parse-args ["search" "--text" "hello"])]
      (is (true? (:ok? result)))
      (is (= :search (:command result)))
      (is (= "hello" (get-in result [:options :text])))))

  (testing "show requires target"
    (let [result (commands/parse-args ["show"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "show parses with page name"
    (let [result (commands/parse-args ["show" "--page-name" "Home"])]
      (is (true? (:ok? result)))
      (is (= :show (:command result)))
      (is (= "Home" (get-in result [:options :page-name])))))

  (testing "verb subcommands reject unknown flags"
    (doseq [args [["list" "page" "--wat"]
                  ["add" "block" "--wat"]
                  ["remove" "block" "--wat"]
                  ["search" "--wat"]
                  ["show" "--wat"]]]
      (let [result (commands/parse-args args)]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code]))))))

  (testing "verb subcommands accept output option"
    (let [result (commands/parse-args ["search" "--text" "hello" "--output" "json"])]
      (is (true? (:ok? result)))
      (is (= "json" (get-in result [:options :output]))))))

(deftest test-build-action
  (testing "graph-list uses list-db"
    (let [parsed {:ok? true :command :graph-list :options {}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :graph-list (get-in result [:action :type])))))

  (testing "server list builds action"
    (let [parsed {:ok? true :command :server-list :options {}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :server-list (get-in result [:action :type])))))

  (testing "server start requires repo"
    (let [parsed {:ok? true :command :server-start :options {}}
          result (commands/build-action parsed {})]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "server stop builds action"
    (let [parsed {:ok? true :command :server-stop :options {:repo "demo"}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :server-stop (get-in result [:action :type])))))

  (testing "graph-create requires repo name"
    (let [parsed {:ok? true :command :graph-create :options {}}
          result (commands/build-action parsed {})]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "graph-switch uses graph name"
    (let [parsed {:ok? true :command :graph-switch :options {:repo "demo"}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :graph-switch (get-in result [:action :type])))))

  (testing "graph-info defaults to config repo"
    (let [parsed {:ok? true :command :graph-info :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :graph-info (get-in result [:action :type])))))

  (testing "list page requires repo"
    (let [parsed {:ok? true :command :list-page :options {}}
          result (commands/build-action parsed {})]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "add block requires content"
    (let [parsed {:ok? true :command :add-block :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "add block builds insert-blocks op"
    (let [parsed {:ok? true :command :add-block :options {:content "hello"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :add-block (get-in result [:action :type])))))

  (testing "add page requires name"
    (let [parsed {:ok? true :command :add-page :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-page-name (get-in result [:error :code])))))

  (testing "remove block requires target"
    (let [parsed {:ok? true :command :remove-block :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "search requires text"
    (let [parsed {:ok? true :command :search :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-search-text (get-in result [:error :code])))))

  (testing "show requires target"
    (let [parsed {:ok? true :command :show :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code]))))))

(deftest test-execute-requires-existing-graph
  (async done
         (with-redefs [cli-server/list-graphs (fn [_] [])
                       cli-server/ensure-server! (fn [_ _]
                                                   (throw (ex-info "should not start server" {})))]
           (-> (p/let [result (commands/execute {:type :search
                                                 :repo "logseq_db_missing"
                                                 :text "hello"}
                                                {})]
                 (is (= :error (:status result)))
                 (is (= :graph-not-exists (get-in result [:error :code])))
                 (is (= "graph not exists" (get-in result [:error :message])))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))
