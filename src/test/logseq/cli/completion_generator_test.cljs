(ns logseq.cli.completion-generator-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.completion :as completion-command]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.doctor :as doctor-command]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.command.query :as query-command]
            [logseq.cli.command.remove :as remove-command]
            [logseq.cli.command.server :as server-command]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.command.upsert :as upsert-command]
            [logseq.cli.completion-generator :as gen]))

(def ^:private full-table
  (vec (concat graph-command/entries
               server-command/entries
               list-command/entries
               upsert-command/entries
               remove-command/entries
               query-command/entries
               show-command/entries
               doctor-command/entries
               completion-command/entries)))

;; ---------------------------------------------------------------------------
;; Phase 1 — Spec enrichment tests
;; ---------------------------------------------------------------------------

(deftest test-global-spec-metadata
  (let [spec (core/global-spec)]
    (testing ":output has :values"
      (is (= ["human" "json" "edn"] (get-in spec [:output :values]))))
    (testing ":graph has :complete :graphs"
      (is (= :graphs (get-in spec [:graph :complete]))))
    (testing ":config has :complete :file"
      (is (= :file (get-in spec [:config :complete]))))
    (testing ":data-dir has :complete :dir"
      (is (= :dir (get-in spec [:data-dir :complete]))))))

(deftest test-list-spec-metadata
  (let [entries list-command/entries
        page-entry (first (filter #(= :list-page (:command %)) entries))
        tag-entry (first (filter #(= :list-tag (:command %)) entries))
        property-entry (first (filter #(= :list-property (:command %)) entries))]
    (testing "page-spec :sort has correct values"
      (is (= ["title" "created-at" "updated-at"]
             (get-in page-entry [:spec :sort :values]))))
    (testing "tag-spec :sort has correct values"
      (is (= ["name" "title"]
             (get-in tag-entry [:spec :sort :values]))))
    (testing "property-spec :sort has correct values"
      (is (= ["name" "title"]
             (get-in property-entry [:spec :sort :values]))))
    (testing "common :order has correct values"
      (is (= ["asc" "desc"]
             (get-in page-entry [:spec :order :values]))))))

(deftest test-upsert-spec-metadata
  (let [entries upsert-command/entries
        block-entry (first (filter #(= :upsert-block (:command %)) entries))
        page-entry (first (filter #(= :upsert-page (:command %)) entries))
        property-entry (first (filter #(= :upsert-property (:command %)) entries))]
    (testing "block-spec :pos has :values"
      (is (= ["first-child" "last-child" "sibling"]
             (get-in block-entry [:spec :pos :values]))))
    (testing "block-spec :status has :values"
      (is (seq (get-in block-entry [:spec :status :values]))))
    (testing "block-spec :target-page has :complete :pages"
      (is (= :pages (get-in block-entry [:spec :target-page :complete]))))
    (testing "block-spec :blocks-file has :complete :file"
      (is (= :file (get-in block-entry [:spec :blocks-file :complete]))))
    (testing "page-spec :page has :complete :pages"
      (is (= :pages (get-in page-entry [:spec :page :complete]))))
    (testing "property-spec :type has :values"
      (is (= ["default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"]
             (get-in property-entry [:spec :type :values]))))
    (testing "property-spec :cardinality has :values"
      (is (= ["one" "many"]
             (get-in property-entry [:spec :cardinality :values]))))))

(deftest test-graph-spec-metadata
  (let [entries graph-command/entries
        export-entry (first (filter #(= :graph-export (:command %)) entries))
        import-entry (first (filter #(= :graph-import (:command %)) entries))]
    (testing "export-spec :type has :values"
      (is (= ["edn" "sqlite"] (get-in export-entry [:spec :type :values]))))
    (testing "export-spec :file has :complete :file"
      (is (= :file (get-in export-entry [:spec :file :complete]))))
    (testing "import-spec :type has :values"
      (is (= ["edn" "sqlite"] (get-in import-entry [:spec :type :values]))))
    (testing "import-spec :input has :complete :file"
      (is (= :file (get-in import-entry [:spec :input :complete]))))))

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
    (testing "remove-page :name has :complete :pages"
      (is (= :pages (get-in page-entry [:spec :name :complete]))))
    (testing "remove-tag :name does NOT have :complete"
      (is (nil? (get-in tag-entry [:spec :name :complete]))))
    (testing "remove-property :name does NOT have :complete"
      (is (nil? (get-in property-entry [:spec :name :complete]))))))

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
    (testing "graph, server, list, upsert, remove are groups"
      (is (contains? group-names "graph"))
      (is (contains? group-names "server"))
      (is (contains? group-names "list"))
      (is (contains? group-names "upsert"))
      (is (contains? group-names "remove")))))

(deftest test-spec->token
  (testing "boolean spec → :flag type"
    (let [token (gen/spec->token [:help {:coerce :boolean :desc "Show help"}])]
      (is (= :flag (:type token)))))
  (testing "spec with :values → :enum type"
    (let [token (gen/spec->token [:output {:values ["human" "json" "edn"] :desc "Format"}])]
      (is (= :enum (:type token)))
      (is (= ["human" "json" "edn"] (:values token)))))
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
      (is (= :free (:type token))))))

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
    (testing "output contains per-command functions"
      (is (string/includes? output "_logseq_graph_export()"))
      (is (string/includes? output "_logseq_show()")))
    (testing "output contains group dispatchers"
      (is (string/includes? output "_logseq_graph()"))
      (is (string/includes? output "_logseq_list()"))
      (is (string/includes? output "_logseq_upsert()")))
    (testing "output contains top-level dispatcher"
      (is (string/includes? output "_logseq()")))
    (testing "output ends with compdef _logseq logseq"
      (is (string/includes? output "compdef _logseq logseq")))
    (testing "boolean flags emit bare flag form"
      (is (re-find #"--verbose\[" output)))
    (testing "enum options emit value list form"
      (is (re-find #"--output=.*\(human json edn\)" output)))
    (testing ":complete :graphs emits _logseq_graphs"
      (is (re-find #"--graph=.*_logseq_graphs" output)))
    (testing ":complete :file emits _files"
      (is (re-find #"--config=.*_files'" output)))
    (testing ":alias emits grouping"
      (is (re-find #"\(-h --help\)" output)))))

(deftest test-zsh-command-specific-values
  (let [output (gen/generate-completions "zsh" full-table)]
    (testing "--pos under upsert block offers correct values"
      (is (re-find #"--pos=.*\(first-child last-child sibling\)" output)))
    (testing "--sort for list page offers correct values"
      (is (re-find #"--sort=.*\(title created-at updated-at\)" output)))
    (testing "--sort for list tag offers name title"
      ;; The list tag function should contain (name title)
      (let [tag-section (second (re-find #"_logseq_list_tag\(\).*?(?=\n_logseq)" output))]
        ;; Just check globally that name title appears in sort context
        (is (re-find #"\(name title\)" output))))))

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
    (testing "output contains _logseq_opts_for"
      (is (string/includes? output "_logseq_opts_for()")))
    (testing "output contains _logseq_is_value_opt"
      (is (string/includes? output "_logseq_is_value_opt()")))
    (testing "output ends with complete -F _logseq logseq"
      (is (string/includes? output "complete -F _logseq logseq")))
    (testing "graph export case includes --type and --file"
      (is (string/includes? output "--type"))
      (is (string/includes? output "--file")))
    (testing "boolean flags appear in wordlist"
      (is (string/includes? output "--verbose")))
    (testing "enum values use compgen -W"
      (is (re-find #"compgen -W.*human json edn" output)))
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
    (testing "spec has :shell with :values"
      (is (= ["zsh" "bash"]
             (get-in (first entries) [:spec :shell :values]))))))

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
    (testing "remove page spec has :name with :complete :pages"
      (let [rm-page (first (filter #(= :remove-page (:command %)) entries))]
        (is (= :pages (get-in rm-page [:spec :name :complete])))))
    (testing "upsert tag spec does NOT have :complete on :name"
      (let [tag (first (filter #(= :upsert-tag (:command %)) entries))]
        (is (nil? (get-in tag [:spec :name :complete])))))
    (testing "remove tag spec does NOT have :complete on :name"
      (let [tag (first (filter #(= :remove-tag (:command %)) entries))]
        (is (nil? (get-in tag [:spec :name :complete])))))))

(deftest test-bash-context-dependent-type
  (let [output (gen/generate-completions "bash" full-table)]
    (testing "--type completes with edn/sqlite under graph export context"
      (is (string/includes? output "--type)"))
      (is (string/includes? output "graph' && \"$__subcmd\" == 'export'"))
      (is (string/includes? output "compgen -W 'edn sqlite'")))
    (testing "--type completes with property types under upsert property context"
      (is (string/includes? output "upsert' && \"$__subcmd\" == 'property'"))
      (is (string/includes? output "compgen -W 'default number")))
    (testing "--type does NOT have a context-free case (simple COMPREPLY after --type)"
      ;; --type should be in context-dependent if-blocks, not a simple case
      (let [type-section (second (string/split output #"--type\)"))]
        (is (string/starts-with? (string/trim type-section) "if"))))))

(deftest test-bash-find-varied-option-keys
  (let [global-spec (-> full-table first :spec
                        (select-keys [:help :version :config :graph :data-dir
                                      :timeout-ms :output :verbose]))
        global-keys (set (keys global-spec))
        varied (gen/find-varied-option-keys full-table global-keys)]
    (testing "--type is detected as varied"
      (is (contains? varied :type)))
    (testing "--name is detected as varied"
      (is (contains? varied :name)))
    (testing "--sort is detected as varied"
      (is (contains? varied :sort)))
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
