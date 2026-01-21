(ns logseq.cli.commands
  "Command parsing and action building for the Logseq CLI."
  (:require [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.command.move :as move-command]
            [logseq.cli.command.remove :as remove-command]
            [logseq.cli.command.search :as search-command]
            [logseq.cli.command.server :as server-command]
            [logseq.cli.command.show :as show-command]
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

(defn- missing-repo-result
  [summary]
  {:ok? false
   :error {:code :missing-repo
           :message "repo is required"}
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

(defn- missing-source-result
  [summary]
  {:ok? false
   :error {:code :missing-source
           :message "source block is required"}
   :summary summary})

(defn- missing-page-name-result
  [summary]
  {:ok? false
   :error {:code :missing-page-name
           :message "page name is required"}
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

(defn- missing-output-result
  [summary]
  {:ok? false
   :error {:code :missing-output
           :message "output is required"}
   :summary summary})

(defn- missing-search-result
  [summary]
  {:ok? false
   :error {:code :missing-search-text
           :message "search text is required"}
   :summary summary})

;; Error helpers are in logseq.cli.command.core.

;; Command-specific validation and entries are in subcommand namespaces.

(def ^:private table
  (vec (concat graph-command/entries
               server-command/entries
               list-command/entries
               add-command/entries
               move-command/entries
               remove-command/entries
               search-command/entries
               show-command/entries)))

;; Global option parsing lives in logseq.cli.command.core.

(defn- unknown-command-message
  [{:keys [dispatch wrong-input]}]
  (string/join " " (cond-> (vec dispatch)
                     wrong-input (conj wrong-input))))

(defn- finalize-command
  [summary {:keys [command opts args cmds spec]}]
  (let [opts (command-core/normalize-opts opts)
        args (vec args)
        cmd-summary (command-core/command-summary {:cmds cmds :spec spec})
        graph (:repo opts)
        has-args? (seq args)
        has-content? (or (seq (:content opts))
                         (seq (:blocks opts))
                         (seq (:blocks-file opts))
                         has-args?)
        show-targets (filter some? [(:id opts) (:uuid opts) (:page-name opts)])
        move-sources (filter some? [(:id opts) (some-> (:uuid opts) string/trim)])
        move-targets (filter some? [(:target-id opts)
                                    (some-> (:target-uuid opts) string/trim)
                                    (some-> (:target-page-name opts) string/trim)])]
    (cond
      (:help opts)
      (command-core/help-result cmd-summary)

      (and (#{:graph-create :graph-switch :graph-remove :graph-validate} command)
           (not (seq graph)))
      (missing-graph-result summary)

      (and (= command :add-block) (not has-content?))
      (missing-content-result summary)

      (and (= command :add-block) (add-command/invalid-options? opts))
      (command-core/invalid-options-result summary (add-command/invalid-options? opts))

      (and (= command :add-page) (not (seq (:page opts))))
      (missing-page-name-result summary)

      (and (= command :remove-block) (not (seq (:block opts))))
      (missing-target-result summary)

      (and (= command :remove-page) (not (seq (:page opts))))
      (missing-target-result summary)

      (and (= command :move-block) (move-command/invalid-options? opts))
      (command-core/invalid-options-result summary (move-command/invalid-options? opts))

      (and (= command :move-block) (empty? move-sources))
      (missing-source-result summary)

      (and (= command :move-block) (empty? move-targets))
      (missing-target-result summary)

      (and (= command :show) (empty? show-targets))
      (missing-target-result summary)

      (and (= command :show) (> (count show-targets) 1))
      (command-core/invalid-options-result summary "only one of --id, --uuid, or --page-name is allowed")

      (and (= command :search) (not has-args?))
      (missing-search-result summary)

      (and (#{:list-page :list-tag :list-property} command)
           (list-command/invalid-options? command opts))
      (command-core/invalid-options-result summary (list-command/invalid-options? command opts))

      (and (= command :show) (show-command/invalid-options? opts))
      (command-core/invalid-options-result summary (show-command/invalid-options? opts))

      (and (= command :search) (search-command/invalid-options? opts))
      (command-core/invalid-options-result summary (search-command/invalid-options? opts))

      (and (= command :graph-export) (not (seq (graph-command/normalize-import-export-type (:type opts)))))
      (missing-type-result summary)

      (and (= command :graph-export) (not (seq (:output opts))))
      (missing-output-result summary)

      (and (= command :graph-export)
           (not (contains? (graph-command/import-export-types)
                           (graph-command/normalize-import-export-type (:type opts)))))
      (command-core/invalid-options-result summary (str "invalid type: " (:type opts)))

      (and (= command :graph-import) (not (seq (graph-command/normalize-import-export-type (:type opts)))))
      (missing-type-result summary)

      (and (= command :graph-import) (not (seq (:input opts))))
      (missing-input-result summary)

      (and (= command :graph-import) (not (seq (:repo opts))))
      (missing-repo-result summary)

      (and (= command :graph-import)
           (not (contains? (graph-command/import-export-types)
                           (graph-command/normalize-import-export-type (:type opts)))))
      (command-core/invalid-options-result summary (str "invalid type: " (:type opts)))

      (and (#{:server-status :server-start :server-stop :server-restart} command)
           (not (seq (:repo opts))))
      (missing-repo-result summary)

      :else
      (command-core/ok-result command opts args summary))))

;; CLI error handling is in logseq.cli.command.core.

(defn parse-args
  [raw-args]
  (let [summary (command-core/top-level-summary table)
        legacy-graph-opt? (command-core/legacy-graph-opt? raw-args)
        {:keys [opts args]} (command-core/parse-leading-global-opts raw-args)]
    (if legacy-graph-opt?
      (command-core/invalid-options-result summary "unknown option: --graph")
    (if (empty? args)
      (if (:help opts)
        (command-core/help-result summary)
        {:ok? false
         :error {:code :missing-command
                 :message "missing command"}
           :summary summary})
      (if (and (= 1 (count args)) (#{"graph" "server" "list" "add" "remove"} (first args)))
        (command-core/help-result (command-core/group-summary (first args) table))
        (try
          (let [result (cli/dispatch table args {:spec global-spec})]
            (if (nil? result)
              (command-core/unknown-command-result summary (str "unknown command: " (string/join " " args)))
              (finalize-command summary (update result :opts #(merge opts (or % {}))))))
          (catch :default e
            (let [{:keys [cause] :as data} (ex-data e)]
              (cond
                (= cause :input-exhausted)
                (if (:help opts)
                  (command-core/help-result summary)
                  {:ok? false
                   :error {:code :missing-command
                           :message "missing command"}
                   :summary summary})

                (= cause :no-match)
                (command-core/unknown-command-result summary (str "unknown command: " (unknown-command-message data)))

                (some? data)
                (command-core/cli-error->result summary data)

                :else
                (command-core/unknown-command-result summary (str "unknown command: " (string/join " " args))))))))))))

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
  (if (and (= :graph-import (:type action)) (:repo action))
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
          server-repo (command-core/resolve-repo (:repo options))]
      (case command
        (:graph-list :graph-create :graph-switch :graph-remove :graph-validate :graph-info)
        (graph-command/build-graph-action command graph repo)

        :graph-export
        (let [export-type (graph-command/normalize-import-export-type (:type options))]
          (graph-command/build-export-action repo export-type (:output options)))

        :graph-import
        (let [import-repo (command-core/resolve-repo (:repo options))
              import-type (graph-command/normalize-import-export-type (:type options))]
          (graph-command/build-import-action import-repo import-type (:input options)))

        (:server-list :server-status :server-start :server-stop :server-restart)
        (server-command/build-action command server-repo)

        (:list-page :list-tag :list-property)
        (list-command/build-action command options repo)

        :add-block
        (add-command/build-add-block-action options args repo)

        :add-page
        (add-command/build-add-page-action options repo)

        :move-block
        (move-command/build-action options repo)

        :remove-block
        (remove-command/build-remove-block-action options repo)

        :remove-page
        (remove-command/build-remove-page-action options repo)

        :search
        (search-command/build-action options args repo)

        :show
        (show-command/build-action options repo)

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
                         :graph-switch (graph-command/execute-graph-switch action config)
                         :graph-info (graph-command/execute-graph-info action config)
                         :graph-export (graph-command/execute-graph-export action config)
                         :graph-import (graph-command/execute-graph-import action config)
                         :list-page (list-command/execute-list-page action config)
                         :list-tag (list-command/execute-list-tag action config)
                         :list-property (list-command/execute-list-property action config)
                         :add-block (add-command/execute-add-block action config)
                         :add-page (add-command/execute-add-page action config)
                         :move-block (move-command/execute-move action config)
                         :remove-block (remove-command/execute-remove action config)
                         :remove-page (remove-command/execute-remove action config)
                         :search (search-command/execute-search action config)
                         :show (show-command/execute-show action config)
                         :server-list (server-command/execute-list action config)
                         :server-status (server-command/execute-status action config)
                         :server-start (server-command/execute-start action config)
                         :server-stop (server-command/execute-stop action config)
                         :server-restart (server-command/execute-restart action config)
                         {:status :error
                          :error {:code :unknown-action
                                  :message "unknown action"}}))]
        (assoc result
               :command (or (:command action) (:type action))
               :context (select-keys action [:repo :graph :page :block :blocks :source :target])))))
