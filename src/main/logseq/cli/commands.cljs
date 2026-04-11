(ns logseq.cli.commands
  "Command parsing and action building for the Logseq CLI."
  (:require [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.command.auth :as auth-command]
            [logseq.cli.command.completion :as completion-command]
            [logseq.cli.command.core :as command-core]
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
            [logseq.cli.command.skill :as skill-command]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.command.upsert :as upsert-command]
            [logseq.cli.completion-generator :as completion-gen]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]))

(def ^:private global-spec
  (command-core/global-spec))

;; Parsing helpers and summaries are in logseq.cli.command.core.

(defn- missing-result
  [summary code message]
  {:ok? false
   :error {:code code
           :message message}
   :summary summary})

(defn- missing-graph-result
  [summary]
  (missing-result summary :missing-graph "graph name is required"))

(defn- missing-content-result
  [summary]
  (missing-result summary :missing-content "content is required"))

(defn- missing-target-result
  [summary]
  (missing-result summary :missing-target "block or page is required"))

(defn- missing-page-name-result
  [summary]
  (missing-result summary :missing-page-name "page name is required"))

(defn- missing-tag-name-result
  [summary]
  (missing-result summary :missing-tag-name "tag name is required"))

(defn- missing-property-name-result
  [summary]
  (missing-result summary :missing-property-name "property name is required"))

(defn- missing-type-result
  [summary]
  (missing-result summary :missing-type "type is required"))

(defn- missing-input-result
  [summary]
  (missing-result summary :missing-input "input is required"))

(defn- missing-file-result
  [summary]
  (missing-result summary :missing-file "file is required"))

(defn- missing-src-result
  [summary]
  (missing-result summary :missing-src "src is required"))

(defn- missing-dst-result
  [summary]
  (missing-result summary :missing-dst "dst is required"))

(defn- missing-query-result
  [summary]
  (missing-result summary :missing-query "query is required"))

(defn- missing-query-text-result
  [summary]
  (missing-result summary :missing-query-text "query text is required"))

;; Error helpers are in logseq.cli.command.core.

;; Command-specific validation and entries are in subcommand namespaces.

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
               sync-command/entries
               auth-command/entries
               completion-command/entries
               skill-command/entries)))

(def ^:private table
  (vec (concat base-table
               (example-command/build-example-entries base-table))))

;; Global option parsing lives in logseq.cli.command.core.

(defn- index-of
  [coll value]
  (first (keep-indexed (fn [idx item]
                         (when (= item value) idx))
                       coll)))

(defn- inject-stdin-id-arg
  [args]
  (if (and (seq args) (= "show" (first args)))
    (if-let [idx (index-of args "--id")]
      (let [next-token (nth args (inc idx) nil)
            missing-value? (or (nil? next-token)
                               (string/starts-with? next-token "-"))]
        (if missing-value?
          {:args (vec (concat (subvec args 0 (inc idx))
                              [""]
                              (subvec args (inc idx))))
           :id-from-stdin? true}
          {:args args :id-from-stdin? false}))
      {:args args :id-from-stdin? false})
    {:args args :id-from-stdin? false}))

(defn- unknown-command-message
  [{:keys [dispatch wrong-input]}]
  (string/join " " (cond-> (vec dispatch)
                     wrong-input (conj wrong-input))))

(defn- legacy-upsert-option-guidance
  [args message]
  (let [subcommand (vec (take 2 args))
        message (or message "")]
    (cond
      (and (= ["upsert" "block"] subcommand)
           (re-find #"Unknown option:\s*:tags" message))
      "unknown option: --tags; use --update-tags"

      (and (= ["upsert" "block"] subcommand)
           (re-find #"Unknown option:\s*:properties" message))
      "unknown option: --properties; use --update-properties"

      (and (= ["upsert" "block"] subcommand)
           (re-find #"Unknown option:\s*:status" message))
      "unknown option: --status; use upsert task --status"

      (and (= ["upsert" "page"] subcommand)
           (re-find #"Unknown option:\s*:tags" message))
      "unknown option: --tags; use --update-tags"

      (and (= ["upsert" "page"] subcommand)
           (re-find #"Unknown option:\s*:properties" message))
      "unknown option: --properties; use --update-properties"

      (and (= ["upsert" "task"] subcommand)
           (or (re-find #"Unknown option:\s*:update-tags" message)
               (re-find #"Unknown option:\s*:update-properties" message)
               (re-find #"Unknown option:\s*:remove-tags" message)
               (re-find #"Unknown option:\s*:remove-properties" message)))
      "unknown option: use upsert block for --update-tags/--update-properties/--remove-tags/--remove-properties"

      :else
      nil)))

(defn- legacy-search-query-guidance
  [cmds]
  (let [scope (or (second cmds) "<scope>")]
    (str "legacy positional search query is not supported; use --content, e.g. logseq search "
         scope
         " --content <query>")))

(def ^:private graph-write-commands
  #{:graph-create :graph-switch :graph-remove :graph-import})

(def ^:private upsert-validation-commands
  #{:upsert-block :upsert-page :upsert-task :upsert-tag :upsert-property :upsert-asset})

(def ^:private search-validation-commands
  #{:search-block :search-page :search-property :search-tag})

(def ^:private list-validation-commands
  #{:list-page :list-tag :list-property :list-task :list-node :list-asset})

(def ^:private remove-validation-commands
  #{:remove-block :remove-page :remove-tag :remove-property})

(def ^:private server-graph-required-commands
  #{:server-start :server-stop :server-restart})

(def ^:private supported-completion-shells
  #{"zsh" "bash"})

(defn- completion-shell-error-message
  [shell]
  (when-not (supported-completion-shells shell)
    (if (seq shell)
      (str "unsupported shell: " shell "; expected zsh or bash")
      "missing shell argument; usage: logseq completion <zsh|bash>")))

(defn- validate-write-and-upsert
  [summary {:keys [command opts graph has-content? upsert-update-mode?
                   upsert-invalid-options-message]}]
  (cond
    ;; Require graphs when writing to graph
    (and (graph-write-commands command)
         (not (seq graph)))
    (missing-graph-result summary)

    (and (= command :upsert-block) (not upsert-update-mode?) (not has-content?))
    (missing-content-result summary)

    (and (= command :upsert-block) upsert-invalid-options-message)
    (command-core/invalid-options-result summary upsert-invalid-options-message)

    (and (= command :upsert-page) upsert-invalid-options-message)
    (command-core/invalid-options-result summary upsert-invalid-options-message)

    (and (= command :upsert-page)
         (not (some? (:id opts)))
         (not (seq (:page opts))))
    (missing-page-name-result summary)

    (and (= command :upsert-task) upsert-invalid-options-message)
    (command-core/invalid-options-result summary upsert-invalid-options-message)

    (and (= command :upsert-task)
         (not (some? (:id opts)))
         (not (seq (some-> (:uuid opts) string/trim)))
         (not (seq (some-> (:page opts) string/trim)))
         (not (seq (some-> (:content opts) string/trim))))
    (missing-target-result summary)

    (and (= command :upsert-tag) upsert-invalid-options-message)
    (command-core/invalid-options-result summary upsert-invalid-options-message)

    (and (= command :upsert-tag)
         (not (some? (:id opts)))
         (not (seq (some-> (:name opts) string/trim))))
    (missing-tag-name-result summary)

    (and (= command :upsert-property) upsert-invalid-options-message)
    (command-core/invalid-options-result summary upsert-invalid-options-message)

    (and (= command :upsert-property)
         (not (some? (:id opts)))
         (not (seq (some-> (:name opts) string/trim))))
    (missing-property-name-result summary)

    (and (= command :upsert-asset) upsert-invalid-options-message)
    (command-core/invalid-options-result summary upsert-invalid-options-message)

    :else
    nil))

(defn- validate-target-query-and-search
  [summary {:keys [command opts args cmds show-targets]}]
  (cond
    (and (= command :remove-block) (empty? (filter some? [(:id opts) (some-> (:uuid opts) string/trim)])))
    (missing-target-result summary)

    (and (= command :remove-page)
         (not (some? (:id opts)))
         (not (seq (some-> (:page opts) string/trim))))
    (missing-page-name-result summary)

    (and (#{:remove-tag :remove-property} command)
         (empty? (filter some? [(:id opts) (some-> (:name opts) string/trim)])))
    (missing-target-result summary)

    (and (= command :show) (empty? show-targets))
    (missing-target-result summary)

    (and (= command :show) (> (count show-targets) 1))
    (command-core/invalid-options-result summary "only one of --id, --uuid, or --page is allowed")

    (and (= command :query)
         (not (seq (some-> (:query opts) string/trim)))
         (not (seq (some-> (:name opts) string/trim))))
    (missing-query-result summary)

    (and (search-validation-commands command)
         (seq args))
    (command-core/invalid-options-result summary (legacy-search-query-guidance cmds))

    (and (search-validation-commands command)
         (not (seq (some-> (:content opts) str string/trim))))
    (assoc (missing-query-text-result summary) :command command)

    :else
    nil))

(defn- validate-option-contracts
  [summary {:keys [command list-invalid-options-message remove-invalid-options-message
                   show-invalid-options-message debug-invalid-options-message]}]
  (cond
    (and (list-validation-commands command)
         list-invalid-options-message)
    (command-core/invalid-options-result summary list-invalid-options-message)

    (and (remove-validation-commands command)
         remove-invalid-options-message)
    (command-core/invalid-options-result summary remove-invalid-options-message)

    (and (= command :show) show-invalid-options-message)
    (command-core/invalid-options-result summary show-invalid-options-message)

    (and (= command :debug-pull) debug-invalid-options-message)
    (command-core/invalid-options-result summary debug-invalid-options-message)

    :else
    nil))

(defn- validate-graph-sync-and-completion
  [summary {:keys [command opts import-export-type completion-shell-error]}]
  (cond
    (and (= command :graph-export) (not (seq import-export-type)))
    (missing-type-result summary)

    (and (= command :graph-export) (not (seq (:file opts))))
    (missing-file-result summary)

    (and (= command :graph-import) (not (seq import-export-type)))
    (missing-type-result summary)

    (and (= command :graph-import) (not (seq (:input opts))))
    (missing-input-result summary)

    (and (= command :graph-backup-restore)
         (not (seq (some-> (:src opts) string/trim))))
    (missing-src-result summary)

    (and (= command :graph-backup-restore)
         (not (seq (some-> (:dst opts) string/trim))))
    (missing-dst-result summary)

    (and (= command :graph-backup-remove)
         (not (seq (some-> (:src opts) string/trim))))
    (missing-src-result summary)

    (and (server-graph-required-commands command)
         (not (seq (:graph opts))))
    (missing-graph-result summary)

    (and (= command :sync-download)
         (not (seq (:graph opts))))
    (missing-graph-result summary)

    (and (= command :completion)
         completion-shell-error)
    (command-core/invalid-options-result summary completion-shell-error)

    :else
    nil))

(defn- finalize-command-validation-result
  [summary validation-context]
  (or (validate-write-and-upsert summary validation-context)
      (validate-target-query-and-search summary validation-context)
      (validate-option-contracts summary validation-context)
      (validate-graph-sync-and-completion summary validation-context)))

(defn- command-has-content?
  [args opts]
  (or (seq (:content opts))
      (seq (:blocks opts))
      (seq (:blocks-file opts))
      (seq args)))

(defn- build-validation-context
  [command opts args cmds]
  (let [show-targets (filter some? [(:id opts) (:uuid opts) (:page opts)])
        completion-shell (when (= command :completion)
                           (or (:shell opts) (first args)))]
    {:command command
     :opts opts
     :args args
     :cmds cmds
     :graph (:graph opts)
     :has-content? (command-has-content? args opts)
     :show-targets show-targets
     :upsert-update-mode? (upsert-command/update-mode? opts)
     :upsert-invalid-options-message (when (upsert-validation-commands command)
                                       (upsert-command/invalid-options? command opts))
     :list-invalid-options-message (when (list-validation-commands command)
                                     (list-command/invalid-options? command opts))
     :remove-invalid-options-message (when (remove-validation-commands command)
                                       (remove-command/invalid-options? command opts))
     :show-invalid-options-message (when (= command :show)
                                     (show-command/invalid-options? opts))
     :debug-invalid-options-message (when (= command :debug-pull)
                                      (debug-command/invalid-options? opts))
     :import-export-type (graph-command/normalize-import-export-type (:type opts))
     :completion-shell-error (when (= command :completion)
                               (completion-shell-error-message completion-shell))}))

(defn- finalize-ok-result
  [summary command opts args cmds]
  (cond-> (command-core/ok-result command opts args summary)
    (= command :example) (assoc :cmds cmds)))

(defn- finalize-command
  [summary {:keys [command opts args cmds spec long-desc examples]}]
  (let [opts (-> opts
                 command-core/normalize-opts
                 (#(list-command/normalize-options command %)))
        args (vec args)
        cmd-summary (command-core/command-summary {:cmds cmds
                                                   :spec spec
                                                   :long-desc long-desc
                                                   :examples (when (= command :example)
                                                               examples)})
        validation-context (build-validation-context command opts args cmds)]
    (cond
      (:help opts)
      (command-core/help-result cmd-summary)

      :else
      (or (finalize-command-validation-result summary validation-context)
          (finalize-ok-result summary command opts args cmds)))))

;; CLI error handling is in logseq.cli.command.core.

(defn- cmds-prefix?
  [prefix cmds]
  (and (<= (count prefix) (count cmds))
       (= prefix (subvec cmds 0 (count prefix)))))

(def ^:private group-command-paths
  (->> table
       (mapcat (fn [{:keys [cmds]}]
                 (let [cmds (vec cmds)]
                   (for [n (range 1 (count cmds))]
                     (subvec cmds 0 n)))))
       set))

(def ^:private exact-command-paths
  (->> table
       (mapv (comp vec :cmds))
       set))

(def ^:private help-flags
  #{"-h" "--help"})

(defn- group-help-path
  [args]
  (let [args (vec args)
        candidates (->> group-command-paths
                        (filter #(cmds-prefix? % args))
                        (sort-by count >))]
    (some (fn [path]
            (let [trailing-args (subvec args (count path))
                  exact-command? (contains? exact-command-paths (vec path))
                  help-requested? (and (seq trailing-args)
                                       (every? help-flags trailing-args))]
              (when (and (or (empty? trailing-args) help-requested?)
                         (if exact-command?
                           ;; When the path is both a group and an exact command:
                           ;; - `query -h` → show command help (not group help)
                           ;; - `example query` → execute command (not group help)
                           ;; - `query` (alone, single-segment) → show group help
                           ;;   for discoverability since cli/dispatch can't distinguish
                           ;;   `query` from `query list` prefix
                           (and (not help-requested?)
                                (= 1 (count path))
                                (empty? trailing-args))
                           true))
                path)))
          candidates)))

(defn parse-args
  [raw-args]
  (let [summary (command-core/top-level-summary table)
        {:keys [opts args]} (command-core/parse-leading-global-opts raw-args)
        {:keys [args id-from-stdin?]} (inject-stdin-id-arg (vec args))
        group-path (group-help-path args)]
    (cond
      (:version opts)
      (command-core/ok-result :version opts [] summary)

      (empty? args)
      (command-core/help-result summary)

      group-path
      (command-core/help-result (command-core/group-summary group-path table))

      :else
      (try
        (let [result (cli/dispatch table args {:spec global-spec})]
          (if (nil? result)
            (command-core/unknown-command-result summary (str "unknown command: " (string/join " " args)))
            (finalize-command summary
                              (update result :opts #(cond-> (merge opts (or % {}))
                                                      id-from-stdin? (assoc :id-from-stdin? true))))))
        (catch :default e
          (let [{:keys [cause] :as data} (ex-data e)]
            (cond
              (= cause :input-exhausted)
              (if-let [path (group-help-path args)]
                (command-core/help-result (command-core/group-summary path table))
                (command-core/help-result summary))

              (= cause :no-match)
              (command-core/unknown-command-result summary (str "unknown command: " (unknown-command-message data)))

              (some? data)
              (if-let [guided-message (legacy-upsert-option-guidance args (:msg data))]
                (command-core/invalid-options-result summary guided-message)
                (command-core/cli-error->result summary data))

              :else
              (command-core/unknown-command-result summary (str "unknown command: " (string/join " " args))))))))))

;; Repo/graph helpers live in logseq.cli.command.core.

(defn- ensure-existing-graph
  [action config]
  (if (and (:repo action) (not (:allow-missing-graph action)))
    (p/let [graphs (cli-server/list-graphs config)
            graph (command-core/repo->graph (:repo action))]
      (if (some #(= graph %) graphs)
        {:ok? true}
        {:ok? false
         :error {:code :graph-not-exists
                 :message "graph not exists"}}))
    (p/resolved {:ok? true})))

(defn- ensure-missing-graph
  [action config]
  (if (and (:repo action)
           (:require-missing-graph action))
    (p/let [graphs (cli-server/list-graphs config)
            graph (command-core/repo->graph (:repo action))]
      (if (some #(= graph %) graphs)
        {:ok? false
         :error {:code :graph-exists
                 :message "graph already exists"}}
        {:ok? true}))
    (p/resolved {:ok? true})))

;; Repo selection lives in logseq.cli.command.core.

;; Block parsing lives in logseq.cli.command.add.

;; Add/remove helpers live in logseq.cli.command.add/remove.

;; Show helpers live in logseq.cli.command.show.

;; Show helpers live in logseq.cli.command.show.

;; Repo normalization lives in logseq.cli.command.core.

;; Command-specific errors live in subcommand namespaces.

(defn ^:large-vars/cleanup-todo build-action
  [parsed config]
  (if-not (:ok? parsed)
    parsed
    (let [{:keys [command options args cmds]} parsed
          graph (command-core/pick-graph options args config)
          repo (command-core/resolve-repo graph)
          server-repo (command-core/resolve-repo (:graph options))]
      (case command
        (:graph-list :graph-create :graph-switch :graph-remove :graph-validate :graph-info)
        (graph-command/build-graph-action command graph repo options)

        :graph-backup-list
        (graph-command/build-backup-list-action repo)

        :graph-backup-create
        (graph-command/build-backup-create-action repo (:name options))

        :graph-backup-restore
        (graph-command/build-backup-restore-action repo (:src options) (:dst options))

        :graph-backup-remove
        (graph-command/build-backup-remove-action repo (:src options))

        :graph-export
        (let [export-type (graph-command/normalize-import-export-type (:type options))]
          (graph-command/build-export-action repo export-type (:file options)))

        :graph-import
        (let [import-repo (command-core/resolve-repo (:graph options))
              import-type (graph-command/normalize-import-export-type (:type options))]
          (graph-command/build-import-action import-repo import-type (:input options)))

        (:server-list :server-cleanup :server-start :server-stop :server-restart)
        (server-command/build-action command server-repo)

        (:list-page :list-tag :list-property :list-task :list-node :list-asset)
        (list-command/build-action command options repo)

        (:search-block :search-page :search-property :search-tag)
        (search-command/build-action command options repo)

        :upsert-block
        (upsert-command/build-block-action options args repo)

        :upsert-page
        (upsert-command/build-page-action options repo)

        :upsert-task
        (upsert-command/build-task-action options repo)

        :upsert-asset
        (upsert-command/build-asset-action options repo)

        :upsert-tag
        (upsert-command/build-tag-action options repo)

        :upsert-property
        (upsert-command/build-property-action options repo)

        (:remove-block :remove-page :remove-tag :remove-property)
        (remove-command/build-action command options repo)

        :query
        (query-command/build-action options repo config)

        :query-list
        (query-command/build-list-action options repo)

        :show
        (show-command/build-action options repo)

        :debug-pull
        (debug-command/build-action options repo)

        :doctor
        (doctor-command/build-action options)

        (:sync-status :sync-start :sync-stop :sync-upload :sync-download
         :sync-remote-graphs :sync-ensure-keys :sync-grant-access
         :sync-config-set :sync-config-get :sync-config-unset)
        (sync-command/build-action command options args repo)

        (:login :logout)
        (auth-command/build-action command)

        :completion
        {:ok? true
         :action {:type :completion
                  :shell (or (:shell options) (first args))}}

        :skill-show
        (skill-command/build-show-action options)

        :skill-install
        (skill-command/build-install-action options)

        :example
        (example-command/build-action base-table cmds)

        {:ok? false
         :error {:code :unknown-command
                 :message (str "unknown command: " command)}}))))

(defn execute
  [action config]
  (-> (p/let [missing-check (ensure-missing-graph action config)
              check (ensure-existing-graph action config)
              result (cond
                       (not (:ok? missing-check))
                       {:status :error
                        :error (:error missing-check)}

                       (not (:ok? check))
                       {:status :error
                        :error (:error check)}

                       :else
                       (case (:type action)
                         :graph-list (graph-command/execute-graph-list action config)
                         :graph-backup-list (graph-command/execute-graph-backup-list action config)
                         :graph-backup-create (graph-command/execute-graph-backup-create action config)
                         :graph-backup-restore (graph-command/execute-graph-backup-restore action config)
                         :graph-backup-remove (graph-command/execute-graph-backup-remove action config)
                         :invoke (graph-command/execute-invoke action config)
                         :graph-remove (graph-command/execute-graph-remove action config)
                         :graph-switch (graph-command/execute-graph-switch action config)
                         :graph-info (graph-command/execute-graph-info action config)
                         :graph-export (graph-command/execute-graph-export action config)
                         :graph-import (graph-command/execute-graph-import action config)
                         :list-page (list-command/execute-list-page action config)
                         :list-tag (list-command/execute-list-tag action config)
                         :list-property (list-command/execute-list-property action config)
                         :list-task (list-command/execute-list-task action config)
                         :list-node (list-command/execute-list-node action config)
                         :list-asset (list-command/execute-list-asset action config)
                         :search-block (search-command/execute-search-block action config)
                         :search-page (search-command/execute-search-page action config)
                         :search-property (search-command/execute-search-property action config)
                         :search-tag (search-command/execute-search-tag action config)
                         :upsert-block (upsert-command/execute-upsert-block action config)
                         :upsert-page (upsert-command/execute-upsert-page action config)
                         :upsert-task (upsert-command/execute-upsert-task action config)
                         :upsert-asset (upsert-command/execute-upsert-asset action config)
                         :upsert-tag (upsert-command/execute-upsert-tag action config)
                         :upsert-property (upsert-command/execute-upsert-property action config)
                         :remove-block (remove-command/execute-remove-block action config)
                         :remove-page (remove-command/execute-remove-page action config)
                         :remove-tag (remove-command/execute-remove-tag action config)
                         :remove-property (remove-command/execute-remove-property action config)
                         :query (query-command/execute-query action config)
                         :query-list (query-command/execute-query-list action config)
                         :show (show-command/execute-show action config)
                         :debug-pull (debug-command/execute-debug-pull action config)
                         :doctor (doctor-command/execute-doctor action config)
                         :completion (p/resolved
                                       {:status :ok
                                        :data {:message (completion-gen/generate-completions
                                                         (:shell action) table)}})
                         :skill-show (skill-command/execute-skill-show action config)
                         :skill-install (skill-command/execute-skill-install action config)
                         :example (example-command/execute-example action config)
                         :server-list (server-command/execute-list action config)
                         :server-cleanup (server-command/execute-cleanup action config)
                         :server-start (server-command/execute-start action config)
                         :server-stop (server-command/execute-stop action config)
                         :server-restart (server-command/execute-restart action config)
                         (:sync-status :sync-start :sync-stop :sync-upload :sync-download
                          :sync-remote-graphs :sync-ensure-keys :sync-grant-access
                          :sync-config-set :sync-config-get :sync-config-unset)
                         (sync-command/execute action config)
                         (:login :logout)
                         (auth-command/execute action config)
                         {:status :error
                          :error {:code :unknown-action
                                  :message "unknown action"}}))]
        (assoc result
               :command (or (:command action) (:type action))
               :context (select-keys action [:repo :graph :page :name :id :ids :uuid :block :blocks
                                             :schema :query :lookup :selector
                                             :source :target :update-tags :update-properties
                                             :remove-tags :remove-properties
                                             :status :priority
                                             :src :dst :backup-name
                                             :export-type :file :import-type :input
                                             :graph-id :email :config-key :config-value])))))
