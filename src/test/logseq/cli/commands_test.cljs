(ns logseq.cli.commands-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.commands :as commands]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
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
      (is (string/includes? summary "move"))
      (is (string/includes? summary "search"))
      (is (string/includes? summary "show"))
      (is (string/includes? summary "graph"))
      (is (string/includes? summary "server"))))

  (testing "top-level help separates global and command options"
    (let [summary (:summary (commands/parse-args ["--help"]))]
      (is (string/includes? summary "Global options:"))
      (is (string/includes? summary "Command options:")))))

(deftest test-parse-args-help
  (testing "graph group shows subcommands"
    (let [result (commands/parse-args ["graph"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "graph list"))
      (is (string/includes? summary "graph create"))
      (is (string/includes? summary "graph export"))
      (is (string/includes? summary "graph import"))))

  (testing "list group shows subcommands"
    (let [result (commands/parse-args ["list"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "list page"))
      (is (string/includes? summary "list tag"))
      (is (string/includes? summary "list property"))
      (is (string/includes? summary "Global options:"))
      (is (string/includes? summary "Command options:"))))

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

  (testing "move command shows help"
    (let [result (commands/parse-args ["move" "--help"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "Usage: logseq move"))
      (is (string/includes? summary "Command options:"))))

  (testing "server group shows subcommands"
    (let [result (commands/parse-args ["server"])
          summary (:summary result)]
      (is (true? (:help? result)))
      (is (string/includes? summary "server list"))
      (is (string/includes? summary "server start")))))

(deftest test-parse-args-help-alignment
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
      (is (apply = desc-starts)))))

(deftest test-parse-args-errors
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
      (is (= :unknown-command (get-in result [:error :code]))))))

(deftest test-parse-args-rejects-graph-option
  (testing "rejects legacy --graph option"
    (let [result (commands/parse-args ["--graph" "demo" "graph" "list"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (= "unknown option: --graph" (get-in result [:error :message]))))))

(deftest test-parse-args-global-options
  (testing "global output option is accepted"
    (let [result (commands/parse-args ["--output" "json" "graph" "list"])]
      (is (true? (:ok? result)))
      (is (= "json" (get-in result [:options :output]))))))

(deftest test-tree->text-format
  (testing "show tree text uses db/id with tree glyphs"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child A"
                                              :block/children [{:db/id 3
                                                                :block/title "Grandchild A1"}]}
                                             {:db/id 4
                                              :block/title "Child B"}]}}]
      (is (= (str "1 Root\n"
                  "2 ├── Child A\n"
                  "3 │   └── Grandchild A1\n"
                  "4 └── Child B")
             (tree->text tree-data))))))

(deftest test-tree->text-aligns-mixed-id-widths
  (testing "show tree text aligns glyph column with mixed-width ids"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 7
                            :block/title "Root"
                            :block/children [{:db/id 88
                                              :block/title "Child A"
                                              :block/children [{:db/id 3
                                                                :block/title "Grand"}]}
                                             {:db/id 1000
                                              :block/title "Child B"}]}}]
      (is (= (str "7    Root\n"
                  "88   ├── Child A\n"
                  "3    │   └── Grand\n"
                  "1000 └── Child B")
             (tree->text tree-data))))))

(deftest test-tree->text-multiline
  (testing "show tree text renders multiline blocks under glyph column"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 168
                            :block/title "Jan 18th, 2026"
                            :block/children [{:db/id 169
                                              :block/title "b1"}
                                             {:db/id 173
                                              :block/title "aaaxx"}
                                             {:db/id 174
                                              :block/title "block-line1\nblock-line2"}
                                             {:db/id 175
                                              :block/title "cccc"}]}}]
      (is (= (str "168 Jan 18th, 2026\n"
                  "169 ├── b1\n"
                  "173 ├── aaaxx\n"
                  "174 ├── block-line1\n"
                  "    │   block-line2\n"
                  "175 └── cccc")
             (tree->text tree-data))))))

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

(deftest test-verb-subcommand-parse-add-remove
  (testing "add block requires content source"
    (let [result (commands/parse-args ["add" "block"])]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "add block parses with content"
    (let [result (commands/parse-args ["add" "block" "--content" "hello"])]
      (is (true? (:ok? result)))
      (is (= :add-block (:command result)))
      (is (= "hello" (get-in result [:options :content])))))

  (testing "add block parses with target selectors and pos"
    (let [result (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--target-uuid" "abc"
                                       "--pos" "first-child"])]
      (is (true? (:ok? result)))
      (is (= :add-block (:command result)))
      (is (= "abc" (get-in result [:options :target-uuid])))
      (is (= "first-child" (get-in result [:options :pos])))))

  (testing "add block rejects invalid pos"
    (let [result (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--pos" "middle"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

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

  (testing "move requires source selector"
    (let [result (commands/parse-args ["move" "--target-id" "10"])]
      (is (false? (:ok? result)))
      (is (= :missing-source (get-in result [:error :code])))))

  (testing "move requires target selector"
    (let [result (commands/parse-args ["move" "--id" "1"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "move parses with source and target"
    (let [result (commands/parse-args ["move" "--uuid" "abc" "--target-uuid" "def" "--pos" "last-child"])]
      (is (true? (:ok? result)))
      (is (= :move-block (:command result)))
      (is (= "abc" (get-in result [:options :uuid])))
      (is (= "def" (get-in result [:options :target-uuid])))
      (is (= "last-child" (get-in result [:options :pos]))))))

(deftest test-verb-subcommand-parse-search-show
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
      (is (= "Home" (get-in result [:options :page-name]))))))

(deftest test-verb-subcommand-parse-graph-import-export
  (testing "graph export parses with type and output"
    (let [result (commands/parse-args ["graph" "export"
                                       "--type" "edn"
                                       "--output" "export.edn"])]
      (is (true? (:ok? result)))
      (is (= :graph-export (:command result)))
      (is (= "edn" (get-in result [:options :type])))
      (is (= "export.edn" (get-in result [:options :output])))))

  (testing "graph import parses with type, input, and repo"
    (let [result (commands/parse-args ["graph" "import"
                                       "--type" "sqlite"
                                       "--input" "import.sqlite"
                                       "--repo" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-import (:command result)))
      (is (= "sqlite" (get-in result [:options :type])))
      (is (= "import.sqlite" (get-in result [:options :input])))
      (is (= "demo" (get-in result [:options :repo])))))

  (testing "graph export requires type"
    (let [result (commands/parse-args ["graph" "export" "--output" "export.edn"])]
      (is (false? (:ok? result)))
      (is (= :missing-type (get-in result [:error :code])))))

  (testing "graph export requires output"
    (let [result (commands/parse-args ["graph" "export" "--type" "edn"])]
      (is (false? (:ok? result)))
      (is (= :missing-output (get-in result [:error :code])))))

  (testing "graph import requires repo"
    (let [result (commands/parse-args ["graph" "import"
                                       "--type" "edn"
                                       "--input" "import.edn"])]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "graph import rejects unknown type"
    (let [result (commands/parse-args ["graph" "import"
                                       "--type" "zip"
                                       "--input" "import.zip"
                                       "--repo" "demo"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-verb-subcommand-parse-flags
  (testing "verb subcommands reject unknown flags"
    (doseq [args [["list" "page" "--wat"]
                  ["add" "block" "--wat"]
                  ["remove" "block" "--wat"]
                  ["move" "--wat"]
                  ["search" "--wat"]
                  ["show" "--wat"]]]
      (let [result (commands/parse-args args)]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code]))))))

  (testing "verb subcommands accept output option"
    (let [result (commands/parse-args ["search" "--text" "hello" "--output" "json"])]
      (is (true? (:ok? result)))
      (is (= "json" (get-in result [:options :output]))))))

(deftest test-build-action-graph
  (testing "graph-list uses list-db"
    (let [parsed {:ok? true :command :graph-list :options {}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :graph-list (get-in result [:action :type])))))

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

  (testing "graph export uses config repo"
    (let [parsed {:ok? true
                  :command :graph-export
                  :options {:type "edn" :output "export.edn"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :graph-export (get-in result [:action :type])))))

  (testing "graph import requires repo"
    (let [parsed {:ok? true
                  :command :graph-import
                  :options {:type "edn" :input "import.edn"}}
          result (commands/build-action parsed {})]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code]))))))

(deftest test-build-action-server
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
      (is (= :server-stop (get-in result [:action :type]))))))

(deftest test-build-action-inspect-edit
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

(deftest test-build-action-move
  (testing "move requires source selector"
    (let [parsed {:ok? true :command :move-block :options {:target-id 2}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-source (get-in result [:error :code])))))

  (testing "move requires target selector"
    (let [parsed {:ok? true :command :move-block :options {:id 1}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code]))))))

(deftest test-move-parse-validation
  (testing "move rejects multiple source selectors"
    (let [result (commands/parse-args ["move" "--id" "1" "--uuid" "abc" "--target-id" "2"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "move rejects multiple target selectors"
    (let [result (commands/parse-args ["move" "--id" "1" "--target-id" "2" "--target-uuid" "def"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "move rejects invalid position"
    (let [result (commands/parse-args ["move" "--id" "1" "--target-id" "2" "--pos" "middle"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "move rejects sibling pos for page target"
    (let [result (commands/parse-args ["move" "--id" "1" "--target-page-name" "Home" "--pos" "sibling"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "move rejects legacy page-name option"
    (let [result (commands/parse-args ["move" "--id" "1" "--page-name" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

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

(deftest test-execute-graph-import-rejects-existing-graph
  (async done
    (let [orig-list-graphs cli-server/list-graphs
          orig-ensure-server! cli-server/ensure-server!]
      (set! cli-server/list-graphs (fn [_] ["demo"]))
      (set! cli-server/ensure-server! (fn [_ _]
                                        (throw (ex-info "should not start server" {}))))
      (-> (p/let [result (commands/execute {:type :graph-import
                                            :repo "logseq_db_demo"
                                            :allow-missing-graph true}
                                           {})]
            (is (= :error (:status result)))
            (is (= :graph-exists (get-in result [:error :code]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/list-graphs orig-list-graphs)
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (done)))))))

(deftest test-execute-graph-export
  (async done
    (let [invoke-calls (atom [])
          write-calls (atom [])
          orig-list-graphs cli-server/list-graphs
          orig-ensure-server! cli-server/ensure-server!
          orig-invoke transport/invoke
          orig-write-output transport/write-output]
      (set! cli-server/list-graphs (fn [_] ["demo"]))
      (set! cli-server/ensure-server! (fn [config _]
                                        (assoc config :base-url "http://127.0.0.1:9999")))
      (set! transport/invoke (fn [_ method direct-pass? args]
                               (swap! invoke-calls conj [method direct-pass? args])
                               (if (= method :thread-api/export-db-base64)
                                 "c3FsaXRl"
                                 {:exported true})))
      (set! transport/write-output (fn [opts]
                                     (swap! write-calls conj opts)))
      (-> (p/let [edn-result (commands/execute {:type :graph-export
                                                :repo "logseq_db_demo"
                                                :graph "demo"
                                                :export-type "edn"
                                                :output "/tmp/export.edn"
                                                :allow-missing-graph true}
                                               {})
                  sqlite-result (commands/execute {:type :graph-export
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :export-type "sqlite"
                                                   :output "/tmp/export.sqlite"
                                                   :allow-missing-graph true}
                                                  {})]
            (is (= :ok (:status edn-result)))
            (is (= :ok (:status sqlite-result)))
            (is (= [[:thread-api/export-edn false ["logseq_db_demo" {:export-type :graph}]]
                    [:thread-api/export-db-base64 true ["logseq_db_demo"]]]
                   @invoke-calls))
            (is (= 2 (count @write-calls)))
            (let [[edn-write sqlite-write] @write-calls]
              (is (= {:format :edn :path "/tmp/export.edn" :data {:exported true}}
                     edn-write))
              (is (= :sqlite (:format sqlite-write)))
              (is (= "/tmp/export.sqlite" (:path sqlite-write)))
              (is (= "sqlite" (.toString (:data sqlite-write) "utf8")))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/list-graphs orig-list-graphs)
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/invoke orig-invoke)
                       (set! transport/write-output orig-write-output)
                       (done)))))))

(deftest test-execute-graph-import
  (async done
    (let [invoke-calls (atom [])
          read-calls (atom [])
          stop-calls (atom [])
          restart-calls (atom [])
          orig-list-graphs cli-server/list-graphs
          orig-stop-server! cli-server/stop-server!
          orig-restart-server! cli-server/restart-server!
          orig-ensure-server! cli-server/ensure-server!
          orig-read-input transport/read-input
          orig-invoke transport/invoke]
      (set! cli-server/list-graphs (fn [_] []))
      (set! cli-server/stop-server! (fn [_ repo]
                                      (swap! stop-calls conj repo)
                                      (p/resolved {:ok? true})))
      (set! cli-server/restart-server! (fn [_ repo]
                                         (swap! restart-calls conj repo)
                                         (p/resolved {:ok? true})))
      (set! cli-server/ensure-server! (fn [config _]
                                        (assoc config :base-url "http://127.0.0.1:9999")))
      (set! transport/read-input (fn [{:keys [format path]}]
                                   (swap! read-calls conj [format path])
                                   (if (= format :edn)
                                     {:page "Import Page"}
                                     (js/Buffer.from "sqlite" "utf8"))))
      (set! transport/invoke (fn [_ method _ args]
                               (swap! invoke-calls conj [method args])
                               {:ok true}))
      (-> (p/let [edn-result (commands/execute {:type :graph-import
                                                :repo "logseq_db_demo"
                                                :graph "demo"
                                                :import-type "edn"
                                                :input "/tmp/import.edn"
                                                :allow-missing-graph true}
                                               {})
                  sqlite-result (commands/execute {:type :graph-import
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :import-type "sqlite"
                                                   :input "/tmp/import.sqlite"
                                                   :allow-missing-graph true}
                                                  {})]
            (is (= :ok (:status edn-result)))
            (is (= :ok (:status sqlite-result)))
            (is (= [[:edn "/tmp/import.edn"]
                    [:sqlite "/tmp/import.sqlite"]]
                   @read-calls))
            (is (= [[:thread-api/import-edn ["logseq_db_demo" {:page "Import Page"}]]
                    [:thread-api/import-db-base64 ["logseq_db_demo" "c3FsaXRl"]]]
                   @invoke-calls))
            (is (= ["logseq_db_demo" "logseq_db_demo"] @stop-calls))
            (is (= ["logseq_db_demo" "logseq_db_demo"] @restart-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! cli-server/list-graphs orig-list-graphs)
                       (set! cli-server/stop-server! orig-stop-server!)
                       (set! cli-server/restart-server! orig-restart-server!)
                       (set! cli-server/ensure-server! orig-ensure-server!)
                       (set! transport/read-input orig-read-input)
                       (set! transport/invoke orig-invoke)
                       (done)))))))
