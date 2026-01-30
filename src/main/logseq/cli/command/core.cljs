(ns logseq.cli.command.core
  "Shared CLI parsing utilities."
  (:require [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.style :as style]
            [logseq.common.config :as common-config]))

(def ^:private global-spec*
  {:help {:alias :h
          :desc "Show help"
          :coerce :boolean}
   :version {:desc "Show version"
             :coerce :boolean}
   :config {:desc "Path to cli.edn (default ~/logseq/cli.edn)"}
   :repo {:desc "Graph name"}
   :data-dir {:desc "Path to db-worker data dir (default ~/logseq/cli-graphs)"}
   :timeout-ms {:desc "Request timeout in ms (default 10000)"
                :coerce :long}
   :output {:desc "Output format (human, json, edn). Default: human"}})

(defn global-spec
  []
  global-spec*)

(defn- merge-spec
  [spec]
  (merge global-spec* (or spec {})))

(defn command-entry
  [cmds command desc spec]
  (let [spec* (merge-spec spec)]
    {:cmds cmds
     :command command
     :desc desc
     :spec spec*
     :restrict true
     :fn (fn [{:keys [opts args]}]
           {:command command
            :cmds cmds
            :spec spec*
            :opts opts
            :args args})}))

(defn- command-usage
  [cmds spec]
  (let [base (string/join " " cmds)
        has-options? (seq spec)]
    (cond-> base
      has-options? (str " [options]"))))

(defn- command-label
  [cmds]
  (string/join " " cmds))

(defn- format-commands
  [table]
  (let [rows (->> table
                  (filter (comp seq :cmds))
                  (map (fn [{:keys [cmds desc]}]
                         (let [command (command-label cmds)]
                           {:command command
                            :command-styled (style/bold command)
                            :desc desc}))))
        width (apply max 0 (map (comp count :command) rows))]
    (->> rows
         (map (fn [{:keys [command command-styled desc]}]
                (let [padding (apply str (repeat (- width (count command)) " "))]
                  (cond-> (str "  " command-styled padding)
                    (seq desc) (str "  " desc)))))
         (string/join "\n"))))

(defn- format-opts
  [spec]
  (style/bold-options (cli/format-opts {:spec spec})))

(defn group-summary
  [group table]
  (let [group-table (filter #(= group (first (:cmds %))) table)]
    (string/join "\n"
                 [(str "Usage: logseq " group " <subcommand> [options]")
                  ""
                  (str (style/bold "Subcommands") ":")
                  (format-commands group-table)
                  ""
                  (str "Global " (style/bold "options") ":")
                  (format-opts global-spec*)
                  ""
                  (str "Command " (style/bold "options") ":")
                  (str "  See `logseq " group " <subcommand> --help`")])))

(defn top-level-summary
  [table]
  (let [groups [{:title "Graph Inspect and Edit"
                 :commands #{"list" "add" "remove" "move" "query" "show"}}
                {:title "Graph Management"
                 :commands #{"graph" "server"}}]
        render-group (fn [{:keys [title commands]}]
                       (let [entries (filter #(contains? commands (first (:cmds %))) table)]
                         (string/join "\n" [title (format-commands entries)])))]
    (string/join "\n"
                 ["Usage: logseq <command> [options]"
                  ""
                  (str (style/bold "Commands") ":")
                  (string/join "\n\n" (map render-group groups))
                  ""
                  (str "Global " (style/bold "options") ":")
                  (format-opts global-spec*)
                  ""
                  (str "Command " (style/bold "options") ":")
                  "  See `logseq <command> --help`"])))

(defn command-summary
  [{:keys [cmds spec]}]
  (let [command-spec (apply dissoc spec (keys global-spec*))]
    (string/join "\n"
                 [(str "Usage: logseq " (command-usage cmds spec))
                  ""
                  (str "Global " (style/bold "options") ":")
                  (format-opts global-spec*)
                  ""
                  (str "Command " (style/bold "options") ":")
                  (format-opts command-spec)])))

(defn normalize-opts
  [opts]
  (cond-> opts
    (:config opts) (-> (assoc :config-path (:config opts))
                       (dissoc :config))))

(defn ok-result
  [command opts args summary]
  {:ok? true
   :command command
   :options (normalize-opts opts)
   :args (vec args)
   :summary summary})

(defn help-result
  [summary]
  {:ok? false
   :help? true
   :summary summary})

(defn invalid-options-result
  [summary message]
  {:ok? false
   :error {:code :invalid-options
           :message (style/bold-options message)}
   :summary summary})

(defn unknown-command-result
  [summary message]
  {:ok? false
   :error {:code :unknown-command
           :message message}
   :summary summary})

(def ^:private global-aliases
  (->> global-spec*
       (keep (fn [[k {:keys [alias]}]]
               (when alias
                 [alias k])))
       (into {})))

(def ^:private global-flag-options
  (->> global-spec*
       (keep (fn [[k {:keys [coerce]}]]
               (when (= coerce :boolean) k)))
       (set)))

(defn- global-opt-key
  [token]
  (cond
    (string/starts-with? token "--")
    (keyword (subs token 2))

    (and (string/starts-with? token "-")
         (= 2 (count token)))
    (get global-aliases (keyword (subs token 1)))

    :else nil))

(defn parse-leading-global-opts
  [args]
  (loop [remaining args
         opts {}]
    (if (empty? remaining)
      {:opts opts :args []}
      (let [token (first remaining)]
        (if-let [opt-key (global-opt-key token)]
          (if (contains? global-flag-options opt-key)
            (recur (rest remaining) (assoc opts opt-key true))
            (if-let [value (second remaining)]
              (recur (drop 2 remaining) (assoc opts opt-key value))
              {:opts opts :args (rest remaining)}))
          {:opts opts :args remaining})))))

(defn legacy-graph-opt?
  [raw-args]
  (some (fn [token]
          (or (= token "--graph")
              (string/starts-with? token "--graph=")))
        raw-args))

(defn cli-error->result
  [summary {:keys [msg]}]
  (invalid-options-result summary (or msg "invalid options")))

(defn graph->repo
  [graph]
  (when (seq graph)
    (if (string/starts-with? graph common-config/db-version-prefix)
      graph
      (str common-config/db-version-prefix graph))))

(defn repo->graph
  [repo]
  (when (seq repo)
    (string/replace-first repo common-config/db-version-prefix "")))

(defn resolve-repo
  [graph]
  (let [graph (some-> graph string/trim)]
    (when (seq graph)
      (graph->repo graph))))

(defn pick-graph
  [options _command-args config]
  (or (:repo options)
      (:repo config)))
