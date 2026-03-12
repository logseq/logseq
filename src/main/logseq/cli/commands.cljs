(ns logseq.cli.commands
  "Command parsing and action building for the Logseq CLI."
  (:require [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.command.auth :as auth-command]
            [logseq.cli.command.completion :as completion-command]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.command.doctor :as doctor-command]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.command.query :as query-command]
            [logseq.cli.command.remove :as remove-command]
            [logseq.cli.command.server :as server-command]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.command.sync :as sync-command]
            [logseq.cli.command.upsert :as upsert-command]
            [logseq.cli.completion-generator :as completion-gen]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]))

(def ^:private global-spec
  (command-core/global-spec))

;; Parsing helpers and summaries are in logseq.cli.command.core.

(defn- missing-graph-result
  [summary]
  {:ok? false
   :error {:code :missing-graph
           :message "graph name is required"}
   :summary summary})

(defn- missing-content-result
  [summary]
  {:ok? false
   :error {:code :missing-content
           :message "content is required"}
   :summary summary})

(defn- missing-target-result
  [summary]
  {:ok? false
   :error {:code :missing-target
           :message "block or page is required"}
   :summary summary})

(defn- missing-page-name-result
  [summary]
  {:ok? false
   :error {:code :missing-page-name
           :message "page name is required"}
   :summary summary})

(defn- missing-tag-name-result
  [summary]
  {:ok? false
   :error {:code :missing-tag-name
           :message "tag name is required"}
   :summary summary})

(defn- missing-property-name-result
  [summary]
  {:ok? false
   :error {:code :missing-property-name
           :message "property name is required"}
   :summary summary})

(defn- missing-type-result
  [summary]
  {:ok? false
   :error {:code :missing-type
           :message "type is required"}
   :summary summary})

(defn- missing-input-result
  [summary]
  {:ok? false
   :error {:code :missing-input
           :message "input is required"}
   :summary summary})

(defn- missing-file-result
  [summary]
  {:ok? false
   :error {:code :missing-file
           :message "file is required"}
   :summary summary})

(defn- missing-query-result
  [summary]
  {:ok? false
   :error {:code :missing-query
           :message "query is required"}
   :summary summary})

;; Error helpers are in logseq.cli.command.core.

;; Command-specific validation and entries are in subcommand namespaces.

(def ^:private table
  (vec (concat graph-command/entries
               server-command/entries
               list-command/entries
               upsert-command/entries
               remove-command/entries
               query-command/entries
               show-command/entries
               doctor-command/entries
               sync-command/entries
               auth-command/entries
               completion-command/entries)))

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
  (let [subcommand (vec (take 2 args))]
    (cond
      (and (= ["upsert" "block"] subcommand)
           (re-find #"Unknown option:\s*:tags" (or message "")))
      "unknown option: --tags; use --update-tags"

      (and (= ["upsert" "block"] subcommand)
           (re-find #"Unknown option:\s*:properties" (or message "")))
      "unknown option: --properties; use --update-properties"

      (and (= ["upsert" "page"] subcommand)
           (re-find #"Unknown option:\s*:tags" (or message "")))
      "unknown option: --tags; use --update-tags"

      (and (= ["upsert" "page"] subcommand)
           (re-find #"Unknown option:\s*:properties" (or message "")))
      "unknown option: --properties; use --update-properties"

      :else
      nil)))

(defn- ^:large-vars/cleanup-todo finalize-command
  [summary {:keys [command opts args cmds spec long-desc]}]
  (let [opts (command-core/normalize-opts opts)
        args (vec args)
        cmd-summary (command-core/command-summary {:cmds cmds :spec spec :long-desc long-desc})
        graph (:graph opts)
        has-args? (seq args)
        has-content? (or (seq (:content opts))
                         (seq (:blocks opts))
                         (seq (:blocks-file opts))
                         has-args?)
        show-targets (filter some? [(:id opts) (:uuid opts) (:page opts)])
        upsert-update-mode? (upsert-command/update-mode? opts)]
    (cond
      (:help opts)
      (command-core/help-result cmd-summary)

      ;; Require graphs when writing to graph
      (and (#{:graph-create :graph-switch :graph-remove :graph-import} command)
           (not (seq graph)))
      (missing-graph-result summary)

      (and (= command :upsert-block) (not upsert-update-mode?) (not has-content?))
      (missing-content-result summary)

      (and (= command :upsert-block) (upsert-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (upsert-command/invalid-options? command opts))

      (and (= command :upsert-page) (upsert-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (upsert-command/invalid-options? command opts))

      (and (= command :upsert-page)
           (not (some? (:id opts)))
           (not (seq (:page opts))))
      (missing-page-name-result summary)

      (and (= command :upsert-tag) (upsert-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (upsert-command/invalid-options? command opts))

      (and (= command :upsert-tag)
           (not (some? (:id opts)))
           (not (seq (some-> (:name opts) string/trim))))
      (missing-tag-name-result summary)

      (and (= command :upsert-property) (upsert-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (upsert-command/invalid-options? command opts))

      (and (= command :upsert-property)
           (not (some? (:id opts)))
           (not (seq (some-> (:name opts) string/trim))))
      (missing-property-name-result summary)

      (and (= command :remove-block) (empty? (filter some? [(:id opts) (some-> (:uuid opts) string/trim)])))
      (missing-target-result summary)

      (and (= command :remove-page) (not (seq (some-> (:name opts) string/trim))))
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

      (and (#{:list-page :list-tag :list-property} command)
           (list-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (list-command/invalid-options? command opts))

      (and (#{:remove-block :remove-page :remove-tag :remove-property} command)
           (remove-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (remove-command/invalid-options? command opts))

      (and (= command :show) (show-command/invalid-options? opts))
      (command-core/invalid-options-result summary (show-command/invalid-options? opts))

      (and (= command :graph-export) (not (seq (graph-command/normalize-import-export-type (:type opts)))))
      (missing-type-result summary)

      (and (= command :graph-export) (not (seq (:file opts))))
      (missing-file-result summary)

      (and (= command :graph-export)
           (not (contains? (graph-command/import-export-types)
                           (graph-command/normalize-import-export-type (:type opts)))))
      (command-core/invalid-options-result summary (str "invalid type: " (:type opts)))

      (and (= command :graph-import) (not (seq (graph-command/normalize-import-export-type (:type opts)))))
      (missing-type-result summary)

      (and (= command :graph-import) (not (seq (:input opts))))
      (missing-input-result summary)

      (and (= command :graph-import)
           (not (contains? (graph-command/import-export-types)
                           (graph-command/normalize-import-export-type (:type opts)))))
      (command-core/invalid-options-result summary (str "invalid type: " (:type opts)))

      (and (#{:server-status :server-start :server-stop :server-restart} command)
           (not (seq (:graph opts))))
      (missing-graph-result summary)

      (and (= command :sync-download)
           (not (seq (:graph opts))))
      (missing-graph-result summary)

      (and (= command :completion)
           (let [shell (or (:shell opts) (first args))]
             (not (#{"zsh" "bash"} shell))))
      (command-core/invalid-options-result
       summary
       (let [shell (or (:shell opts) (first args))]
         (if (seq shell)
           (str "unsupported shell: " shell "; expected zsh or bash")
           "missing shell argument; usage: logseq completion <zsh|bash>")))

      :else
      (command-core/ok-result command opts args summary))))

;; CLI error handling is in logseq.cli.command.core.

(defn parse-args
  [raw-args]
  (let [summary (command-core/top-level-summary table)
        {:keys [opts args]} (command-core/parse-leading-global-opts raw-args)
        {:keys [args id-from-stdin?]} (inject-stdin-id-arg (vec args))]
    (cond
      (:version opts)
      (command-core/ok-result :version opts [] summary)

      (empty? args)
      (command-core/help-result summary)

      (and (= 1 (count args)) (#{"graph" "server" "list" "upsert" "remove" "query" "sync"} (first args)))
      (command-core/help-result (command-core/group-summary (first args) table))

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
              (command-core/help-result summary)

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
           (or (:require-missing-graph action)
               (= :graph-import (:type action))))
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

(defn build-action
  [parsed config]
  (if-not (:ok? parsed)
    parsed
    (let [{:keys [command options args]} parsed
          graph (command-core/pick-graph options args config)
          repo (command-core/resolve-repo graph)
          server-repo (command-core/resolve-repo (:graph options))]
      (case command
        (:graph-list :graph-create :graph-switch :graph-remove :graph-validate :graph-info)
        (graph-command/build-graph-action command graph repo options)

        :graph-export
        (let [export-type (graph-command/normalize-import-export-type (:type options))]
          (graph-command/build-export-action repo export-type (:file options)))

        :graph-import
        (let [import-repo (command-core/resolve-repo (:graph options))
              import-type (graph-command/normalize-import-export-type (:type options))]
          (graph-command/build-import-action import-repo import-type (:input options)))

        (:server-list :server-status :server-start :server-stop :server-restart)
        (server-command/build-action command server-repo)

        (:list-page :list-tag :list-property)
        (list-command/build-action command options repo)

        :upsert-block
        (upsert-command/build-block-action options args repo)

        :upsert-page
        (upsert-command/build-page-action options repo)

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
                         :invoke (graph-command/execute-invoke action config)
                         :graph-remove (graph-command/execute-graph-remove action config)
                         :graph-switch (graph-command/execute-graph-switch action config)
                         :graph-info (graph-command/execute-graph-info action config)
                         :graph-export (graph-command/execute-graph-export action config)
                         :graph-import (graph-command/execute-graph-import action config)
                         :list-page (list-command/execute-list-page action config)
                         :list-tag (list-command/execute-list-tag action config)
                         :list-property (list-command/execute-list-property action config)
                         :upsert-block (upsert-command/execute-upsert-block action config)
                         :upsert-page (upsert-command/execute-upsert-page action config)
                         :upsert-tag (upsert-command/execute-upsert-tag action config)
                         :upsert-property (upsert-command/execute-upsert-property action config)
                         :remove-block (remove-command/execute-remove-block action config)
                         :remove-page (remove-command/execute-remove-page action config)
                         :remove-tag (remove-command/execute-remove-tag action config)
                         :remove-property (remove-command/execute-remove-property action config)
                         :query (query-command/execute-query action config)
                         :query-list (query-command/execute-query-list action config)
                         :show (show-command/execute-show action config)
                         :doctor (doctor-command/execute-doctor action config)
                         :completion (p/resolved
                                       {:status :ok
                                        :data {:message (completion-gen/generate-completions
                                                         (:shell action) table)}})
                         :server-list (server-command/execute-list action config)
                         :server-status (server-command/execute-status action config)
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
                                             :schema
                                             :source :target :update-tags :update-properties
                                             :remove-tags :remove-properties
                                             :export-type :file :import-type :input
                                             :graph-id :email :config-key :config-value])))))
