(ns logseq.cli.commands-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.show :as show-command]
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
      (is (string/includes? plain-summary "list"))
      (is (string/includes? plain-summary "add"))
      (is (string/includes? plain-summary "remove"))
      (is (string/includes? plain-summary "update"))
      (is (string/includes? plain-summary "query"))
      (is (string/includes? plain-summary "show"))
      (is (string/includes? plain-summary "graph"))
      (is (string/includes? plain-summary "server"))
      (is (contains-bold? summary "list page"))
      (is (contains-bold? summary "list tag"))
      (is (contains-bold? summary "list property"))
      (is (contains-bold? summary "add block"))
      (is (contains-bold? summary "add page"))
      (is (contains-bold? summary "remove"))
      (is (contains-bold? summary "update"))
      (is (contains-bold? summary "query"))
      (is (contains-bold? summary "query list"))
      (is (contains-bold? summary "show"))
      (is (contains-bold? summary "graph list"))
      (is (contains-bold? summary "graph create"))
      (is (contains-bold? summary "server list"))
      (is (contains-bold? summary "server start"))
      (is (contains-bold? summary "--help"))
      (is (contains-bold? summary "--repo"))
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

(deftest test-parse-args-help
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

  (testing "add group shows subcommands"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["add"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "add block"))
      (is (string/includes? plain-summary "add page"))
      (is (contains-bold? summary "add block"))
      (is (contains-bold? summary "add page"))))

  (testing "remove command shows help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["remove" "--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq remove"))
      (is (string/includes? plain-summary "Command options:"))
      (is (contains-bold? summary "--id"))
      (is (contains-bold? summary "--uuid"))
      (is (contains-bold? summary "--page"))))

  (testing "update command shows help"
    (let [result (binding [style/*color-enabled?* true]
                   (commands/parse-args ["update" "--help"]))
          summary (:summary result)
          plain-summary (strip-ansi summary)]
      (is (true? (:help? result)))
      (is (string/includes? plain-summary "Usage: logseq update"))
      (is (string/includes? plain-summary "Command options:"))
      (is (contains-bold? summary "--id"))
      (is (contains-bold? summary "--uuid"))
      (is (contains-bold? summary "--target-id"))
      (is (contains-bold? summary "--target-uuid"))
      (is (contains-bold? summary "--update-tags"))
      (is (contains-bold? summary "--update-properties"))
      (is (contains-bold? summary "--remove-tags"))
      (is (contains-bold? summary "--remove-properties"))))

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

  (testing "errors on missing command"
    (let [result (commands/parse-args [])]
      (is (false? (:ok? result)))
      (is (= :missing-command (get-in result [:error :code])))))

  (testing "errors on unknown command"
    (let [result (commands/parse-args ["wat"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code]))))))

(deftest test-parse-args-rejects-legacy-remove-subcommands
  (testing "rejects legacy remove subcommands"
    (doseq [args [["remove" "block"]
                  ["remove" "page"]]]
      (let [result (commands/parse-args args)]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code])))))))

(deftest test-parse-args-rejects-graph-option
  (testing "rejects legacy --graph option"
    (let [result (commands/parse-args ["--graph" "demo" "graph" "list"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (= "unknown option: --graph"
             (strip-ansi (get-in result [:error :message])))))))

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

(deftest test-help-tags-properties-identifiers
  (testing "add help mentions tag and property identifiers"
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["add" "block" "--help"])))]
      (is (string/includes? (strip-ansi summary)
                            "Identifiers can be id, :db/ident, or :block/title.")))
    (let [summary (:summary (binding [style/*color-enabled?* true]
                              (commands/parse-args ["add" "page" "--help"])))]
      (is (string/includes? (strip-ansi summary)
                            "Identifiers can be id, :db/ident, or :block/title.")))))

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
         (let [selectors (atom [])
               orig-ensure-server! cli-server/ensure-server!
               orig-invoke transport/invoke]
           (set! cli-server/ensure-server! (fn [config _] config))
           (set! transport/invoke (fn [_ method _ args]
                                    (case method
                                      :thread-api/pull (let [[_ selector _] args]
                                                         (swap! selectors conj selector)
                                                         (p/resolved {:db/id 1
                                                                      :block/page {:db/id 2}}))
                                      :thread-api/q (let [[_ [query _]] args
                                                          pull-form (second query)
                                                          selector (nth pull-form 2)]
                                                      (swap! selectors conj selector)
                                                      (p/resolved []))
                                      :thread-api/get-block-refs (p/resolved [{:db/id 10}])
                                      (p/resolved nil))))
           (-> (p/let [_ (show-command/execute-show {:type :show
                                                     :repo "demo"
                                                     :id 1}
                                                    {:output-format :json})]
                 (is (some #(some #{:db/ident} %) @selectors))
                 (is (some #(and (some #{:db/ident} %)
                                 (some (fn [entry]
                                         (and (map? entry)
                                              (contains? entry :block/page)))
                                       %))
                           @selectors)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! cli-server/ensure-server! orig-ensure-server!)
                            (set! transport/invoke orig-invoke)
                            (done)))))))

(deftest test-show-linked-references-disabled
  (async done
         (let [method-calls (atom [])
               orig-ensure-server! cli-server/ensure-server!
               orig-invoke transport/invoke]
           (set! cli-server/ensure-server! (fn [config _] config))
           (set! transport/invoke (fn [_ method _ _]
                                    (swap! method-calls conj method)
                                    (case method
                                      :thread-api/pull (p/resolved {:db/id 1
                                                                    :block/page {:db/id 2}})
                                      :thread-api/q (p/resolved [])
                                      :thread-api/get-block-refs (p/resolved [{:db/id 10}])
                                      (p/resolved nil))))
           (-> (p/let [result (show-command/execute-show {:type :show
                                                          :repo "demo"
                                                          :id 1
                                                          :linked-references? false}
                                                         {:output-format :json})]
                 (is (= :ok (:status result)))
                 (is (not (contains? (:data result) :linked-references)))
                 (is (not (some #{:thread-api/get-block-refs} @method-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! cli-server/ensure-server! orig-ensure-server!)
                            (set! transport/invoke orig-invoke)
                            (done)))))))

(deftest test-show-linked-references-enabled
  (async done
         (let [method-calls (atom [])
               orig-ensure-server! cli-server/ensure-server!
               orig-invoke transport/invoke]
           (set! cli-server/ensure-server! (fn [config _] config))
           (set! transport/invoke (fn [_ method _ _]
                                    (swap! method-calls conj method)
                                    (case method
                                      :thread-api/pull (p/resolved {:db/id 1
                                                                    :block/page {:db/id 2}})
                                      :thread-api/q (p/resolved [])
                                      :thread-api/get-block-refs (p/resolved [{:db/id 10}])
                                      (p/resolved nil))))
           (-> (p/let [result (show-command/execute-show {:type :show
                                                          :repo "demo"
                                                          :id 1
                                                          :linked-references? true}
                                                         {:output-format :json})]
                 (is (= :ok (:status result)))
                 (is (contains? (:data result) :linked-references))
                 (is (some #{:thread-api/get-block-refs} @method-calls)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! cli-server/ensure-server! orig-ensure-server!)
                            (set! transport/invoke orig-invoke)
                            (done)))))))

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

(deftest test-verb-subcommand-parse-add-remove
  (testing "remove requires target"
    (let [result (commands/parse-args ["remove"])]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "remove parses with id"
    (let [result (commands/parse-args ["remove" "--id" "10"])]
      (is (true? (:ok? result)))
      (is (= :remove (:command result)))
      (is (= 10 (get-in result [:options :id])))))

  (testing "remove parses with uuid"
    (let [result (commands/parse-args ["remove" "--uuid" "abc"])]
      (is (true? (:ok? result)))
      (is (= :remove (:command result)))
      (is (= "abc" (get-in result [:options :uuid])))))

  (testing "remove parses with page"
    (let [result (commands/parse-args ["remove" "--page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :remove (:command result)))
      (is (= "Home" (get-in result [:options :page])))))

  (testing "remove rejects multiple selectors"
    (let [result (commands/parse-args ["remove" "--id" "1" "--page" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "remove rejects empty id vector"
    (let [result (commands/parse-args ["remove" "--id" "[]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "remove rejects invalid id vector"
    (let [result (commands/parse-args ["remove" "--id" "[1 \"no\"]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update requires source selector"
    (let [result (commands/parse-args ["update" "--target-id" "10"])]
      (is (false? (:ok? result)))
      (is (= :missing-source (get-in result [:error :code])))))

  (testing "update requires target or update/remove options"
    (let [result (commands/parse-args ["update" "--id" "1"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update parses with source and target"
    (let [result (commands/parse-args ["update" "--uuid" "abc" "--target-uuid" "def" "--pos" "last-child"])]
      (is (true? (:ok? result)))
      (is (= :update-block (:command result)))
      (is (= "abc" (get-in result [:options :uuid])))
      (is (= "def" (get-in result [:options :target-uuid])))
      (is (= "last-child" (get-in result [:options :pos])))))

  (testing "update parses with tags and properties"
    (let [result (commands/parse-args ["update" "--id" "1"
                                       "--update-tags" "[\"TagA\"]"
                                       "--update-properties" "{:logseq.property/publishing-public? true}"])]
      (is (true? (:ok? result)))
      (is (= :update-block (:command result)))
      (is (= "[\"TagA\"]" (get-in result [:options :update-tags])))
      (is (= "{:logseq.property/publishing-public? true}" (get-in result [:options :update-properties])))))

  (testing "update allows update without move target"
    (let [result (commands/parse-args ["update" "--uuid" "abc"
                                       "--update-tags" "[\"TagA\"]"])]
      (is (true? (:ok? result)))
      (is (= :update-block (:command result)))
      (is (= "abc" (get-in result [:options :uuid]))))))

(deftest test-verb-subcommand-parse-add
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

  (testing "add block parses with tags and properties"
    (let [result (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--tags" "[\"TagA\" \"TagB\"]"
                                       "--properties" "{:logseq.property/publishing-public? true}"])]
      (is (true? (:ok? result)))
      (is (= :add-block (:command result)))
      (is (= "[\"TagA\" \"TagB\"]" (get-in result [:options :tags])))
      (is (= "{:logseq.property/publishing-public? true}" (get-in result [:options :properties])))))

  (testing "add block rejects invalid pos"
    (let [result (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--pos" "middle"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "add block rejects tags with blocks payload"
    (let [result (commands/parse-args ["add" "block"
                                       "--blocks" "[]"
                                       "--tags" "[\"TagA\"]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "add block rejects properties with blocks-file payload"
    (let [result (commands/parse-args ["add" "block"
                                       "--blocks-file" "/tmp/blocks.edn"
                                       "--properties" "{:logseq.property/publishing-public? true}"])]
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

  (testing "add page parses with tags and properties"
    (let [result (commands/parse-args ["add" "page"
                                       "--page" "Home"
                                       "--tags" "[\"TagA\"]"
                                       "--properties" "{:logseq.property/publishing-public? true}"])]
      (is (true? (:ok? result)))
      (is (= :add-page (:command result)))
      (is (= "[\"TagA\"]" (get-in result [:options :tags])))
      (is (= "{:logseq.property/publishing-public? true}" (get-in result [:options :properties]))))))

(deftest test-verb-subcommand-parse-update-target-page
  (testing "update parses with target page"
    (let [result (commands/parse-args ["update" "--id" "1" "--target-page" "Home"])]
      (is (true? (:ok? result)))
      (is (= :update-block (:command result)))
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
  (testing "graph create requires --repo even with positional args"
    (let [result (commands/parse-args ["graph" "create" "demo"])]
      (is (false? (:ok? result)))
      (is (= :missing-graph (get-in result [:error :code])))))

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
                  ["remove" "--wat"]
                  ["update" "--wat"]
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

  (testing "remove requires target"
    (let [parsed {:ok? true :command :remove :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "remove normalizes id vector in build action"
    (let [parsed {:ok? true :command :remove :options {:id "[1 2]"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :remove (get-in result [:action :type])))
      (is (= [1 2] (get-in result [:action :ids])))))

  (testing "show requires target"
    (let [parsed {:ok? true :command :show :options {}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "show normalizes id vector in build action"
    (let [parsed {:ok? true :command :show :options {:id "[1 2]"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :show (get-in result [:action :type])))
      (is (= [1 2] (get-in result [:action :ids]))))))

(deftest test-build-action-add-validates-properties
  (testing "add block rejects unknown property"
    (let [parsed (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--properties" "{:not/a 1}"])
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "add block accepts property title key"
    (let [parsed (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--properties" "{\"Publishing Public?\" true}"])
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :logseq.property/publishing-public?
             (-> result :action :properties keys first)))))

  (testing "add block rejects non-public built-in property"
    (let [parsed (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--properties" "{:logseq.property/heading 1}"])
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "add block rejects invalid checkbox value"
    (let [parsed (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--properties" "{:logseq.property/publishing-public? \"nope\"}"])
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-build-action-add-accepts-tag-ids
  (testing "add block accepts numeric tag ids"
    (let [parsed (commands/parse-args ["add" "block"
                                       "--content" "hello"
                                       "--tags" "[42]"])
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= [42] (get-in result [:action :tags]))))))

(deftest test-tag-lookup-ref-accepts-id
  (let [tag-lookup-ref #'add-command/tag-lookup-ref]
    (is (= 42 (tag-lookup-ref 42)))))

(deftest test-normalize-property-key-input-accepts-id
  (let [normalize-property-key-input #'add-command/normalize-property-key-input]
    (is (= {:type :id :value 42} (normalize-property-key-input 42)))))

(deftest test-build-action-update
  (testing "update requires source selector"
    (let [parsed {:ok? true :command :update-block :options {:target-id 2}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :missing-source (get-in result [:error :code])))))

  (testing "update requires target or update/remove options"
    (let [parsed {:ok? true :command :update-block :options {:id 1}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update accepts update tags without target"
    (let [parsed {:ok? true
                  :command :update-block
                  :options {:id 1 :update-tags "[\"TagA\"]"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (true? (:ok? result)))
      (is (= :update-block (get-in result [:action :type])))
      (is (= ["TagA"] (get-in result [:action :update-tags])))))

  (testing "update rejects invalid update tags"
    (let [parsed {:ok? true
                  :command :update-block
                  :options {:id 1 :update-tags "{:tag \"no\"}"}}
          result (commands/build-action parsed {:repo "demo"})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-update-parse-validation
  (testing "update rejects multiple source selectors"
    (let [result (commands/parse-args ["update" "--id" "1" "--uuid" "abc" "--target-id" "2"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects multiple target selectors"
    (let [result (commands/parse-args ["update" "--id" "1" "--target-id" "2" "--target-uuid" "def"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects invalid position"
    (let [result (commands/parse-args ["update" "--id" "1" "--target-id" "2" "--pos" "middle"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects sibling pos for page target"
    (let [result (commands/parse-args ["update" "--id" "1" "--target-page" "Home" "--pos" "sibling"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects legacy target-page-name option"
    (let [result (commands/parse-args ["update" "--id" "1" "--target-page-name" "Home"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "update rejects pos without target"
    (let [result (commands/parse-args ["update" "--id" "1" "--pos" "last-child" "--update-tags" "[\"TagA\"]"])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code]))))))

(deftest test-execute-update-builds-batch-ops
  (async done
         (let [ops* (atom nil)
               calls* (atom [])
               action {:type :update-block
                       :repo "demo"
                       :id 1
                       :target-id 2
                       :pos "last-child"
                       :update-tags [:tag/new]
                       :remove-tags [:tag/old]
                       :update-properties {:logseq.property/deadline "2026-01-25T12:00:00Z"}
                       :remove-properties [:logseq.property/publishing-public?]}]
           (with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                         add-command/resolve-tags (fn [_ _ tags]
                                                    (p/resolved (cond
                                                                  (= tags [:tag/new]) [{:db/id 101}]
                                                                  (= tags [:tag/old]) [{:db/id 202}]
                                                                  :else nil)))
                         add-command/resolve-properties (fn [_ _ properties] (p/resolved properties))
                         add-command/resolve-property-identifiers (fn [_ _ properties] (p/resolved properties))
                         transport/invoke (fn [_ method _ args]
                                            (swap! calls* conj {:method method :args args})
                                            (case method
                                              :thread-api/pull (let [[_ _ lookup] args]
                                                                 (cond
                                                                   (= lookup 1)
                                                                   {:db/id 1
                                                                    :block/name nil
                                                                    :block/uuid (uuid "00000000-0000-0000-0000-000000000001")}
                                                                   (= lookup 2)
                                                                   {:db/id 2
                                                                    :block/name nil
                                                                    :block/uuid (uuid "00000000-0000-0000-0000-000000000002")}
                                                                   :else {}))
                                              :thread-api/apply-outliner-ops (let [[_ ops _] args]
                                                                               (reset! ops* ops)
                                                                               {:result :ok})
                                              (throw (ex-info "unexpected invoke" {:method method :calls @calls*}))))]
             (-> (p/let [result (commands/execute action {})]
                   (is (= :ok (:status result)))
                   (is (= [[:move-blocks [[1] 2 {:sibling? false :bottom? true}]]
                           [:batch-delete-property-value [[1] :block/tags 202]]
                           [:batch-remove-property [[1] :logseq.property/publishing-public?]]
                           [:batch-set-property [[1] :block/tags 101 {}]]
                           [:batch-set-property [[1] :logseq.property/deadline "2026-01-25T12:00:00Z" {}]]]
                          @ops*))
                   (done))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e " calls: " @calls*))
                            (done))))))))

(deftest test-execute-requires-existing-graph
  (async done
         (with-redefs [cli-server/list-graphs (fn [_] [])
                       cli-server/ensure-server! (fn [_ _]
                                                   (throw (ex-info "should not start server" {})))]
           (-> (p/let [result (commands/execute {:type :list-page
                                                 :repo "logseq_db_missing"}
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

(deftest test-execute-graph-list-strips-db-prefix
  (async done
         (let [orig-list-graphs cli-server/list-graphs]
           (set! cli-server/list-graphs (fn [_] ["logseq_db_demo" "logseq_db_other"]))
           (-> (p/let [result (commands/execute {:type :graph-list} {})]
                 (is (= :ok (:status result)))
                 (is (= ["demo" "other"] (get-in result [:data :graphs]))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! cli-server/list-graphs orig-list-graphs)
                            (done)))))))
