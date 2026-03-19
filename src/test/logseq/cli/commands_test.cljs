(ns logseq.cli.commands-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.commands :as commands]
            [logseq.cli.server :as cli-server]
            [logseq.cli.style :as style]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(defn- strip-ansi
  [value]
  (style/strip-ansi value))

(defn- contains-ansi?
  [value]
  (boolean (re-find style/ansi-pattern value)))

(defn- escape-regex
  [value]
  (let [pattern (js/RegExp. "[.*+?^${}()|[\\]\\\\]" "g")]
    (string/replace value pattern "\\\\$&")))

(defn- contains-bold?
  [value token]
  (let [token (escape-regex token)
        pattern (re-pattern (str "\\u001b\\[[0-9;]*m" token "\\u001b\\[[0-9;]*m"))]
    (boolean (re-find pattern value))))

(defn- command-lines
  [summary]
  (let [lines (string/split-lines (strip-ansi summary))
        section (if (some #{"Commands:"} lines) "Commands:" "Subcommands:")
        start (inc (.indexOf lines section))
        end (.indexOf lines "Global options:")
        entries (subvec (vec lines) start end)]
    (->> entries
         (filter #(string/starts-with? % "  "))
         (remove string/blank?))))

(defn- contains-block-uuid?
  [value]
  (cond
    (map? value) (or (contains? value :block/uuid)
                     (some contains-block-uuid? (vals value)))
    (sequential? value) (some contains-block-uuid? value)
    :else false))

(defn- item-ids
  [result]
  (mapv :db/id (get-in result [:data :items])))

(deftest test-help-output
  (testing "top-level help lists command groups"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (not (string/includes? plain-summary "--auth-token")))
      (is (not (string/includes? plain-summary "--retries")))
      (is (string/includes? plain-summary "Graph Inspect and Edit"))
      (is (string/includes? plain-summary "Graph Management"))
      (is (string/includes? plain-summary "Authentication"))
      (is (string/includes? plain-summary "list"))
      (is (string/includes? plain-summary "upsert"))
      (is (string/includes? plain-summary "remove"))
      (is (string/includes? plain-summary "query"))
      (is (string/includes? plain-summary "show"))
      (is (string/includes? plain-summary "doctor"))
      (is (string/includes? plain-summary "graph"))
      (is (string/includes? plain-summary "server"))
      (is (string/includes? plain-summary "sync"))
      (is (string/includes? plain-summary "login"))
      (is (string/includes? plain-summary "logout"))
      (is (string/includes? plain-summary "Path to db-worker data dir (default ~/logseq/graphs)"))
      (is (contains-bold? summary "list page"))
      (is (contains-bold? summary "list tag"))
      (is (contains-bold? summary "list property"))
      (is (contains-bold? summary "upsert block"))
      (is (contains-bold? summary "upsert page"))
      (is (contains-bold? summary "upsert tag"))
      (is (contains-bold? summary "upsert property"))
      (is (contains-bold? summary "remove block"))
      (is (contains-bold? summary "remove page"))
      (is (contains-bold? summary "remove tag"))
      (is (contains-bold? summary "remove property"))
      (is (contains-bold? summary "query"))
      (is (contains-bold? summary "query list"))
      (is (contains-bold? summary "show"))
      (is (contains-bold? summary "doctor"))
      (is (contains-bold? summary "graph list"))
      (is (contains-bold? summary "graph create"))
      (is (contains-bold? summary "server list"))
      (is (contains-bold? summary "server start"))
      (is (contains-bold? summary "sync status"))
      (is (contains-bold? summary "sync start"))
      (is (contains-bold? summary "login"))
      (is (contains-bold? summary "logout"))
      (is (contains-bold? summary "--help"))
      (is (contains-bold? summary "--graph"))
      (is (re-find #"\u001b\[[0-9;]*mCommands\u001b\[[0-9;]*m:" summary))
      (is (re-find #"\u001b\[[0-9;]*moptions\u001b\[[0-9;]*m:" summary))))

  (testing "top-level help command list omits [options]"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["--help"])))
          lines (command-lines summary)]
      (is (seq lines))
      (is (every? #(not (string/includes? % "[options]")) lines))))

  (testing "top-level help separates global and command options"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["--help"])))
          plain-summary (strip-ansi summary)]
      (is (string/includes? plain-summary "Global options:"))
      (is (string/includes? plain-summary "Command options:")))))

(deftest test-parse-args-help-groups
  (testing "graph group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["graph"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "graph list"))
      (is (string/includes? plain-summary "graph create"))
      (is (string/includes? plain-summary "graph export"))
      (is (string/includes? plain-summary "graph import"))
      (is (contains-bold? summary "graph list"))
      (is (contains-bold? summary "graph create"))
      (is (contains-bold? summary "graph export"))
      (is (contains-bold? summary "graph import"))))

  (testing "list group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["list"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "list page"))
      (is (string/includes? plain-summary "list tag"))
      (is (string/includes? plain-summary "list property"))
      (is (contains-bold? summary "list page"))
      (is (contains-bold? summary "list tag"))
      (is (contains-bold? summary "list property"))
      (is (string/includes? plain-summary "Global options:"))
      (is (string/includes? plain-summary "Command options:"))))

  (testing "upsert group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["upsert"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "upsert tag"))
      (is (string/includes? plain-summary "upsert property"))
      (is (contains-bold? summary "upsert tag"))
      (is (contains-bold? summary "upsert property"))))

  (testing "server group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["server"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "server list"))
      (is (string/includes? plain-summary "server start"))
      (is (contains-bold? summary "server list"))
      (is (contains-bold? summary "server start"))))

  (testing "query group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["query"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "query list"))
      (is (string/includes? plain-summary "query"))
      (is (contains-bold? summary "query list"))
      (is (contains-bold? summary "query"))))

  (testing "group help command list omits [options]"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["list"])))
          lines (command-lines summary)]
      (is (seq lines))
      (is (every? #(not (string/includes? % "[options]")) lines)))))

(deftest test-parse-args-help-command-examples
  (testing "remove block command shows help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["remove" "block" "--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq remove block"))
      (is (string/includes? plain-summary "Command options:"))
      (is (string/includes? plain-summary "Examples:"))
      (is (string/includes? plain-summary "logseq remove block --graph my-graph --id 123"))
      (is (contains-bold? summary "--id"))
      (is (contains-bold? summary "--uuid"))))

  (testing "sync config set help limits examples to five lines"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["sync" "config" "set" "--help"]))
          plain-summary (strip-ansi (:summary result))]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Examples:"))
      (is (string/includes? plain-summary "logseq sync config set ws-url wss://sync.logseq.com"))
      (is (string/includes? plain-summary "logseq sync config set http-base http://localhost:8080"))
      (is (not (string/includes? plain-summary "logseq sync config set ws-url wss://example.com/socket")))))

  (testing "upsert block command shows help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["upsert" "block" "--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq upsert block"))
      (is (string/includes? plain-summary "Command options:"))
      (is (string/includes? plain-summary "Examples:"))
      (is (contains-bold? summary "--id"))
      (is (contains-bold? summary "--uuid"))
      (is (contains-bold? summary "--content"))
      (is (contains-bold? summary "--target-id"))
      (is (contains-bold? summary "--target-uuid"))
      (is (contains-bold? summary "--update-tags"))
      (is (contains-bold? summary "--update-properties"))
      (is (contains-bold? summary "--remove-tags"))
      (is (contains-bold? summary "--remove-properties")))))

(deftest test-parse-args-group-help-flags
  (testing "all groups show group help with -h and --help"
    (doseq [group ["graph" "server" "list" "upsert" "remove" "query" "sync"]
            help-flag ["-h" "--help"]]
      (let [result (binding [style/*color-enabled?* true]
                     (commands/parse-args [group help-flag]))
            plain-summary (strip-ansi (:summary result))]
        (is (true? (:help? result)))
        (is (string/includes? plain-summary (str "Usage: logseq " group " <subcommand> [options]"))))))

  (testing "upsert block command short help flag shows command help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["upsert" "block" "-h"]))
          plain-summary (strip-ansi (:summary result))]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq upsert block"))
      (is (not (string/includes? plain-summary "Usage: logseq upsert <subcommand> [options]")))))

  )

(deftest test-parse-args-help-auth-commands
  (testing "login command shows help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["login" "--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq login"))
      (is (string/includes? plain-summary "Global options:"))
      (is (string/includes? plain-summary "Command options:"))
      (is (not (string/includes? plain-summary "Examples:")))))

  (testing "logout command shows help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["logout" "--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq logout"))
      (is (string/includes? plain-summary "Global options:"))
      (is (string/includes? plain-summary "Command options:"))
      (is (not (string/includes? plain-summary "Examples:"))))))

(deftest test-parse-args-help-sync-group
  (testing "sync group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["sync"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "sync status"))
      (is (string/includes? plain-summary "sync start"))
      (is (string/includes? plain-summary "sync stop"))
      (is (string/includes? plain-summary "sync upload"))
      (is (string/includes? plain-summary "sync download"))
      (is (string/includes? plain-summary "sync remote-graphs"))
      (is (string/includes? plain-summary "sync ensure-keys"))
      (is (string/includes? plain-summary "sync grant-access"))
      (is (string/includes? plain-summary "sync config set"))
      (is (string/includes? plain-summary "sync config get"))
      (is (string/includes? plain-summary "sync config unset"))
      (is (contains-bold? summary "sync status"))
      (is (contains-bold? summary "sync config set"))
      (is (contains-bold? summary "sync grant-access")))))

(deftest test-parse-args-help-upsert-group
  (testing "add group is removed"
    (let [result (commands/parse-args ["add"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code])))))

  (testing "upsert group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["upsert"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "upsert block"))
      (is (string/includes? plain-summary "upsert page"))
      (is (string/includes? plain-summary "upsert tag"))
      (is (string/includes? plain-summary "upsert property"))
      (is (contains-bold? summary "upsert block"))
      (is (contains-bold? summary "upsert page"))
      (is (contains-bold? summary "upsert tag"))
      (is (contains-bold? summary "upsert property")))))

(deftest test-parse-args-help-alignment
  (testing "graph group aligns subcommand columns"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["graph"]))
          summary (strip-ansi (:summary result))
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
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["list"]))
          summary (strip-ansi (:summary result))
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
                     "ping" "status" "export"]]
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

  (testing "rejects removed write commands"
    (doseq [args [["add" "block" "--content" "x"]
                  ["add" "page" "--page" "Home"]
                  ["update" "--id" "1" "--update-tags" "[\"TagA\"]"]]]
      (let [result (commands/parse-args args)]
        (is (false? (:ok? result)))
        (is (= :unknown-command (get-in result [:error :code]))))))

  (testing "no commands prints help"
    (let [result (commands/parse-args [])]
      (is (false? (:ok? result)))
      (is (true? (:help? result)))))

  (testing "errors on unknown command"
    (let [result (commands/parse-args ["wat"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code]))))))

(deftest test-parse-args-remove-help-and-rejects-add-tag
  (testing "bare remove shows remove subcommand help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["remove"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "remove block"))
      (is (string/includes? plain-summary "remove page"))
      (is (string/includes? plain-summary "remove tag"))
      (is (string/includes? plain-summary "remove property"))
      (is (contains-bold? summary "remove block"))
      (is (contains-bold? summary "remove page"))
      (is (contains-bold? summary "remove tag"))
      (is (contains-bold? summary "remove property"))))

  (testing "rejects removed add tag command"
    (let [result (commands/parse-args ["add" "tag" "--name" "Quote"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code]))))))

(deftest test-parse-args-global-options
  (testing "global output option is accepted"
    (let [result (commands/parse-args ["--output" "json" "graph" "list"])]
      (is (true? (:ok? result)))
      (is (= "json" (get-in result [:options :output]))))))

(deftest test-parse-args-doctor
  (testing "doctor command parses"
    (let [result (commands/parse-args ["doctor"])]
      (is (true? (:ok? result)))
      (is (= :doctor (:command result)))))

  (testing "doctor command parses explicit dev script option"
    (let [result (commands/parse-args ["doctor" "--dev-script"])]
      (is (true? (:ok? result)))
      (is (= :doctor (:command result)))
      (is (= true (get-in result [:options :dev-script]))))))

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
                                              :block/title "Child B"}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (contains-ansi? output))
      (is (string/includes? output (style/dim "├── ")))
      (is (string/includes? output (style/dim "└── ")))
      (is (string/includes? output (style/dim "│   ")))
      (is (= (str "1 Root\n"
                  "2 ├── Child A\n"
                  "3 │   └── Grandchild A1\n"
                  "4 └── Child B")
             (strip-ansi output))))))

(deftest test-tree->text-dims-id-column
  (testing "show tree text dims the id column"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child"}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (contains-ansi? output))
      (is (string/includes? output (style/dim "1")))
      (is (string/includes? output (style/dim "2")))
      (is (= (str "1 Root\n"
                  "2 └── Child")
             (strip-ansi output))))))

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
                                              :block/title "Child B"}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (= (str "7    Root\n"
                  "88   ├── Child A\n"
                  "3    │   └── Grand\n"
                  "1000 └── Child B")
             (strip-ansi output))))))

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
                                              :block/title "cccc"}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (= (str "168 Jan 18th, 2026\n"
                  "169 ├── b1\n"
                  "173 ├── aaaxx\n"
                  "174 ├── block-line1\n"
                  "    │   block-line2\n"
                  "175 └── cccc")
             (strip-ansi output))))))

(deftest test-tree->text-renders-properties-single-value
  (testing "show tree text renders user properties below block labels"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child A"
                                              :user.property/background "Because"}
                                             {:db/id 3
                                              :block/title "Child B"}]}
                     :property-titles {:user.property/background "Background"}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (contains-bold? output "Background"))
      (is (= (str "1 Root\n"
                  "2 ├── Child A\n"
                  "  │   Background: Because\n"
                  "3 └── Child B")
             (strip-ansi output)))
      (is (not (string/includes? output "└── Background"))))))

(deftest test-tree->text-renders-properties-multi-value
  (testing "show tree text renders multi-value properties as a list"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child A"
                                              :user.property/criteria ["One" "Two"]}
                                             {:db/id 3
                                              :block/title "Child B"}]}
                     :property-titles {:user.property/criteria "Criteria"}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (contains-bold? output "Criteria"))
      (is (not (contains-bold? output "- One")))
      (is (not (contains-bold? output "- Two")))
      (is (= (str "1 Root\n"
                  "2 ├── Child A\n"
                  "  │   Criteria:\n"
                  "  │     - One\n"
                  "  │     - Two\n"
                  "3 └── Child B")
             (strip-ansi output))))))

(deftest test-tree->text-properties-order
  (testing "show tree text renders user properties in stable key order"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :user.property/zeta "Last"
                            :user.property/alpha "First"}
                     :property-titles {:user.property/zeta "Zeta"
                                       :user.property/alpha "Alpha"}}
          output (strip-ansi (tree->text tree-data))
          alpha-idx (.indexOf output "Alpha:")
          zeta-idx (.indexOf output "Zeta:")]
      (is (<= 0 alpha-idx))
      (is (<= 0 zeta-idx))
      (is (< alpha-idx zeta-idx)))))

(deftest test-tree->text-properties-multiline-alignment
  (testing "show tree text keeps multiline alignment with properties"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root line1\nRoot line2"
                            :user.property/background "Root prop"
                            :block/children [{:db/id 22
                                              :block/title "Child line1\nChild line2"
                                              :user.property/notes "Child prop"}]}
                     :property-titles {:user.property/background "Background"
                                       :user.property/notes "Notes"}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (= (str "1  Root line1\n"
                  "   Root line2\n"
                  "   Background: Root prop\n"
                  "22 └── Child line1\n"
                  "       Child line2\n"
                  "       Notes: Child prop")
             (strip-ansi output))))))

(deftest test-tree->text-properties-dont-render-as-children
  (testing "show tree text does not render property values as children"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :user.property/background "Child"}
                     :property-titles {:user.property/background "Background"}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))
          output* (strip-ansi output)]
      (is (string/includes? output* "Background: Child"))
      (is (not (string/includes? output* "└── Child")))
      (is (not (string/includes? output* "├── Child"))))))

(deftest test-tree->text-prefixes-status
  (testing "show tree text prefixes status before block titles"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :logseq.property/status {:db/ident :logseq.property/status.todo
                                                     :block/title "TODO"}
                            :block/children [{:db/id 2
                                              :block/title "Child"
                                              :logseq.property/status {:db/ident :logseq.property/status.canceled
                                                                       :block/title "CANCELED"}}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (string/includes? output
                            (binding [style/*color-enabled?* true]
                              (style/bold (style/yellow "TODO")))))
      (is (string/includes? output
                            (binding [style/*color-enabled?* true]
                              (style/bold (style/red "CANCELED")))))
      (is (= (str "1 TODO Root\n"
                  "2 └── CANCELED Child")
             (strip-ansi output))))))

(deftest test-tree->text-status-multiline-alignment
  (testing "show tree text keeps multiline alignment when status prefix is present"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 22
                                              :block/title "line1\nline2"
                                              :logseq.property/status {:db/ident :logseq.property/status.todo
                                                                       :block/title "TODO"}}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (= (str "1  Root\n"
                  "22 └── TODO line1\n"
                  "       line2")
             (strip-ansi output))))))

(deftest test-tree->text-linked-references-tree
  (testing "show tree text renders linked references as trees with db/id in first column"
    (let [tree->text-with-linked-refs #'show-command/tree->text-with-linked-refs
          tree-data {:root {:db/id 1
                            :block/title "Root"}
                     :linked-references {:count 2
                                         :blocks [{:db/id 10
                                                   :block/title "Ref A"
                                                   :logseq.property/status {:db/ident :logseq.property/status.todo
                                                                            :block/title "TODO"}
                                                   :block/page {:db/id 100
                                                                :block/title "Page A"}}
                                                  {:db/id 11
                                                   :block/title "Ref B"
                                                   :block/page {:db/id 101
                                                                :block/title "Page B"}}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text-with-linked-refs tree-data))]
      (is (re-find #"\u001b\[[0-9;]*mTODO" output))
      (is (= (str "1 Root\n"
                  "\n"
                  "Linked References (2)\n"
                  "100 Page A\n"
                  "10  └── TODO Ref A\n"
                  "\n"
                  "101 Page B\n"
                  "11  └── Ref B")
             (strip-ansi output))))))

(deftest test-tree->text-appends-tags
  (testing "show tree text appends block tags to content"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child"
                                              :block/tags [{:block/title "RTC"}
                                                           {:block/name "task"}]}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (string/includes? output (style/bold "#RTC")))
      (is (string/includes? output (style/bold "#task")))
      (is (= (str "1 Root\n"
                  "2 └── Child #RTC #task")
             (strip-ansi output))))))

(deftest test-tree->text-status-colors
  (testing "show tree text uses green for DONE status"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child"
                                              :logseq.property/status {:db/ident :logseq.property/status.done
                                                                       :block/title "DONE"}}]}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (string/includes? output (style/green "DONE")))
      (is (= (str "1 Root\n"
                  "2 └── DONE Child")
             (strip-ansi output))))))

(deftest test-tree->text-replaces-uuid-refs
  (testing "show tree text replaces inline [[uuid]] with referenced block content recursively"
    (let [tree->text #'show-command/tree->text
          uuid "11111111-1111-1111-1111-111111111111"
          nested "22222222-2222-2222-2222-222222222222"
          tree-data {:root {:db/id 1
                            :block/title (str "See [[" uuid "]]")}
                     :uuid->label {(string/lower-case uuid) (str "Target [[" nested "]]")
                                   (string/lower-case nested) "Inner"}}
          output (binding [style/*color-enabled?* true]
                   (tree->text tree-data))]
      (is (= (str "1 See [[Target [[Inner]]]]")
             (strip-ansi output))))))

(deftest test-help-upsert-update-options
  (testing "upsert block help includes update options and removes legacy flags"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["upsert" "block" "--help"])))]
      (is (string/includes? (strip-ansi summary) "--update-tags"))
      (is (string/includes? (strip-ansi summary) "--update-properties"))
      (is (not (string/includes? (strip-ansi summary) "--tags")))
      (is (not (string/includes? (strip-ansi summary) "--properties")))))

  (testing "upsert page help includes update options and removes legacy flags"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["upsert" "page" "--help"])))]
      (is (string/includes? (strip-ansi summary) "--id"))
      (is (string/includes? (strip-ansi summary) "--update-tags"))
      (is (string/includes? (strip-ansi summary) "--update-properties"))
      (is (not (string/includes? (strip-ansi summary) "--tags")))
      (is (not (string/includes? (strip-ansi summary) "--properties"))))))

(deftest test-show-json-edn-strips-block-uuid
  (testing "show json/edn removes :block/uuid recursively while keeping :db/id"
    (let [tree-data {:root {:db/id 1
                            :block/uuid "root-uuid"
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/uuid "child-uuid"
                                              :block/title "Child"
                                              :block/tags [{:db/id 3
                                                            :block/uuid "tag-uuid"
                                                            :block/title "Tag"}]}]}
                     :linked-references {:count 1
                                         :blocks [{:db/id 4
                                                   :block/uuid "ref-uuid"
                                                   :block/page {:db/id 5
                                                                :block/uuid "page-uuid"
                                                                :block/title "Page"}}]}
                     :uuid->label {"root-uuid" "Root"}}
          stripped (#'show-command/strip-block-uuid tree-data)]
      (is (not (contains-block-uuid? stripped)))
      (is (= 1 (get-in stripped [:root :db/id])))
      (is (= 2 (get-in stripped [:root :block/children 0 :db/id]))))))

(deftest test-show-selectors-include-db-ident
  (async done
         (let [selectors (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ selector _] args]
                                                                       (swap! selectors conj selector)
                                                                       (p/resolved {:db/id 1
                                                                                    :block/page {:db/id 2}}))
                                                    :thread-api/q (let [[_ [query _]] args
                                                                        pull-form (second query)
                                                                        selector (when (and (seq? pull-form)
                                                                                            (= 'pull (first pull-form)))
                                                                                   (nth pull-form 2))]
                                                                    (when selector
                                                                      (swap! selectors conj selector))
                                                                    (p/resolved []))
                                                    :thread-api/get-block-refs (p/resolved [{:db/id 10}])
                                                    (p/resolved nil)))]
                 (p/let [_ (show-command/execute-show {:type :show
                                                       :repo "demo"
                                                       :id 1}
                                                      {:output-format :json})]
                   (is (some #(some #{:db/ident} %) @selectors))
                   (is (some #(and (some #{:db/ident} %)
                                   (some (fn [entry]
                                           (and (map? entry)
                                                (contains? entry :block/page)))
                                         %))
                             @selectors))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-show-linked-references-disabled
  (async done
         (let [method-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke (fn [_ method _ _]
                                                  (swap! method-calls conj method)
                                                  (case method
                                                    :thread-api/pull (p/resolved {:db/id 1
                                                                                  :block/page {:db/id 2}})
                                                    :thread-api/q (p/resolved [])
                                                    :thread-api/get-block-refs (p/resolved [{:db/id 10}])
                                                    (p/resolved nil)))]
                 (p/let [result (show-command/execute-show {:type :show
                                                            :repo "demo"
                                                            :id 1
                                                            :linked-references? false}
                                                           {:output-format :json})]
                   (is (= :ok (:status result)))
                   (is (not (contains? (:data result) :linked-references)))
                   (is (not (some #{:thread-api/get-block-refs} @method-calls)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-show-linked-references-enabled
  (async done
         (let [method-calls (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke (fn [_ method _ _]
                                                  (swap! method-calls conj method)
                                                  (case method
                                                    :thread-api/pull (p/resolved {:db/id 1
                                                                                  :block/page {:db/id 2}})
                                                    :thread-api/q (p/resolved [])
                                                    :thread-api/get-block-refs (p/resolved [{:db/id 10}])
                                                    (p/resolved nil)))]
                 (p/let [result (show-command/execute-show {:type :show
                                                            :repo "demo"
                                                            :id 1
                                                            :linked-references? true}
                                                           {:output-format :json})]
                   (is (= :ok (:status result)))
                   (is (contains? (:data result) :linked-references))
                   (is (some #{:thread-api/get-block-refs} @method-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-show-id-only-entity-is-not-found
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                             transport/invoke (fn [_ method _ _]
                                                (case method
                                                  :thread-api/pull (p/resolved {:db/id 212})
                                                  :thread-api/q (p/resolved [])
                                                  :thread-api/get-block-refs (p/resolved [])
                                                  (p/resolved nil)))]
               (show-command/execute-show {:type :show
                                           :repo "demo"
                                           :id 212}
                                          {:output-format :json}))
             (p/then (fn [_]
                       (is false "expected execute-show to reject for id-only entity")))
             (p/catch (fn [e]
                        (is (= :entity-not-found (:code (ex-data e))))))
             (p/finally done))))

(deftest test-tree->text-uuid-ref-recursion-limit
  (testing "show tree text limits uuid ref replacement depth"
    (let [tree->text #'show-command/tree->text
          uuids ["00000000-0000-0000-0000-000000000001"
                 "00000000-0000-0000-0000-000000000002"
                 "00000000-0000-0000-0000-000000000003"
                 "00000000-0000-0000-0000-000000000004"
                 "00000000-0000-0000-0000-000000000005"
                 "00000000-0000-0000-0000-000000000006"
                 "00000000-0000-0000-0000-000000000007"
                 "00000000-0000-0000-0000-000000000008"
                 "00000000-0000-0000-0000-000000000009"
                 "00000000-0000-0000-0000-000000000010"
                 "00000000-0000-0000-0000-000000000011"]
          uuid->label (into {}
                            (map-indexed (fn [idx id]
                                           (let [label (if (< idx 10)
                                                         (str "L" (inc idx) " [[" (nth uuids (inc idx)) "]]")
                                                         (str "L" (inc idx)))]
                                             [(string/lower-case id) label]))
                                         uuids))
          tree-data {:root {:db/id 1
                            :block/title (str "Root [[" (first uuids) "]]")}
                     :uuid->label uuid->label}
          result (tree->text tree-data)]
      (is (string/includes? result (str "[[" (nth uuids 10) "]]"))))))

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

(deftest test-list-execute-default-sort-updated-at
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                             transport/invoke (fn [_ method _ _]
                                                (case method
                                                  :thread-api/cli-list-pages [{:db/id 11 :block/title "Page C" :block/updated-at 30}
                                                                              {:db/id 7 :block/title "Page B" :block/updated-at 10}
                                                                              {:db/id 5 :block/title "Page A" :block/updated-at 10}]
                                                  :thread-api/cli-list-tags [{:db/id 4 :block/title "Tag C" :block/updated-at 20}
                                                                             {:db/id 9 :block/title "Tag B" :block/updated-at 5}
                                                                             {:db/id 2 :block/title "Tag A" :block/updated-at 5}]
                                                  :thread-api/cli-list-properties [{:db/id 8 :block/title "Property C" :block/updated-at 9}
                                                                                   {:db/id 6 :block/title "Property B" :block/updated-at 3}
                                                                                   {:db/id 1 :block/title "Property A" :block/updated-at 3}]
                                                  (throw (ex-info "unexpected invoke" {:method method}))))]
               (p/let [page-result (list-command/execute-list-page {:repo "demo" :options {}} {})
                       tag-result (list-command/execute-list-tag {:repo "demo" :options {}} {})
                       property-result (list-command/execute-list-property {:repo "demo" :options {}} {})]
                 (is (= [5 7 11] (item-ids page-result)))
                 (is (= [2 9 4] (item-ids tag-result)))
                 (is (= [1 6 8] (item-ids property-result)))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-list-execute-default-sort-respects-order-and-explicit-sort
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                             transport/invoke (fn [_ method _ _]
                                                (case method
                                                  :thread-api/cli-list-pages [{:db/id 3 :block/title "Gamma" :block/updated-at 20}
                                                                              {:db/id 2 :block/title "Alpha" :block/updated-at 5}
                                                                              {:db/id 1 :block/title "Beta" :block/updated-at 10}]
                                                  (throw (ex-info "unexpected invoke" {:method method}))))]
               (p/let [desc-default-result (list-command/execute-list-page {:repo "demo" :options {:order "desc"}} {})
                       explicit-sort-result (list-command/execute-list-page {:repo "demo" :options {:sort "title"}} {})]
                 (is (= [3 1 2] (item-ids desc-default-result)))
                 (is (= [2 1 3] (item-ids explicit-sort-result)))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-verb-subcommand-parse-upsert-remove
  (testing "remove block parses with id"
    (let [result (commands/parse-args ["remove" "block" "--id" "10"])]
      (is (true? (:ok? result)))
      (is (= :remove-block (:command result)))
      (is (= 10 (get-in result [:options :id])))))

  (testing "remove page parses with name"
    (let [result (commands/parse-args ["remove" "page" "--name" "Home"])]
      (is (true? (:ok? result)))
      (is (= :remove-page (:command result)))
      (is (= "Home" (get-in result [:options :name])))))

  (testing "remove tag parses with name"
    (let [result (commands/parse-args ["remove" "tag" "--name" "Quote"])]
      (is (true? (:ok? result)))
      (is (= :remove-tag (:command result)))
      (is (= "Quote" (get-in result [:options :name])))))

  (testing "remove property parses with id"
    (let [result (commands/parse-args ["remove" "property" "--id" "123"])]
      (is (true? (:ok? result)))
      (is (= :remove-property (:command result)))
      (is (= 123 (get-in result [:options :id])))))

  (testing "remove block rejects empty id vector"
    (let [result (commands/parse-args ["remove" "block" "--id" "[]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "remove block rejects invalid id vector"
    (let [result (commands/parse-args ["remove" "block" "--id" "[1 \"no\"]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert tag parses with name"
    (let [result (commands/parse-args ["upsert" "tag" "--name" "Quote"])]
      (is (true? (:ok? result)))
      (is (= :upsert-tag (:command result)))
      (is (= "Quote" (get-in result [:options :name])))))

  (testing "upsert tag parses with id"
    (let [result (commands/parse-args ["upsert" "tag" "--id" "10"])]
      (is (true? (:ok? result)))
      (is (= :upsert-tag (:command result)))
      (is (= 10 (get-in result [:options :id])))))

  (testing "upsert tag parses with id and name"
    (let [result (commands/parse-args ["upsert" "tag"
                                       "--id" "10"
                                       "--name" "Project Renamed"])]
      (is (true? (:ok? result)))
      (is (= :upsert-tag (:command result)))
      (is (= 10 (get-in result [:options :id])))
      (is (= "Project Renamed" (get-in result [:options :name])))))

  (testing "upsert property parses with type and cardinality"
    (let [result (commands/parse-args ["upsert" "property"
                                       "--name" "owner"
                                       "--type" "node"
                                       "--cardinality" "many"])]
      (is (true? (:ok? result)))
      (is (= :upsert-property (:command result)))
      (is (= "owner" (get-in result [:options :name])))
      (is (= "node" (get-in result [:options :type])))
      (is (= "many" (get-in result [:options :cardinality])))))

  (testing "upsert property parses with id and type"
    (let [result (commands/parse-args ["upsert" "property"
                                       "--id" "11"
                                       "--type" "node"])]
      (is (true? (:ok? result)))
      (is (= :upsert-property (:command result)))
      (is (= 11 (get-in result [:options :id])))
      (is (= "node" (get-in result [:options :type])))))

  (testing "upsert property rejects invalid type"
    (let [result (commands/parse-args ["upsert" "property"
                                       "--name" "owner"
                                       "--type" "wat"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert property rejects invalid cardinality"
    (let [result (commands/parse-args ["upsert" "property"
                                       "--name" "owner"
                                       "--cardinality" "triple"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-verb-subcommand-parse-upsert-block-mode

  (testing "upsert block create mode requires content when source selectors are absent"
    (let [result (commands/parse-args ["upsert" "block" "--target-id" "10"])]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "upsert block update mode requires target or update/remove options"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert block parses with source and target"
    (let [result (commands/parse-args ["upsert" "block" "--uuid" "11111111-1111-1111-1111-111111111111" "--target-uuid" "22222222-2222-2222-2222-222222222222" "--pos" "last-child"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= "11111111-1111-1111-1111-111111111111" (get-in result [:options :uuid])))
      (is (= "22222222-2222-2222-2222-222222222222" (get-in result [:options :target-uuid])))
      (is (= "last-child" (get-in result [:options :pos])))))

  (testing "upsert block parses with update tags and properties"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1"
                                       "--update-tags" "[\"TagA\"]"
                                       "--update-properties" "{:logseq.property/publishing-public? true}"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= "[\"TagA\"]" (get-in result [:options :update-tags])))
      (is (= "{:logseq.property/publishing-public? true}" (get-in result [:options :update-properties])))))

  (testing "upsert block allows updates without move target"
    (let [result (commands/parse-args ["upsert" "block" "--uuid" "11111111-1111-1111-1111-111111111111"
                                       "--update-tags" "[\"TagA\"]"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= "11111111-1111-1111-1111-111111111111" (get-in result [:options :uuid])))))

  (testing "upsert block update mode accepts status-only updates"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1"
                                       "--status" "done"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= 1 (get-in result [:options :id])))
      (is (= "done" (get-in result [:options :status])))))

  (testing "upsert block update mode accepts content-only updates"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1"
                                       "--content" "updated text"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= 1 (get-in result [:options :id])))
      (is (= "updated text" (get-in result [:options :content])))))

  (testing "upsert block forces update mode when id and content are both provided"
    (let [result (commands/parse-args ["upsert" "block"
                                       "--id" "1"
                                       "--content" "hello"
                                       "--update-tags" "[\"TagA\"]"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= 1 (get-in result [:options :id])))
      (is (= "hello" (get-in result [:options :content])))
      (is (= "[\"TagA\"]" (get-in result [:options :update-tags]))))))

(deftest test-verb-subcommand-parse-add
  (testing "upsert block create mode requires content source"
    (let [result (commands/parse-args ["upsert" "block"])]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "upsert block create mode parses with content"
    (let [result (commands/parse-args ["upsert" "block" "--content" "hello"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= "hello" (get-in result [:options :content])))))

  (testing "upsert block create mode parses with target selectors and pos"
    (let [result (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--target-uuid" "11111111-1111-1111-1111-111111111111"
                                       "--pos" "first-child"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= "11111111-1111-1111-1111-111111111111" (get-in result [:options :target-uuid])))
      (is (= "first-child" (get-in result [:options :pos])))))

  (testing "upsert block create mode parses with update tags and update properties"
    (let [result (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--update-tags" "[\"TagA\" \"TagB\"]"
                                       "--update-properties" "{:logseq.property/publishing-public? true}"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= "[\"TagA\" \"TagB\"]" (get-in result [:options :update-tags])))
      (is (= "{:logseq.property/publishing-public? true}" (get-in result [:options :update-properties])))))

  (testing "upsert block rejects invalid pos"
    (let [result (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--pos" "middle"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert block rejects removed --tags option"
    (let [result (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--tags" "[\"TagA\"]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert block rejects removed --properties option"
    (let [result (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--properties" "{:logseq.property/publishing-public? true}"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-verb-subcommand-parse-upsert-page-mode
  (testing "upsert page requires page name"
    (let [result (commands/parse-args ["upsert" "page"])]
      (is (false? (:ok? result)))
      (is (= :missing-page-name (get-in result [:error :code])))))

  (testing "upsert page parses with name"
    (let [result (commands/parse-args ["upsert" "page" "--page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :upsert-page (:command result)))
      (is (= "Home" (get-in result [:options :page])))))

  (testing "upsert page parses with id update mode"
    (let [result (commands/parse-args ["upsert" "page"
                                       "--id" "42"
                                       "--update-properties" "{:logseq.property/publishing-public? true}"])]
      (is (true? (:ok? result)))
      (is (= :upsert-page (:command result)))
      (is (= 42 (get-in result [:options :id])))
      (is (= "{:logseq.property/publishing-public? true}" (get-in result [:options :update-properties])))))

  (testing "upsert page rejects removed --tags and --properties options"
    (let [result (commands/parse-args ["upsert" "page"
                                       "--page" "Home"
                                       "--tags" "[\"TagA\"]"
                                       "--properties" "{:logseq.property/publishing-public? true}"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert page parses update and remove options"
    (let [result (commands/parse-args ["upsert" "page"
                                       "--page" "Home"
                                       "--update-tags" "[\"TagB\"]"
                                       "--remove-properties" "[:logseq.property/deadline]"])]
      (is (true? (:ok? result)))
      (is (= :upsert-page (:command result)))
      (is (= "[\"TagB\"]" (get-in result [:options :update-tags])))
      (is (= "[:logseq.property/deadline]" (get-in result [:options :remove-properties])))))

  (testing "upsert page rejects selector conflict for --id and --page"
    (let [result (commands/parse-args ["upsert" "page"
                                       "--id" "10"
                                       "--page" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "legacy add tag is no longer supported"
    (let [result (commands/parse-args ["add" "tag" "--name" "Quote"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code]))))))

(deftest test-verb-subcommand-parse-update-target-page
  (testing "upsert block update mode parses with target page"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--target-page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :upsert-block (:command result)))
      (is (= 1 (get-in result [:options :id])))
      (is (= "Home" (get-in result [:options :target-page]))))))

(deftest test-verb-subcommand-parse-show
  (testing "show requires target"
    (let [result (commands/parse-args ["show"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "show parses with page"
    (let [result (commands/parse-args ["show" "--page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :show (:command result)))
      (is (= "Home" (get-in result [:options :page])))))

  (testing "show parses with id vector"
    (let [result (commands/parse-args ["show" "--id" "[1 2]"])]
      (is (true? (:ok? result)))
      (is (= :show (:command result)))
      (is (= "[1 2]" (get-in result [:options :id])))))

  (testing "show rejects invalid id edn"
    (let [result (commands/parse-args ["show" "--id" "[1"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "show rejects legacy page-name option"
    (let [result (commands/parse-args ["show" "--page-name" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "show rejects format option"
    (let [result (commands/parse-args ["show" "--format" "json" "--page" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "show help lists linked references option"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["show" "--help"])))]
      (is (string/includes? (strip-ansi summary) "--linked-references")))))

(deftest test-verb-subcommand-parse-query
  (testing "query shows group help"
    (let [result (commands/parse-args ["query"])]
      (is (true? (:help? result)))
      (is (string/includes? (:summary result) "query list"))))

  (testing "query parses with query and inputs"
    (let [result (commands/parse-args ["query"
                                       "--query" "[:find ?e :where [?e :block/title \"Hello\"]]"
                                       "--inputs" "[\"Hello\"]"])]
      (is (true? (:ok? result)))
      (is (= :query (:command result)))
      (is (= "[:find ?e :where [?e :block/title \"Hello\"]]"
             (get-in result [:options :query])))
      (is (= "[\"Hello\"]" (get-in result [:options :inputs]))))))

(deftest test-verb-subcommand-parse-graph-import-export
  (testing "graph create requires --graph even with positional args"
    (let [result (commands/parse-args ["graph" "create" "demo"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "graph export parses with type and file"
    (let [result (commands/parse-args ["graph" "export"
                                       "--type" "edn"
                                       "--file" "export.edn"])]
      (is (true? (:ok? result)))
      (is (= :graph-export (:command result)))
      (is (= "edn" (get-in result [:options :type])))
      (is (= "export.edn" (get-in result [:options :file])))))

  (testing "graph import parses with type, input, and repo"
    (let [result (commands/parse-args ["graph" "import"
                                       "--type" "sqlite"
                                       "--input" "import.sqlite"
                                       "--graph" "demo"])]
      (is (true? (:ok? result)))
      (is (= :graph-import (:command result)))
      (is (= "sqlite" (get-in result [:options :type])))
      (is (= "import.sqlite" (get-in result [:options :input])))
      (is (= "demo" (get-in result [:options :graph])))))

  (testing "graph export requires type"
    (let [result (commands/parse-args ["graph" "export" "--file" "export.edn"])]
      (is (false? (:ok? result)))
      (is (= :missing-type (get-in result [:error :code])))))

  (testing "graph export requires file"
    (let [result (commands/parse-args ["graph" "export" "--type" "edn"])]
      (is (false? (:ok? result)))
      (is (= :missing-file (get-in result [:error :code])))))

  (testing "graph export accepts global output format and still requires file"
    (let [result (commands/parse-args ["graph" "export" "--type" "edn" "--output" "json"])]
      (is (false? (:ok? result)))
      (is (= :missing-file (get-in result [:error :code])))))

  (testing "graph import requires graph"
    (let [result (commands/parse-args ["graph" "import"
                                       "--type" "edn"
                                       "--input" "import.edn"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "sync download requires graph"
    (let [result (commands/parse-args ["sync" "download"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

  (testing "sync download accepts progress option"
    (let [disabled (commands/parse-args ["sync" "download" "--graph" "demo" "--progress" "false"])
          enabled (commands/parse-args ["sync" "download" "--graph" "demo" "--progress" "true"])]
      (is (true? (:ok? disabled)))
      (is (= false (get-in disabled [:options :progress])))
      (is (true? (:ok? enabled)))
      (is (= true (get-in enabled [:options :progress])))))

  (testing "graph import rejects unknown type"
    (let [result (commands/parse-args ["graph" "import"
                                       "--type" "zip"
                                       "--input" "import.zip"
                                       "--graph" "demo"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "server status accepts prefix-like repo option values"
    (let [result (commands/parse-args ["server" "status"
                                       "--graph" "logseq_db_logseq_db_demo"])]
      (is (true? (:ok? result)))
      (is (= :server-status (:command result)))
      (is (= "logseq_db_logseq_db_demo" (get-in result [:options :graph]))))))

(deftest test-verb-subcommand-parse-flags
  (testing "verb subcommands reject unknown flags"
    (doseq [args [["list" "page" "--wat"]
                  ["upsert" "block" "--wat"]
                  ["upsert" "page" "--wat"]
                  ["remove" "block" "--wat"]
                  ["upsert" "tag" "--wat"]
                  ["show" "--wat"]]]
      (let [result (commands/parse-args args)]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code]))))))

  (testing "verb subcommands accept output option"
    (let [result (commands/parse-args ["show" "--output" "json" "--page" "Home"])]
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
    (let [parsed {:ok? true :command :graph-switch :options {:graph "demo"}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :graph-switch (get-in result [:action :type])))))

  (testing "graph-info defaults to config repo"
    (let [parsed {:ok? true :command :graph-info :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :graph-info (get-in result [:action :type])))))

  (testing "graph export uses config repo"
    (let [parsed {:ok? true
                  :command :graph-export
                  :options {:type "edn" :file "export.edn"}}
          result (commands/build-action parsed {:graph "demo"})]
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
    (let [parsed {:ok? true :command :server-stop :options {:graph "demo"}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :server-stop (get-in result [:action :type])))))

  (testing "server status canonicalizes multi-prefixed repo option"
    (let [parsed {:ok? true :command :server-status :options {:graph "logseq_db_logseq_db_demo"}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :server-status (get-in result [:action :type])))
      (is (= "logseq_db_demo" (get-in result [:action :repo]))))))

(deftest test-build-action-doctor
  (testing "doctor builds action"
    (let [parsed {:ok? true :command :doctor :options {}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :doctor (get-in result [:action :type])))))

  (testing "doctor dev script option builds explicit static runtime action"
    (let [parsed {:ok? true :command :doctor :options {:dev-script true}}
          result (commands/build-action parsed {})]
      (is (true? (:ok? result)))
      (is (= :doctor (get-in result [:action :type])))
      (is (= (cli-server/db-worker-dev-script-path)
             (get-in result [:action :script-path]))))))

(deftest test-build-action-inspect-edit-add-upsert
  (testing "list page requires repo"
    (let [parsed {:ok? true :command :list-page :options {}}
          result (commands/build-action parsed {})]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "add block requires content"
    (let [parsed {:ok? true :command :upsert-block :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "add block builds insert-blocks op"
    (let [parsed {:ok? true :command :upsert-block :options {:content "hello"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :upsert-block (get-in result [:action :type])))))

  (testing "add page requires name"
    (let [parsed {:ok? true :command :upsert-page :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-page-name (get-in result [:error :code])))))

  (testing "upsert page by id builds update action"
    (let [parsed {:ok? true
                  :command :upsert-page
                  :options {:id 42
                            :update-properties "{:logseq.property/publishing-public? true}"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :update (get-in result [:action :mode])))
      (is (= 42 (get-in result [:action :id]))))))

(deftest test-build-action-upsert-tag-property

  (testing "upsert tag requires name"
    (let [parsed {:ok? true :command :upsert-tag :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-tag-name (get-in result [:error :code])))))

  (testing "upsert tag builds normalized action"
    (let [parsed {:ok? true :command :upsert-tag :options {:name "  #Quote  "}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= {:type :upsert-tag
              :mode :create
              :repo "logseq_db_demo"
              :graph "demo"
              :name "Quote"}
             (:action result)))))

  (testing "upsert tag by id builds update action"
    (let [parsed {:ok? true :command :upsert-tag :options {:id 123}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= {:type :upsert-tag
              :mode :update
              :repo "logseq_db_demo"
              :graph "demo"
              :id 123}
             (:action result)))))

  (testing "upsert tag by id with name builds update action"
    (let [parsed {:ok? true :command :upsert-tag :options {:id 123 :name "  #Project Renamed  "}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= {:type :upsert-tag
              :mode :update
              :repo "logseq_db_demo"
              :graph "demo"
              :id 123
              :name "Project Renamed"}
             (:action result)))))

  (testing "upsert tag by id rejects blank rename name"
    (let [parsed {:ok? true :command :upsert-tag :options {:id 123 :name "   "}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert property coerces schema options"
    (let [parsed {:ok? true
                  :command :upsert-property
                  :options {:name "owner"
                            :type "node"
                            :cardinality "many"
                            :hide true
                            :public false}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= {:type :upsert-property
              :mode :create
              :repo "logseq_db_demo"
              :graph "demo"
              :name "owner"
              :schema {:logseq.property/type :node
                       :db/cardinality :db.cardinality/many
                       :logseq.property/hide? true
                       :logseq.property/public? false}}
             (:action result)))))

  (testing "upsert property by id builds update action"
    (let [parsed {:ok? true
                  :command :upsert-property
                  :options {:id 654
                            :type "node"
                            :cardinality "many"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= {:type :upsert-property
              :mode :update
              :repo "logseq_db_demo"
              :graph "demo"
              :id 654
              :schema {:logseq.property/type :node
                       :db/cardinality :db.cardinality/many}}
             (:action result))))))

(deftest test-build-action-inspect-edit-remove-show

  (testing "remove block requires target"
    (let [parsed {:ok? true :command :remove-block :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "remove block normalizes id vector in build action"
    (let [parsed {:ok? true :command :remove-block :options {:id "[1 2]"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :remove-block (get-in result [:action :type])))
      (is (= [1 2] (get-in result [:action :ids])))))

  (testing "remove page requires name"
    (let [parsed {:ok? true :command :remove-page :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-page-name (get-in result [:error :code])))))

  (testing "remove tag parses by id"
    (let [parsed {:ok? true :command :remove-tag :options {:id 42}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :remove-tag (get-in result [:action :type])))
      (is (= 42 (get-in result [:action :id])))))

  (testing "remove property parses by name"
    (let [parsed {:ok? true :command :remove-property :options {:name "owner"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :remove-property (get-in result [:action :type])))
      (is (= "owner" (get-in result [:action :name])))))

  (testing "show requires target"
    (let [parsed {:ok? true :command :show :options {}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "show normalizes id vector in build action"
    (let [parsed {:ok? true :command :show :options {:id "[1 2]"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :show (get-in result [:action :type])))
      (is (= [1 2] (get-in result [:action :ids]))))))

(deftest test-build-action-add-validates-properties
  (testing "add block accepts custom property key in update-properties"
    (let [parsed (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--update-properties" "{:not/a 1}"])
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= {:not/a 1} (get-in result [:action :update-properties])))))

  (testing "add block accepts property title key"
    (let [parsed (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--update-properties" "{\"Publishing Public?\" true}"])
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :logseq.property/publishing-public?
             (-> result :action :update-properties keys first)))))

  (testing "add block rejects non-public built-in property"
    (let [parsed (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--update-properties" "{:logseq.property/heading 1}"])
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "add block rejects invalid checkbox value"
    (let [parsed (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--update-properties" "{:logseq.property/publishing-public? \"nope\"}"])
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-build-action-add-accepts-tag-ids
  (testing "add block accepts numeric tag ids"
    (let [parsed (commands/parse-args ["upsert" "block"
                                       "--content" "hello"
                                       "--update-tags" "[42]"])
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= [42] (get-in result [:action :update-tags]))))))

(deftest test-tag-lookup-ref-accepts-id
  (let [tag-lookup-ref #'add-command/tag-lookup-ref]
    (is (= 42 (tag-lookup-ref 42)))))

(deftest test-normalize-property-key-input-accepts-id
  (let [normalize-property-key-input #'add-command/normalize-property-key-input]
    (is (= {:type :id :value 42} (normalize-property-key-input 42)))))

(deftest test-build-action-update
  (testing "upsert block create mode requires content when source selector is absent"
    (let [parsed {:ok? true :command :upsert-block :options {:target-id 2}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-content (get-in result [:error :code])))))

  (testing "upsert block update mode requires target or update/remove options"
    (let [parsed {:ok? true :command :upsert-block :options {:id 1}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update accepts update tags without target"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1 :update-tags "[\"TagA\"]"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :upsert-block (get-in result [:action :type])))
      (is (= ["TagA"] (get-in result [:action :update-tags])))))

  (testing "update accepts status-only updates"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1 :status "in-progress"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :upsert-block (get-in result [:action :type])))
      (is (= :logseq.property/status.doing
             (get-in result [:action :update-properties :logseq.property/status])))))

  (testing "update accepts content-only updates"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1 :content "updated text"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :upsert-block (get-in result [:action :type])))
      (is (= "updated text" (get-in result [:action :content])))))

  (testing "update rejects invalid status"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1 :status "invalid-status"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update properties status takes precedence over --status"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1
                            :status "doing"
                            :update-properties "{:logseq.property/status :logseq.property/status.done}"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :logseq.property/status.done
             (get-in result [:action :update-properties :logseq.property/status])))))

  (testing "update rejects invalid update tags"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1 :update-tags "{:tag \"no\"}"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert block forces update mode when id and content are both provided"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1 :content "hello" :update-tags "[\"TagA\"]"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :upsert-block (get-in result [:action :type])))
      (is (= 1 (get-in result [:action :id])))
      (is (= ["TagA"] (get-in result [:action :update-tags])))))

  (testing "update accepts custom property identifiers"
    (let [parsed {:ok? true
                  :command :upsert-block
                  :options {:id 1
                            :update-properties "{:user.property/owner \"alice\"}"
                            :remove-properties "[:user.property/owner]"}}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :upsert-block (get-in result [:action :type])))
      (is (= {:user.property/owner "alice"}
             (get-in result [:action :update-properties])))
      (is (= [:user.property/owner]
             (get-in result [:action :remove-properties]))))))

(deftest test-update-parse-validation
  (testing "update rejects multiple source selectors"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--uuid" "abc" "--target-id" "2"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects multiple target selectors"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--target-id" "2" "--target-uuid" "def"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects invalid position"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--target-id" "2" "--pos" "middle"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects sibling pos for page target"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--target-page" "Home" "--pos" "sibling"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects legacy target-page-name option"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--target-page-name" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects pos without target"
    (let [result (commands/parse-args ["upsert" "block" "--id" "1" "--pos" "last-child" "--update-tags" "[\"TagA\"]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-execute-upsert-tag-builds-create-page-op
  (async done
         (let [ops* (atom nil)
               created?* (atom false)
               action {:type :upsert-tag
                       :repo "demo"
                       :name "Quote"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (if (= lookup [:block/name "quote"])
                                                                         (if @created?*
                                                                           {:db/id 4242
                                                                            :block/name "quote"
                                                                            :block/title "Quote"
                                                                            :block/tags [{:db/ident :logseq.class/Tag}]}
                                                                           {})
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (reset! created?* true)
                                                                                     (reset! ops* ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [4242] (get-in result [:data :result])))
                   (is (= [[:create-page ["Quote" {:class? true}]]]
                          @ops*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-rejects-existing-non-tag-page
  (async done
         (let [action {:type :upsert-tag
                       :repo "demo"
                       :name "Home"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (if (= lookup [:block/name "home"])
                                                                         {:db/id 99
                                                                          :block/name "home"
                                                                          :block/title "Home"
                                                                          :block/tags [{:db/ident :logseq.class/Page}]}
                                                                         {}))
                                                    :thread-api/apply-outliner-ops
                                                    (throw (ex-info "should not create tag" {:args args}))
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :error (:status result)))
                   (is (= :tag-name-conflict (get-in result [:error :code])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-idempotent-when-tag-exists
  (async done
         (let [apply-calls* (atom 0)
               action {:type :upsert-tag
                       :repo "demo"
                       :name "Quote"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (if (= lookup [:block/name "quote"])
                                                                         {:db/id 4242
                                                                          :block/name "quote"
                                                                          :block/title "Quote"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (do
                                                                                     (swap! apply-calls* inc)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [4242] (get-in result [:data :result])))
                   (is (= 0 @apply-calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-property-emits-upsert-op
  (async done
         (let [ops* (atom nil)
               created?* (atom false)
               action {:type :upsert-property
                       :repo "demo"
                       :name "owner"
                       :schema {:logseq.property/type :node
                                :db/cardinality :db.cardinality/many}}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (if @created?*
                                                                       {:db/id 654
                                                                        :db/ident :user.property/owner
                                                                        :block/name "owner"
                                                                        :block/title "owner"
                                                                        :logseq.property/type :node}
                                                                       {})
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (reset! created?* true)
                                                                                     (reset! ops* ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [[:upsert-property [nil
                                              {:logseq.property/type :node
                                               :db/cardinality :db.cardinality/many}
                                              {:property-name "owner"}]]]
                          @ops*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-by-id-no-op
  (async done
         (let [apply-calls* (atom 0)
               action {:type :upsert-tag
                       :mode :update
                       :repo "demo"
                       :id 4242}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (if (= lookup 4242)
                                                                         {:db/id 4242
                                                                          :block/name "quote"
                                                                          :block/title "Quote"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (do
                                                                                     (swap! apply-calls* inc)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [4242] (get-in result [:data :result])))
                   (is (= 0 @apply-calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-by-id-with-name-emits-rename-op
  (async done
         (let [ops* (atom nil)
               apply-calls* (atom 0)
               action {:type :upsert-tag
                       :mode :update
                       :repo "demo"
                       :id 4242
                       :name "Project Renamed"}
               tag-uuid (uuid "00000000-0000-0000-0000-000000004242")]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (cond
                                                                         (= lookup 4242)
                                                                         {:db/id 4242
                                                                          :block/uuid tag-uuid
                                                                          :block/name "project"
                                                                          :block/title "Project"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}

                                                                         (= lookup [:block/name "project renamed"])
                                                                         {}

                                                                         :else
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (swap! apply-calls* inc)
                                                                                     (reset! ops* ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [4242] (get-in result [:data :result])))
                   (is (= 1 @apply-calls*))
                   (is (= [[:rename-page [tag-uuid "Project Renamed"]]]
                          @ops*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-by-id-with-name-no-op-when-normalized-name-matches
  (async done
         (let [apply-calls* (atom 0)
               action {:type :upsert-tag
                       :mode :update
                       :repo "demo"
                       :id 4242
                       :name "  #QUOTE "}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (if (= lookup 4242)
                                                                         {:db/id 4242
                                                                          :block/uuid (uuid "00000000-0000-0000-0000-000000004242")
                                                                          :block/name "quote"
                                                                          :block/title "Quote"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (do
                                                                                     (swap! apply-calls* inc)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [4242] (get-in result [:data :result])))
                   (is (= 0 @apply-calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-by-id-with-name-rejects-existing-non-tag-page
  (async done
         (let [apply-calls* (atom 0)
               action {:type :upsert-tag
                       :mode :update
                       :repo "demo"
                       :id 4242
                       :name "Project Renamed"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (cond
                                                                         (= lookup 4242)
                                                                         {:db/id 4242
                                                                          :block/uuid (uuid "00000000-0000-0000-0000-000000004242")
                                                                          :block/name "project"
                                                                          :block/title "Project"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}

                                                                         (= lookup [:block/name "project renamed"])
                                                                         {:db/id 5000
                                                                          :block/name "project renamed"
                                                                          :block/title "Project Renamed"
                                                                          :block/tags [{:db/ident :logseq.class/Page}]}

                                                                         :else
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (do
                                                                                     (swap! apply-calls* inc)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :error (:status result)))
                   (is (= :tag-name-conflict (get-in result [:error :code])))
                   (is (= 0 @apply-calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-tag-by-id-with-name-rejects-existing-tag
  (async done
         (let [apply-calls* (atom 0)
               action {:type :upsert-tag
                       :mode :update
                       :repo "demo"
                       :id 4242
                       :name "Project Renamed"}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (cond
                                                                         (= lookup 4242)
                                                                         {:db/id 4242
                                                                          :block/uuid (uuid "00000000-0000-0000-0000-000000004242")
                                                                          :block/name "project"
                                                                          :block/title "Project"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}

                                                                         (= lookup [:block/name "project renamed"])
                                                                         {:db/id 9001
                                                                          :block/uuid (uuid "00000000-0000-0000-0000-000000009001")
                                                                          :block/name "project renamed"
                                                                          :block/title "Project Renamed"
                                                                          :block/tags [{:db/ident :logseq.class/Tag}]}

                                                                         :else
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (do
                                                                                     (swap! apply-calls* inc)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :error (:status result)))
                   (is (= :tag-rename-conflict (get-in result [:error :code])))
                   (is (= 0 @apply-calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-id-mode-validates-target-entity
  (async done
         (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                             cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                             transport/invoke (fn [_ method _ args]
                                                (case method
                                                  :thread-api/pull (let [[_ _ lookup] args]
                                                                     (case lookup
                                                                       100 {}
                                                                       101 {:db/id 101
                                                                            :block/uuid (uuid "00000000-0000-0000-0000-000000000101")}
                                                                       200 {}
                                                                       201 {:db/id 201
                                                                            :block/name "not-a-tag"
                                                                            :block/title "Not a tag"
                                                                            :block/tags [{:db/ident :logseq.class/Page}]}
                                                                       300 {}
                                                                       301 {:db/id 301
                                                                            :block/name "not-a-property"
                                                                            :block/title "Not a property"}
                                                                       {}))
                                                  :thread-api/apply-outliner-ops
                                                  (throw (ex-info "should not mutate on invalid id update mode" {:args args}))
                                                  (throw (ex-info "unexpected invoke" {:method method :args args}))))]
               (p/let [page-missing (commands/execute {:type :upsert-page :mode :update :repo "demo" :id 100} {})
                       page-mismatch (commands/execute {:type :upsert-page :mode :update :repo "demo" :id 101} {})
                       tag-missing (commands/execute {:type :upsert-tag :mode :update :repo "demo" :id 200} {})
                       tag-mismatch (commands/execute {:type :upsert-tag :mode :update :repo "demo" :id 201} {})
                       property-missing (commands/execute {:type :upsert-property :mode :update :repo "demo" :id 300} {})
                       property-mismatch (commands/execute {:type :upsert-property :mode :update :repo "demo" :id 301} {})]
                 (is (= :error (:status page-missing)))
                 (is (= :upsert-id-not-found (get-in page-missing [:error :code])))
                 (is (= :error (:status page-mismatch)))
                 (is (= :upsert-id-type-mismatch (get-in page-mismatch [:error :code])))
                 (is (= :error (:status tag-missing)))
                 (is (= :upsert-id-not-found (get-in tag-missing [:error :code])))
                 (is (= :error (:status tag-mismatch)))
                 (is (= :upsert-id-type-mismatch (get-in tag-mismatch [:error :code])))
                 (is (= :error (:status property-missing)))
                 (is (= :upsert-id-not-found (get-in property-missing [:error :code])))
                 (is (= :error (:status property-mismatch)))
                 (is (= :upsert-id-type-mismatch (get-in property-mismatch [:error :code])))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-upsert-block-create-applies-extra-tag-property-ops
  (async done
         (let [ops* (atom nil)
               action {:type :upsert-block :mode :create :repo "demo"
                       :update-tags [:tag/new]
                       :remove-tags [:tag/old]
                       :update-properties {:logseq.property/deadline "2026-01-25T12:00:00Z"}
                       :remove-properties [:logseq.property/publishing-public?]}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               add-command/execute-add-block (fn [_ _] (p/resolved {:status :ok :data {:result [11 12]}}))
                               add-command/resolve-tags (fn [_ _ tags]
                                                          (p/resolved (cond (= tags [:tag/new]) [{:db/id 101}]
                                                                            (= tags [:tag/old]) [{:db/id 202}]
                                                                            :else nil)))
                               add-command/resolve-properties (fn [_ _ properties & _] (p/resolved properties))
                               add-command/resolve-property-identifiers (fn [_ _ properties & _] (p/resolved properties))
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (if (and (vector? lookup) (= :db/ident (first lookup)))
                                                                         {:db/id 99}
                                                                         {}))
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (reset! ops* ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [11 12] (get-in result [:data :result])))
                   (is (= [[:batch-delete-property-value [[11 12] :block/tags 202]]
                           [:batch-remove-property [[11 12] :logseq.property/publishing-public?]]
                           [:batch-set-property [[11 12] :block/tags 101 {}]]
                           [:batch-set-property [[11 12] :logseq.property/deadline "2026-01-25T12:00:00Z" {}]]]
                          @ops*))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-page-applies-ops-on-existing-page
  (async done
         (let [ops* (atom nil)
               action {:type :upsert-page :repo "demo" :page "Home"
                       :update-tags [:tag/next]
                       :remove-tags [:tag/old]
                       :update-properties {:logseq.property/publishing-public? true}
                       :remove-properties [:logseq.property/deadline]}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               add-command/resolve-tags (fn [_ _ tags]
                                                          (p/resolved (cond (= tags [:tag/next]) [{:db/id 303}]
                                                                            (= tags [:tag/old]) [{:db/id 202}]
                                                                            :else nil)))
                               add-command/resolve-properties (fn [_ _ properties & _] (p/resolved properties))
                               add-command/resolve-property-identifiers (fn [_ _ properties & _] (p/resolved properties))
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (cond
                                                                         (= lookup [:block/name "home"])
                                                                         {:db/id 50 :block/uuid (uuid "00000000-0000-0000-0000-000000000050")}
                                                                         (and (vector? lookup) (= :db/ident (first lookup)))
                                                                         {:db/id 888}
                                                                         :else {}))
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (reset! ops* ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})
                         ops @ops*]
                   (is (= :ok (:status result)))
                   (is (= [50] (get-in result [:data :result])))
                   (is (= 4 (count ops)))
                   (is (some #(= [:batch-delete-property-value [[50] :block/tags 202]] %) ops))
                   (is (some #(= [:batch-remove-property [[50] :logseq.property/deadline]] %) ops))
                   (is (some #(= [:batch-set-property [[50] :block/tags 303 {}]] %) ops))
                   (is (some #(= [:batch-set-property [[50] :logseq.property/publishing-public? true {}]] %) ops))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-upsert-page-errors-when-property-does-not-exist
  (async done
         (let [action {:type :upsert-page :repo "demo" :page "Home"
                       :update-properties {:logseq.property/deadline "2026-01-25T12:00:00Z"}}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               add-command/resolve-tags (fn [_ _ _] (p/resolved nil))
                               add-command/resolve-properties (fn [_ _ properties & _] (p/resolved properties))
                               add-command/resolve-property-identifiers (fn [_ _ properties & _] (p/resolved properties))
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (cond
                                                                         (= lookup [:block/name "home"]) {:db/id 50}
                                                                         (and (vector? lookup) (= :db/ident (first lookup))) {}
                                                                         :else {}))
                                                    :thread-api/apply-outliner-ops
                                                    (throw (ex-info "should not apply ops when property lookup fails" {:args args}))
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :error (:status result)))
                   (is (= :property-not-found (get-in result [:error :code])))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-remove-tag-property
  (async done
         (let [ops* (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (case method
                                                    :thread-api/cli-list-tags [{:db/id 1 :block/title "Quote"}]
                                                    :thread-api/cli-list-properties [{:db/id 2 :block/title "owner"}]
                                                    :thread-api/pull (let [[_ selector lookup] args]
                                                                       (cond
                                                                         (= lookup 1) {:db/id 1 :block/title "Quote" :block/uuid (uuid "00000000-0000-0000-0000-000000000011") :block/tags [{:db/ident :logseq.class/Tag}] :logseq.property/public? true}
                                                                         (= lookup 2) {:db/id 2 :db/ident :user.property/owner :block/title "owner" :block/uuid (uuid "00000000-0000-0000-0000-000000000022") :logseq.property/type :node :logseq.property/public? true}
                                                                         (= lookup [:block/name "quote"]) {:db/id 1 :block/title "Quote" :block/uuid (uuid "00000000-0000-0000-0000-000000000011") :block/tags [{:db/ident :logseq.class/Tag}] :logseq.property/public? true}
                                                                         (= lookup [:block/name "owner"]) {:db/id 2 :db/ident :user.property/owner :block/title "owner" :block/uuid (uuid "00000000-0000-0000-0000-000000000022") :logseq.property/type :node :logseq.property/public? true}
                                                                         :else (throw (ex-info "unexpected pull lookup" {:lookup lookup :selector selector}))))
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (swap! ops* conj ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [tag-result (commands/execute {:type :remove-tag :repo "demo" :name "Quote"} {})
                         property-result (commands/execute {:type :remove-property :repo "demo" :id 2} {})]
                   (is (= :ok (:status tag-result)))
                   (is (= :ok (:status property-result)))
                   (is (= [[:delete-page [(uuid "00000000-0000-0000-0000-000000000011")]]]
                          (first @ops*)))
                   (is (= [[:delete-page [(uuid "00000000-0000-0000-0000-000000000022")]]]
                          (second @ops*)))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-remove-tag-ambiguous-name
  (async done
         (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                             cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                             transport/invoke (fn [_ method _ _]
                                                (case method
                                                  :thread-api/cli-list-tags [{:db/id 1 :block/title "Quote"}
                                                                             {:db/id 2 :block/title "QUOTE"}]
                                                  (throw (ex-info "unexpected invoke" {:method method}))))]
               (p/let [result (commands/execute {:type :remove-tag :repo "demo" :name "Quote"} {})]
                 (is (= :error (:status result)))
                 (is (= :ambiguous-tag-name (get-in result [:error :code])))
                 (is (= 2 (count (get-in result [:error :candidates]))))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-update-builds-batch-ops
  (async done
         (let [ops* (atom nil)
               calls* (atom [])
               action {:type :upsert-block :mode :update :repo "demo" :id 1 :target-id 2 :pos "last-child"
                       :content "Updated heading"
                       :update-tags [:tag/new]
                       :remove-tags [:tag/old]
                       :update-properties {:logseq.property/deadline "2026-01-25T12:00:00Z"
                                           :logseq.property/status :logseq.property/status.done}
                       :remove-properties [:logseq.property/publishing-public?]}]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               add-command/resolve-tags (fn [_ _ tags]
                                                          (p/resolved (cond (= tags [:tag/new]) [{:db/id 101}]
                                                                            (= tags [:tag/old]) [{:db/id 202}]
                                                                            :else nil)))
                               add-command/resolve-properties (fn [_ _ properties & _] (p/resolved properties))
                               add-command/resolve-property-identifiers (fn [_ _ properties & _] (p/resolved properties))
                               transport/invoke (fn [_ method _ args]
                                                  (swap! calls* conj {:method method :args args})
                                                  (case method
                                                    :thread-api/pull (let [[_ _ lookup] args]
                                                                       (cond
                                                                         (= lookup 1) {:db/id 1 :block/name nil :block/uuid (uuid "00000000-0000-0000-0000-000000000001")}
                                                                         (= lookup 2) {:db/id 2 :block/name nil :block/uuid (uuid "00000000-0000-0000-0000-000000000002")}
                                                                         :else {}))
                                                    :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                                     (reset! ops* ops)
                                                                                     {:result :ok})
                                                    (throw (ex-info "unexpected invoke" {:method method :calls @calls*}))))]
                 (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [[:save-block [{:db/id 1 :block/title "Updated heading"} {}]]
                           [:move-blocks [[1] 2 {:sibling? false :bottom? true}]]
                           [:batch-delete-property-value [[1] :block/tags 202]]
                           [:batch-remove-property [[1] :logseq.property/publishing-public?]]
                           [:batch-set-property [[1] :block/tags 101 {}]]
                           [:batch-set-property [[1] :logseq.property/deadline "2026-01-25T12:00:00Z" {}]]
                           [:batch-set-property [[1] :logseq.property/status :logseq.property/status.done {}]]]
                          @ops*))))
               (p/catch (fn [e] (is false (str "unexpected error: " e " calls: " @calls*))))
               (p/finally done)))))

(deftest test-execute-requires-existing-graph
  (async done
         (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                             cli-server/ensure-server! (fn [_ _]
                                                         (throw (ex-info "should not start server" {})))]
               (p/let [result (commands/execute {:type :list-page :repo "logseq_db_missing"} {})]
                 (is (= :error (:status result)))
                 (is (= :graph-not-exists (get-in result [:error :code])))
                 (is (= "graph not exists" (get-in result [:error :message])))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-graph-import-rejects-existing-graph
  (async done
         (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                             cli-server/ensure-server! (fn [_ _]
                                                         (throw (ex-info "should not start server" {})))]
               (p/let [result (commands/execute {:type :graph-import :repo "logseq_db_demo" :allow-missing-graph true} {})]
                 (is (= :error (:status result)))
                 (is (= :graph-exists (get-in result [:error :code])))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-download-rejects-existing-graph
  (async done
         (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                             cli-server/ensure-server! (fn [_ _]
                                                         (throw (ex-info "should not start server" {})))]
               (p/let [result (commands/execute {:type :sync-download
                                                 :repo "logseq_db_demo"
                                                 :graph "demo"
                                                 :allow-missing-graph true
                                                 :require-missing-graph true}
                                                {})]
                 (is (= :error (:status result)))
                 (is (= :graph-exists (get-in result [:error :code])))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-sync-download-runs-command-when-graph-is-missing
  (async done
         (let [captured (atom nil)]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                               sync-command/execute (fn [action config]
                                                      (reset! captured [action config])
                                                      (p/resolved {:status :ok
                                                                   :data {:repo (:repo action)}}))]
                 (p/let [result (commands/execute {:type :sync-download
                                                   :repo "logseq_db_demo"
                                                   :graph "demo"
                                                   :allow-missing-graph true
                                                   :require-missing-graph true}
                                                  {:data-dir "/tmp"})]
                   (is (= :ok (:status result)))
                   (is (= "logseq_db_demo" (get-in result [:data :repo])))
                   (is (= :sync-download (get-in @captured [0 :type])))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-export
  (async done
         (let [invoke-calls (atom [])
               write-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] ["demo"])
                               cli-server/ensure-server! (fn [config _]
                                                           (assoc config :base-url "http://127.0.0.1:9999"))
                               transport/invoke (fn [_ method direct-pass? args]
                                                  (swap! invoke-calls conj [method direct-pass? args])
                                                  (if (= method :thread-api/export-db-base64)
                                                    "c3FsaXRl"
                                                    {:exported true}))
                               transport/write-output (fn [opts]
                                                        (swap! write-calls conj opts))]
                 (p/let [edn-result (commands/execute {:type :graph-export :repo "logseq_db_demo" :graph "demo" :export-type "edn" :file "/tmp/export.edn" :allow-missing-graph true} {})
                         sqlite-result (commands/execute {:type :graph-export :repo "logseq_db_demo" :graph "demo" :export-type "sqlite" :file "/tmp/export.sqlite" :allow-missing-graph true} {})]
                   (is (= :ok (:status edn-result)))
                   (is (= :ok (:status sqlite-result)))
                   (is (= "edn" (get-in edn-result [:context :export-type])))
                   (is (= "/tmp/export.edn" (get-in edn-result [:context :file])))
                   (is (= "sqlite" (get-in sqlite-result [:context :export-type])))
                   (is (= "/tmp/export.sqlite" (get-in sqlite-result [:context :file])))
                   (is (= [[:thread-api/export-edn false ["logseq_db_demo" {:export-type :graph}]]
                           [:thread-api/export-db-base64 true ["logseq_db_demo"]]]
                          @invoke-calls))
                   (is (= 2 (count @write-calls)))
                   (let [[edn-write sqlite-write] @write-calls]
                     (is (= {:format :edn :path "/tmp/export.edn" :data {:exported true}} edn-write))
                     (is (= :sqlite (:format sqlite-write)))
                     (is (= "/tmp/export.sqlite" (:path sqlite-write)))
                     (is (= "sqlite" (.toString (:data sqlite-write) "utf8"))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-import
  (async done
         (let [invoke-calls (atom [])
               read-calls (atom [])
               stop-calls (atom [])
               restart-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-graphs (fn [_] [])
                               cli-server/stop-server! (fn [_ repo] (swap! stop-calls conj repo) (p/resolved {:ok? true}))
                               cli-server/restart-server! (fn [_ repo] (swap! restart-calls conj repo) (p/resolved {:ok? true}))
                               cli-server/ensure-server! (fn [config _] (assoc config :base-url "http://127.0.0.1:9999"))
                               transport/read-input (fn [{:keys [format path]}]
                                                      (swap! read-calls conj [format path])
                                                      (if (= format :edn)
                                                        {:page "Import Page"}
                                                        (js/Buffer.from "sqlite" "utf8")))
                               transport/invoke (fn [_ method _ args]
                                                  (swap! invoke-calls conj [method args])
                                                  {:ok true})]
                 (p/let [edn-result (commands/execute {:type :graph-import :repo "logseq_db_demo" :graph "demo" :import-type "edn" :input "/tmp/import.edn" :allow-missing-graph true} {})
                         sqlite-result (commands/execute {:type :graph-import :repo "logseq_db_demo" :graph "demo" :import-type "sqlite" :input "/tmp/import.sqlite" :allow-missing-graph true} {})]
                   (is (= :ok (:status edn-result)))
                   (is (= :ok (:status sqlite-result)))
                   (is (= "edn" (get-in edn-result [:context :import-type])))
                   (is (= "/tmp/import.edn" (get-in edn-result [:context :input])))
                   (is (= "sqlite" (get-in sqlite-result [:context :import-type])))
                   (is (= "/tmp/import.sqlite" (get-in sqlite-result [:context :input])))
                   (is (= [[:edn "/tmp/import.edn"] [:sqlite "/tmp/import.sqlite"]] @read-calls))
                   (is (= [[:thread-api/import-edn ["logseq_db_demo" {:page "Import Page"}]]
                           [:thread-api/import-db-base64 ["logseq_db_demo" "c3FsaXRl"]]]
                          @invoke-calls))
                   (is (= ["logseq_db_demo" "logseq_db_demo"] @stop-calls))
                   (is (= ["logseq_db_demo" "logseq_db_demo"] @restart-calls))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-list-strips-db-prefix
  (async done
         (-> (p/with-redefs [cli-server/list-graph-items (fn [_] [{:kind :canonical
                                                                   :graph-name "logseq_db_demo"
                                                                   :graph-dir "logseq_db_demo"}
                                                                  {:kind :canonical
                                                                   :graph-name "logseq_db_logseq_db_other"
                                                                   :graph-dir "logseq_db_logseq_db_other"}
                                                                  {:kind :canonical
                                                                   :graph-name "my_logseq_db_notes"
                                                                   :graph-dir "my_logseq_db_notes"}])]
               (p/let [result (commands/execute {:type :graph-list} {})]
                 (is (= :ok (:status result)))
                 (is (= ["demo" "logseq_db_other" "my_logseq_db_notes"]
                        (get-in result [:data :graphs])))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-graph-list-includes-legacy-metadata
  (async done
         (-> (p/with-redefs [cli-server/list-graph-items (fn [_]
                                                           [{:kind :canonical
                                                             :graph-name "alpha"
                                                             :graph-dir "alpha"}
                                                            {:kind :legacy
                                                             :legacy-dir "legacy++name"
                                                             :legacy-graph-name "legacy/name"
                                                             :target-graph-dir "legacy~2Fname"
                                                             :conflict? false}
                                                            {:kind :legacy-undecodable
                                                             :legacy-dir "mystery"
                                                             :reason :undecodable}])]
               (p/let [result (commands/execute {:type :graph-list} {:data-dir "/tmp/graphs"})]
                 (is (= :ok (:status result)))
                 (is (= ["alpha" "legacy/name" "mystery"]
                        (get-in result [:data :graphs])))
                 (is (= [{:kind :canonical
                          :graph-name "alpha"
                          :graph-dir "alpha"}
                         {:kind :legacy
                          :legacy-dir "legacy++name"
                          :legacy-graph-name "legacy/name"
                          :target-graph-dir "legacy~2Fname"
                          :conflict? false}
                         {:kind :legacy-undecodable
                          :legacy-dir "mystery"
                          :reason :undecodable}]
                        (get-in result [:data :graph-items])))
                 (is (= 2 (get-in result [:human :graph-list :legacy-count])))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))
