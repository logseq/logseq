(ns logseq.cli.completion-generator-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.completion :as completion-command]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.debug :as debug-command]
            [logseq.cli.command.doctor :as doctor-command]
            [logseq.cli.command.example :as example-command]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.command.query :as query-command]
            [logseq.cli.command.remove :as remove-command]
            [logseq.cli.command.search :as search-command]
            [logseq.cli.command.server :as server-command]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.command.upsert :as upsert-command]
            [logseq.cli.completion-generator :as gen]))

(def ^:private base-table
  (vec (concat graph-command/entries
               server-command/entries
               list-command/entries
               upsert-command/entries
               remove-command/entries
               query-command/entries
               search-command/entries
               show-command/entries
               doctor-command/entries
               debug-command/entries
               completion-command/entries)))

(def ^:private full-table
  (vec (concat base-table
               (example-command/build-example-entries base-table))))

;; ---------------------------------------------------------------------------
;; Phase 1 — Spec enrichment tests
;; ---------------------------------------------------------------------------

(deftest test-global-spec-metadata
  (let [spec (core/global-spec)]
    (testing ":output has :validate set"
      (is (= #{"human" "json" "edn"} (get-in spec [:output :validate]))))
    (testing ":graph has :complete :graphs"
      (is (= :graphs (get-in spec [:graph :complete]))))
    (testing ":config has :complete :file"
      (is (= :file (get-in spec [:config :complete]))))
    (testing ":data-dir has :complete :dir"
      (is (= :dir (get-in spec [:data-dir :complete]))))
    (testing ":profile is a global boolean flag"
      (is (= :boolean (get-in spec [:profile :coerce]))))))

(deftest test-list-spec-metadata
  (let [entries list-command/entries
        page-entry (first (filter #(= :list-page (:command %)) entries))
        tag-entry (first (filter #(= :list-tag (:command %)) entries))
        property-entry (first (filter #(= :list-property (:command %)) entries))
        task-entry (first (filter #(= :list-task (:command %)) entries))]
    (testing "page-spec :sort has some correct values"
      (is (contains? (get-in page-entry [:spec :sort :validate]) "title")))
    (testing "tag-spec :sort has some correct values"
      (is (contains? (get-in tag-entry [:spec :sort :validate]) "title")))
    (testing "property-spec :sort has some correct values"
      (is (contains? (get-in property-entry [:spec :sort :validate]) "title")))
    (testing "common :order has correct values"
      (is (= #{"asc" "desc"}
             (get-in page-entry [:spec :order :validate]))))
    (testing "tag-spec :fields has :multiple-values"
      (let [mv (get-in tag-entry [:spec :fields :multiple-values])]
        (is (seq mv))
        (is (some #{"title"} mv))
        (is (some #{"uuid"} mv))))
    (testing "list task :content has -c alias"
      (is (= :c (get-in task-entry [:spec :content :alias]))))))

(deftest test-upsert-spec-metadata
  (let [entries upsert-command/entries
        block-entry (first (filter #(= :upsert-block (:command %)) entries))
        page-entry (first (filter #(= :upsert-page (:command %)) entries))
        task-entry (first (filter #(= :upsert-task (:command %)) entries))
        tag-entry (first (filter #(= :upsert-tag (:command %)) entries))
        property-entry (first (filter #(= :upsert-property (:command %)) entries))]
    (testing "block-spec :pos has :validate set"
      (is (= #{"first-child" "last-child" "sibling"}
             (get-in block-entry [:spec :pos :validate]))))
    (testing "block-spec does not expose :status option"
      (is (nil? (get-in block-entry [:spec :status]))))
    (testing "block-spec :target-page has :complete :pages"
      (is (= :pages (get-in block-entry [:spec :target-page :complete]))))
    (testing "block-spec :blocks-file has :complete :file"
      (is (= :file (get-in block-entry [:spec :blocks-file :complete]))))
    (testing "page-spec :page has :complete :pages"
      (is (= :pages (get-in page-entry [:spec :page :complete]))))
    (testing "task-spec contains paired task set/clear options"
      (is (contains? (:spec task-entry) :status))
      (is (contains? (:spec task-entry) :priority))
      (is (contains? (:spec task-entry) :scheduled))
      (is (contains? (:spec task-entry) :deadline))
      (is (contains? (:spec task-entry) :no-status))
      (is (contains? (:spec task-entry) :no-priority))
      (is (contains? (:spec task-entry) :no-scheduled))
      (is (contains? (:spec task-entry) :no-deadline))
      (is (not (contains? (:spec task-entry) :update-tags)))
      (is (not (contains? (:spec task-entry) :update-properties)))
      (is (not (contains? (:spec task-entry) :remove-tags)))
      (is (not (contains? (:spec task-entry) :remove-properties))))
    (testing "tag-spec :name has :complete :tags"
      (is (= :tags (get-in tag-entry [:spec :name :complete]))))
    (testing "property-spec :name has :complete :properties"
      (is (= :properties (get-in property-entry [:spec :name :complete]))))
    (testing "property-spec :type has :validate set"
      (let [types (get-in property-entry [:spec :type :validate])]
        (is (set? types))
        (is (contains? types "default"))
        (is (contains? types "node"))
        (is (contains? types "checkbox"))))
    (testing "property-spec :cardinality has :validate set"
      (is (= #{"one" "many"}
             (get-in property-entry [:spec :cardinality :validate]))))))

(deftest test-graph-spec-metadata
  (let [entries graph-command/entries
        export-entry (first (filter #(= :graph-export (:command %)) entries))
        import-entry (first (filter #(= :graph-import (:command %)) entries))
        backup-create-entry (first (filter #(= :graph-backup-create (:command %)) entries))
        backup-restore-entry (first (filter #(= :graph-backup-restore (:command %)) entries))
        backup-remove-entry (first (filter #(= :graph-backup-remove (:command %)) entries))]
    (testing "export-spec :type has :validate set"
      (is (= #{"edn" "sqlite"} (get-in export-entry [:spec :type :validate]))))
    (testing "export-spec :file has :complete :file"
      (is (= :file (get-in export-entry [:spec :file :complete]))))
    (testing "import-spec :type has :validate set"
      (is (= #{"edn" "sqlite"} (get-in import-entry [:spec :type :validate]))))
    (testing "import-spec :input has :complete :file"
      (is (= :file (get-in import-entry [:spec :input :complete]))))
    (testing "backup create has optional --name option"
      (is (contains? (:spec backup-create-entry) :name)))
    (testing "backup restore has --src and --dst options"
      (is (contains? (:spec backup-restore-entry) :src))
      (is (contains? (:spec backup-restore-entry) :dst)))
    (testing "backup remove has --src option"
      (is (contains? (:spec backup-remove-entry) :src)))))

(deftest test-query-spec-metadata
  (let [entries query-command/entries
        query-entry (first (filter #(= :query (:command %)) entries))]
    (testing "query-spec :name has :complete :queries"
      (is (= :queries (get-in query-entry [:spec :name :complete]))))))

(deftest test-show-spec-metadata
  (let [entries show-command/entries
        show-entry (first (filter #(= :show (:command %)) entries))]
    (testing "show-spec :page has :complete :pages"
      (is (= :pages (get-in show-entry [:spec :page :complete]))))))

(deftest test-remove-spec-metadata
  (let [entries remove-command/entries
        page-entry (first (filter #(= :remove-page (:command %)) entries))
        tag-entry (first (filter #(= :remove-tag (:command %)) entries))
        property-entry (first (filter #(= :remove-property (:command %)) entries))]
    (testing "remove-page :page has :complete :pages"
      (is (= :pages (get-in page-entry [:spec :page :complete]))))
    (testing "remove-tag :name has :complete :tags"
      (is (= :tags (get-in tag-entry [:spec :name :complete]))))
    (testing "remove-property :name has :complete :properties"
      (is (= :properties (get-in property-entry [:spec :name :complete]))))))

(deftest test-search-spec-metadata
  (let [entries search-command/entries]
    (doseq [command [:search-block :search-page :search-property :search-tag]]
      (let [entry (first (filter #(= command (:command %)) entries))]
        (testing (str (name command) " has :content option")
          (is (contains? (:spec entry) :content))
          (is (= :c (get-in entry [:spec :content :alias])))
          (is (= "Search content text" (get-in entry [:spec :content :desc]))))))))

;; ---------------------------------------------------------------------------
;; Phase 2 — Generator table introspection utilities
;; ---------------------------------------------------------------------------

(deftest test-extract-groups
  (let [groups (gen/extract-groups full-table)]
    (testing "graph export is in graph group"
      (let [graph-entries (get groups "graph")]
        (is (some #(= ["graph" "export"] (:cmds %)) graph-entries))))
    (testing "show is a standalone group"
      (let [show-entries (get groups "show")]
        (is (= 1 (count show-entries)))
        (is (= ["show"] (:cmds (first show-entries))))))
    (testing "completion is a standalone group"
      (let [completion-entries (get groups "completion")]
        (is (= 1 (count completion-entries)))
        (is (= ["completion"] (:cmds (first completion-entries))))))))

(deftest test-leaf-and-group-commands
  (let [leaves (gen/leaf-commands full-table)
        groups (gen/group-commands full-table)
        leaf-names (set (map #(first (:cmds %)) leaves))
        group-names (set groups)]
    (testing "show and doctor are leaves"
      (is (contains? leaf-names "show"))
      (is (contains? leaf-names "doctor")))
    (testing "graph, server, list, upsert, remove, search, debug, example are groups"
      (is (contains? group-names "graph"))
      (is (contains? group-names "server"))
      (is (contains? group-names "list"))
      (is (contains? group-names "upsert"))
      (is (contains? group-names "remove"))
      (is (contains? group-names "search"))
      (is (contains? group-names "debug"))
      (is (contains? group-names "example")))))

(deftest test-spec->token
  (testing "boolean spec → :flag type"
    (let [token (gen/spec->token [:help {:coerce :boolean :desc "Show help"}])]
      (is (= :flag (:type token)))))
  (testing "spec with :validate set → :enum type"
    (let [token (gen/spec->token [:output {:validate #{"human" "json" "edn"} :desc "Format"}])]
      (is (= :enum (:type token)))
      (is (= ["edn" "human" "json"] (:values token)))))
  (testing "spec with :complete :graphs → :dynamic type"
    (let [token (gen/spec->token [:graph {:complete :graphs :desc "Graph name"}])]
      (is (= :dynamic (:type token)))
      (is (= :graphs (:complete token)))))
  (testing "spec with :complete :file → :file type"
    (let [token (gen/spec->token [:config {:complete :file :desc "Config"}])]
      (is (= :file (:type token)))))
  (testing "spec with :complete :dir → :dir type"
    (let [token (gen/spec->token [:data-dir {:complete :dir :desc "Data dir"}])]
      (is (= :dir (:type token)))))
  (testing "spec with :alias → includes alias"
    (let [token (gen/spec->token [:help {:alias :h :coerce :boolean :desc "Help"}])]
      (is (= :h (:alias token)))))
  (testing "bare string spec → :free type"
    (let [token (gen/spec->token [:query {:desc "Query EDN"}])]
      (is (= :free (:type token)))))
  (testing "spec with :multiple-values → :multi type"
    (let [token (gen/spec->token [:fields {:desc "Fields" :multiple-values ["id" "title" "uuid"]}])]
      (is (= :multi (:type token)))
      (is (= ["id" "title" "uuid"] (:values token))))))

;; ---------------------------------------------------------------------------
;; Phase 3 — Zsh output
;; ---------------------------------------------------------------------------

(deftest test-generate-zsh-structure
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "output starts with #compdef logseq"
      (is (string/starts-with? output "#compdef logseq")))
    (testing "output contains dynamic helpers"
      (is (string/includes? output "_logseq_graphs"))
      (is (string/includes? output "_logseq_pages"))
      (is (string/includes? output "_logseq_queries"))
      (is (string/includes? output "_logseq_json_names"))
      (is (string/includes? output "_logseq_current_graph")))
    (testing "page completion reads namespaced block/title key"
      (is (string/includes? output "_logseq_json_names data items block/title")))
    (testing "output contains per-command functions"
      (is (string/includes? output "_logseq_graph_export()"))
      (is (string/includes? output "_logseq_graph_backup_restore()"))
      (is (string/includes? output "_logseq_graph_backup_remove()"))
      (is (string/includes? output "_logseq_debug_pull()"))
      (is (string/includes? output "_logseq_show()"))
      (is (string/includes? output "_logseq_example_upsert_page()")))
    (testing "output contains group dispatchers"
      (is (string/includes? output "_logseq_graph()"))
      (is (string/includes? output "_logseq_list()"))
      (is (string/includes? output "_logseq_search()"))
      (is (string/includes? output "_logseq_upsert()"))
      (is (string/includes? output "_logseq_debug()"))
      (is (string/includes? output "_logseq_example()")))
    (testing "output contains top-level dispatcher"
      (is (string/includes? output "_logseq()")))
    (testing "output ends with compdef _logseq logseq"
      (is (string/includes? output "compdef _logseq logseq")))
    (testing "boolean flags emit alias grouping"
      (is (string/includes? output "'{-v,--verbose}'[")))
    (testing "global profile flag is present in zsh completion"
      (is (string/includes? output "'--profile[")))
    (testing "global boolean flags do NOT emit --no- negation token"
      (is (not (string/includes? output "--no-verbose")))
      (is (not (string/includes? output "--no-help")))
      (is (not (string/includes? output "--no-profile"))))
    (testing "enum options emit separate long= and short+ specs"
      (is (string/includes? output "--output=[Output format. Default: human]:value:(edn human json)'"))
      (is (string/includes? output "-o[Output format. Default: human]:value:(edn human json)'")))
    (testing ":complete :graphs emits separate long= and short+ specs"
      (is (string/includes? output "--graph=[Graph name]:value:{_logseq_graphs}'"))
      (is (string/includes? output "-g[Graph name]:value:{_logseq_graphs}'")))
    (testing ":complete :file emits long spec for --config without short alias"
      (is (string/includes? output "--config=[Path to cli.edn (default ~/logseq/cli.edn)]:file:_files'"))
      (is (not (string/includes? output "-c[Path to cli.edn (default ~/logseq/cli.edn)]:file:_files'"))))
    (testing "-c is available as content alias in command-specific completion"
      (is (re-find #"(?s)_logseq_search_block\(\).*?-c\[Search content text\]" output))
      (is (re-find #"(?s)_logseq_upsert_block\(\).*?-c\[Block content" output))
      (is (re-find #"(?s)_logseq_list_task\(\).*?-c\[Filter by task title content\]" output)))
    (testing ":alias emits grouping without --no- for global flags"
      (is (re-find #"\(-h --help\)" output)))))

(deftest test-zsh-command-specific-values
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "--pos under upsert block offers correct values"
      (is (re-find #"--pos=.*\(first-child last-child sibling\)" output)))))

(deftest test-search-content-option-in-completions
  (let [zsh-output (gen/generate-completions "zsh" full-table)
        bash-output (gen/generate-completions "bash" full-table)]
    (testing "zsh completion includes --content under search subcommands"
      (is (re-find #"(?s)_logseq_search_block\(\).*--content" zsh-output))
      (is (re-find #"(?s)_logseq_search_page\(\).*--content" zsh-output))
      (is (re-find #"(?s)_logseq_search_property\(\).*--content" zsh-output))
      (is (re-find #"(?s)_logseq_search_tag\(\).*--content" zsh-output)))
    (testing "bash completion includes --content under search subcommands"
      (is (string/includes? bash-output "search)"))
      (is (string/includes? bash-output "--content -c")))))

(deftest test-zsh-no-prefix-for-command-booleans
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "--no-include-built-in is offered for list tag"
      (is (string/includes? output "--no-include-built-in")))
    (testing "--no-with-type is offered for list property"
      (is (string/includes? output "--no-with-type")))
    (testing "--no- tokens have Negate description"
      (is (string/includes? output "--no-include-built-in[Negate --include-built-in]")))
    (testing "--no- and positive form are mutually exclusive"
      (is (string/includes? output "(--include-built-in --no-include-built-in)")))
    (testing "explicit no-* options do not produce --no-no-* artifacts"
      (is (not (string/includes? output "--no-no-status")))
      (is (not (string/includes? output "--no-no-priority")))
      (is (not (string/includes? output "--no-no-scheduled")))
      (is (not (string/includes? output "--no-no-deadline"))))))

(deftest test-bash-no-prefix-for-command-booleans
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "--no-include-built-in appears in bash wordlist"
      (is (string/includes? output "--no-include-built-in")))
    (testing "--no-with-type appears in bash wordlist"
      (is (string/includes? output "--no-with-type")))
    (testing "explicit no-* options do not produce --no-no-* artifacts"
      (is (not (string/includes? output "--no-no-status")))
      (is (not (string/includes? output "--no-no-priority")))
      (is (not (string/includes? output "--no-no-scheduled")))
      (is (not (string/includes? output "--no-no-deadline"))))))

(deftest test-zsh-multi-value-completion
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "zsh preamble contains _logseq_multi_values helper"
      (is (string/includes? output "_logseq_multi_values()")))
    (testing "--fields under list tag uses {_logseq_multi_values ...} action"
      (is (re-find #"--fields=.*\{_logseq_multi_values " output)))
    (testing "multi-values include known tag field names"
      (is (string/includes? output "created-at"))
      (is (string/includes? output "title"))
      (is (string/includes? output "uuid")))))

(deftest test-bash-multi-value-completion
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "bash preamble contains _logseq_multi_values_bash helper"
      (is (string/includes? output "_logseq_multi_values_bash()")))
    (testing "--fields case calls _logseq_multi_values_bash for list tag context"
      (is (string/includes? output "_logseq_multi_values_bash \"$cur\" created-at")))))

(deftest test-zsh-all-commands-present
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "every command from the table appears"
      (doseq [entry full-table]
        (let [func-name (str "_logseq_" (string/join "_" (:cmds entry)))]
          (is (string/includes? output (str func-name "()"))))))))

;; ---------------------------------------------------------------------------
;; Phase 4 — Bash output
;; ---------------------------------------------------------------------------

(deftest test-generate-bash-structure
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "output contains dynamic helpers"
      (is (string/includes? output "_logseq_graphs_bash"))
      (is (string/includes? output "_logseq_pages_bash"))
      (is (string/includes? output "_logseq_queries_bash"))
      (is (string/includes? output "_logseq_compadd_lines"))
      (is (string/includes? output "_logseq_json_names_bash"))
      (is (string/includes? output "_logseq_current_graph_bash")))
    (testing "bash page completion reads namespaced block/title key"
      (is (string/includes? output "_logseq_json_names_bash data items block/title")))
    (testing "output contains _logseq_opts_for"
      (is (string/includes? output "_logseq_opts_for()")))
    (testing "output contains _logseq_is_value_opt"
      (is (string/includes? output "_logseq_is_value_opt()")))
    (testing "output ends with complete -F _logseq logseq"
      (is (string/includes? output "complete -F _logseq logseq")))
    (testing "graph export case includes --type and --file"
      (is (string/includes? output "--type"))
      (is (string/includes? output "--file")))
    (testing "graph backup options include --name, --src, and --dst"
      (is (string/includes? output "--name"))
      (is (string/includes? output "--src"))
      (is (string/includes? output "--dst")))
    (testing "boolean flags appear in wordlist"
      (is (string/includes? output "--verbose"))
      (is (string/includes? output "--profile")))
    (testing "global boolean flags do NOT have --no- variants in wordlist"
      (is (not (string/includes? output "--no-verbose")))
      (is (not (string/includes? output "--no-help")))
      (is (not (string/includes? output "--no-profile"))))
    (testing "enum values use compgen -W"
      (is (re-find #"compgen -W.*edn human json" output)))
    (testing ":complete :file uses compgen -f"
      (is (re-find #"compgen -f" output)))))

(deftest test-bash-all-commands-present
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "every top-level command appears in subcommand completion"
      (doseq [group-name (distinct (map #(first (:cmds %)) full-table))]
        (is (string/includes? output group-name)
            (str "missing command: " group-name))))))

;; ---------------------------------------------------------------------------
;; Phase 5 — Completion command entry
;; ---------------------------------------------------------------------------

(deftest test-completion-command-entry
  (let [entries completion-command/entries]
    (testing "contains one entry with :cmds [\"completion\"]"
      (is (= 1 (count entries)))
      (is (= ["completion"] (:cmds (first entries)))))
    (testing "command is :completion"
      (is (= :completion (:command (first entries)))))
    (testing "spec has :shell with :validate set"
      (is (= #{"zsh" "bash"}
             (get-in (first entries) [:spec :shell :validate]))))))

;; ---------------------------------------------------------------------------
;; Phase 6 — End-to-end validation
;; ---------------------------------------------------------------------------

(deftest test-e2e-zsh-structural-markers
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "key structural markers present"
      (is (string/includes? output "#compdef"))
      (is (string/includes? output "_logseq_graph_export"))
      (is (string/includes? output "_logseq_show"))
      (is (string/includes? output "compdef _logseq logseq")))))

(deftest test-e2e-bash-structural-markers
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "key structural markers present"
      (is (string/includes? output "complete -F _logseq logseq"))
      (is (string/includes? output "_logseq_opts_for")))))

(deftest test-e2e-sync-adding-command
  (testing "adding a command updates output"
    (let [base-output (gen/generate-completions "zsh" full-table)
          fake-entry (core/command-entry ["fake"] :fake "Fake command"
                                         {:foo {:desc "Foo option"}})
          extended-table (conj full-table fake-entry)
          new-output (gen/generate-completions "zsh" extended-table)]
      (is (not (string/includes? base-output "_logseq_fake()")))
      (is (string/includes? new-output "_logseq_fake()")))))

(deftest test-e2e-context-dependent-name
  (let [entries full-table]
    (testing "query spec has :name with :complete :queries"
      (let [query-entry (first (filter #(= :query (:command %)) entries))]
        (is (= :queries (get-in query-entry [:spec :name :complete])))))
    (testing "remove page spec has :page with :complete :pages"
      (let [rm-page (first (filter #(= :remove-page (:command %)) entries))]
        (is (= :pages (get-in rm-page [:spec :page :complete])))
        (is (nil? (get-in rm-page [:spec :name])))))
    (testing "upsert tag spec has :complete :tags on :name"
      (let [tag (first (filter #(= :upsert-tag (:command %)) entries))]
        (is (= :tags (get-in tag [:spec :name :complete])))))
    (testing "remove tag spec has :complete :tags on :name"
      (let [tag (first (filter #(= :remove-tag (:command %)) entries))]
        (is (= :tags (get-in tag [:spec :name :complete])))))
    (testing "upsert property spec has :complete :properties on :name"
      (let [prop (first (filter #(= :upsert-property (:command %)) entries))]
        (is (= :properties (get-in prop [:spec :name :complete])))))
    (testing "remove property spec has :complete :properties on :name"
      (let [prop (first (filter #(= :remove-property (:command %)) entries))]
        (is (= :properties (get-in prop [:spec :name :complete])))))))

(deftest test-bash-context-dependent-type
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "--type completes with edn/sqlite under graph export context"
      (is (string/includes? output "--type)"))
      (is (string/includes? output "graph' && \"$__subcmd\" == 'export'"))
      (is (string/includes? output "compgen -W 'edn sqlite'")))
    (testing "--type completes with property types under upsert property context"
      (is (string/includes? output "upsert' && \"$__subcmd\" == 'property'"))
      (is (string/includes? output "compgen -W '"))
      (is (string/includes? output "default"))
      (is (string/includes? output "node")))

    (testing "--type does NOT have a context-free case (simple COMPREPLY after --type)"
      ;; --type should be in context-dependent if-blocks, not a simple case
      (let [type-section (second (string/split output #"--type\)"))]
        (is (string/starts-with? (string/trim type-section) "if"))))))

(deftest test-bash-find-varied-option-keys
  (let [global-spec (-> full-table first :spec
                        (select-keys [:help :version :config :graph :data-dir
                                      :timeout-ms :output :verbose :profile]))
        global-keys (set (keys global-spec))
        varied (gen/find-varied-option-keys full-table global-keys)]
    (testing "--type is detected as varied"
      (is (contains? varied :type)))
    (testing "--name is detected as varied"
      (is (contains? varied :name)))
    (testing "uniform options like --pos are not varied"
      (is (not (contains? varied :pos))))
    (testing "uniform options like --cardinality are not varied"
      (is (not (contains? varied :cardinality))))))

(deftest test-e2e-generated-header
  (testing "zsh output includes do-not-edit header"
    (let [output (gen/generate-completions "zsh" full-table)]
      (is (string/includes? output "do not edit manually"))))
  (testing "bash output includes do-not-edit header"
    (let [output (gen/generate-completions "bash" full-table)]
      (is (string/includes? output "do not edit manually")))))
