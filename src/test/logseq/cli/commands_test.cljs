(ns logseq.cli.commands-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.commands :as commands]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]))

(deftest test-help-output
  (testing "top-level help lists subcommand groups"
    (let [result (commands/parse-args ["--help"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "graph"))
      (is (string/includes? summary "block"))
      (is (string/includes? summary "server")))))

(deftest test-parse-args
  (testing "graph group shows subcommands"
    (let [result (commands/parse-args ["graph"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "graph list"))
      (is (string/includes? summary "graph create"))))

  (testing "block group shows subcommands"
    (let [result (commands/parse-args ["block"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "block add"))
      (is (string/includes? summary "block search"))))

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

  (testing "block group aligns subcommand columns"
    (let [result (commands/parse-args ["block"])
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

  (testing "server group aligns subcommand columns"
    (let [result (commands/parse-args ["server"])
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
                     "graph-validate" "graph-info" "add" "remove" "search" "tree"
                     "ping" "status" "query" "export"]]
      (let [result (commands/parse-args [command])]
        (is (false? (:ok? result)))
        (is (= :unknown-command (get-in result [:error :code]))))))

  (testing "rejects removed commands"
    (let [result (commands/parse-args ["graph" "wat"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code])))))

  (testing "rejects removed group commands"
    (let [result (commands/parse-args ["content" "add"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code])))))

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

(deftest test-graph-subcommand-parse
  (testing "graph list parses"
    (let [result (commands/parse-args ["graph" "list"])]
      (is (true? (:ok? result)))
      (is (= :graph-list (:command result)))))

  (testing "graph create requires repo option"
    (let [result (commands/parse-args ["graph" "create"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "graph create parses with repo option"
    (let [result (commands/parse-args ["graph" "create" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-create (:command result)))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "graph switch requires repo option"
    (let [result (commands/parse-args ["graph" "switch"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "graph switch parses with repo option"
    (let [result (commands/parse-args ["graph" "switch" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-switch (:command result)))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "graph remove requires repo option"
    (let [result (commands/parse-args ["graph" "remove"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "graph remove parses with repo option"
    (let [result (commands/parse-args ["graph" "remove" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-remove (:command result)))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "graph validate requires repo option"
    (let [result (commands/parse-args ["graph" "validate"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "graph validate parses with repo option"
    (let [result (commands/parse-args ["graph" "validate" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-validate (:command result)))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "graph info parses without repo option"
    (let [result (commands/parse-args ["graph" "info"])]
      (is (true? (:ok? result)))
      (is (= :graph-info (:command result)))))

  (testing "graph info parses with repo option"
    (let [result (commands/parse-args ["graph" "info" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-info (:command result)))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "graph subcommands reject unknown flags"
    (doseq [subcommand ["list" "create" "switch" "remove" "validate" "info"]]
      (let [result (commands/parse-args ["graph" subcommand "--wat"])]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code]))))))


  (testing "graph subcommands accept output option"
    (let [result (commands/parse-args ["graph" "list" "--output" "edn"])]
      (is (true? (:ok? result)))
      (is (= "edn" (get-in result [:options :output])))))

  (testing "server list parses"
    (let [result (commands/parse-args ["server" "list"])]
      (is (true? (:ok? result)))
      (is (= :server-list (:command result)))))

  (testing "server start requires repo"
    (let [result (commands/parse-args ["server" "start"])]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "server start parses with repo"
    (let [result (commands/parse-args ["server" "start" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :server-start (:command result)))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "server stop parses with repo"
    (let [result (commands/parse-args ["server" "stop" "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :server-stop (:command result))))))

(deftest test-block-subcommand-parse
  (testing "block add requires content source"
    (let [result (commands/parse-args ["block" "add"])]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "block add parses with content"
    (let [result (commands/parse-args ["block" "add" "--content" "hello"])]
      (is (true? (:ok? result)))
      (is (= :add (:command result)))
      (is (= "hello" (get-in result [:options :content])))))

  (testing "block remove requires target"
    (let [result (commands/parse-args ["block" "remove"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "block remove parses with block"
    (let [result (commands/parse-args ["block" "remove" "--block" "demo"])]
      (is (true? (:ok? result)))
      (is (= :remove (:command result)))
      (is (= "demo" (get-in result [:options :block])))))

  (testing "block search requires text"
    (let [result (commands/parse-args ["block" "search"])]
      (is (false? (:ok? result)))
      (is (= :missing-search-text (get-in result [:error :code])))))

  (testing "block search parses with text"
    (let [result (commands/parse-args ["block" "search" "--text" "hello"])]
      (is (true? (:ok? result)))
      (is (= :search (:command result)))
      (is (= "hello" (get-in result [:options :text])))))

  (testing "block tree requires target"
    (let [result (commands/parse-args ["block" "tree"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "block tree parses with page"
    (let [result (commands/parse-args ["block" "tree" "--page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :tree (:command result)))
      (is (= "Home" (get-in result [:options :page])))))

  (testing "block subcommands reject unknown flags"
    (doseq [subcommand ["add" "remove" "search" "tree"]]
      (let [result (commands/parse-args ["block" subcommand "--wat"])]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code]))))))

  (testing "block subcommands accept output option"
    (let [result (commands/parse-args ["block" "search" "--text" "hello" "--output" "json"])]
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

  (testing "add requires content"
    (let [parsed {:ok? true :command :add :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "add builds insert-blocks op"
    (let [parsed {:ok? true :command :add :options {:content "hello"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :add (get-in result [:action :type])))))

  (testing "remove requires target"
    (let [parsed {:ok? true :command :remove :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "search requires text"
    (let [parsed {:ok? true :command :search :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-search-text (get-in result [:error :code])))))

  (testing "tree requires target"
    (let [parsed {:ok? true :command :tree :options {}}
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
