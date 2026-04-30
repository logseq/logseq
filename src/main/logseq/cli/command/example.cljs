(ns logseq.cli.command.example
  "Example command generation and execution."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.humanize :as cli-humanize]
            [promesa.core :as p]))

(def ^:private phase1-groups
  ["list" "upsert" "remove" "query" "search" "show"])

(defn- command-path->label
  [cmds]
  (string/join " " cmds))

(defn- normalize-example-lines
  [examples]
  (->> (or examples [])
       (keep (fn [example]
               (let [line (some-> example str string/trim)]
                 (when (seq line)
                   line))))
       vec))

(defn phase1-target-entries
  [base-table]
  (->> base-table
       (filter (fn [entry]
                 (contains? (set phase1-groups)
                            (first (:cmds entry)))))
       vec))

(defn- selector-definitions
  [base-table]
  (let [targets (phase1-target-entries base-table)
        by-group (group-by (comp first :cmds) targets)
        prefix-defs (->> phase1-groups
                         (keep (fn [group]
                                 (when-let [matches (seq (get by-group group))]
                                   {:selector [group]
                                    :matches (vec matches)}))))
        prefix-selector-set (set (map :selector prefix-defs))
        exact-defs (->> targets
                        (mapv (fn [entry]
                                {:selector (:cmds entry)
                                 :matches [entry]}))
                        (remove (fn [{:keys [selector]}]
                                  (contains? prefix-selector-set selector))))]
    (vec (concat prefix-defs exact-defs))))

(defn- selector-entry
  [{:keys [selector matches]}]
  (let [selector-label (command-path->label selector)
        matched-labels (mapv (comp command-path->label :cmds) matches)
        matched-count (count matched-labels)
        command-cmds (into ["example"] selector)
        examples (->> matches
                      (mapcat (comp normalize-example-lines :examples))
                      vec)
        desc (if (> matched-count 1)
               (str "Show examples for " selector-label " subcommands")
               (str "Show examples for " selector-label))]
    (core/command-entry command-cmds :example desc {}
                        {:examples examples
                         :long-desc (str "Show runnable command examples for selector `"
                                         selector-label
                                         "`." )})))

(defn build-example-entries
  [base-table]
  (->> (selector-definitions base-table)
       (mapv selector-entry)))

(defn resolve-selector
  [base-table selector-cmds]
  (let [targets (phase1-target-entries base-table)
        selector-cmds (vec selector-cmds)
        prefix? (= 1 (count selector-cmds))
        matches (if prefix?
                  (filterv #(= (first selector-cmds)
                               (first (:cmds %)))
                           targets)
                  (filterv #(= selector-cmds (:cmds %))
                           targets))
        missing-example-commands (->> matches
                                      (filter #(empty? (normalize-example-lines (:examples %))))
                                      (mapv (comp command-path->label :cmds)))
        matched-commands (mapv (comp command-path->label :cmds) matches)
        examples (->> matches
                      (mapcat (comp normalize-example-lines :examples))
                      vec)
        selector (command-path->label selector-cmds)]
    {:selector selector
     :matched-commands matched-commands
     :examples examples
     :missing-example-commands missing-example-commands}))

(defn build-action
  [base-table cmds]
  (let [selector-cmds (vec (rest (or cmds [])))
        {:keys [selector matched-commands examples missing-example-commands]}
        (resolve-selector base-table selector-cmds)]
    (cond
      (empty? selector-cmds)
      {:ok? false
       :error {:code :missing-example-selector
               :message "example selector is required"}}

      (empty? matched-commands)
      {:ok? false
       :error {:code :unknown-command
               :message (str "unknown example selector: " selector)}}

      (seq missing-example-commands)
      {:ok? false
       :error {:code :missing-examples
               :message (str "missing examples metadata for: "
                             (string/join ", " missing-example-commands))}}

      :else
      {:ok? true
       :action {:type :example
                :selector selector
                :matched-commands matched-commands
                :examples examples
                :message (str "Found "
                              (cli-humanize/format-count (count examples))
                              " "
                              (cli-humanize/pluralize-noun (count examples) "example")
                              " for selector "
                              selector)}})))

(defn execute-example
  [action _config]
  (p/resolved {:status :ok
               :data (select-keys action [:selector :matched-commands :examples :message])}))
