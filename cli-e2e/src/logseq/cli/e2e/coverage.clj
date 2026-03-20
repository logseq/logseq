(ns logseq.cli.e2e.coverage
  (:require [clojure.set :as set]
            [clojure.string :as string]))

(defn- normalize-commands
  [commands]
  (->> commands
       (map str)
       (remove string/blank?)
       distinct
       sort
       vec))

(defn- normalize-options
  [options]
  (->> options
       (map str)
       (remove string/blank?)
       distinct
       sort
       vec))

(defn- excluded-command?
  [excluded-prefixes command]
  (let [head (first (string/split (str command) #" "))]
    (contains? (set excluded-prefixes) head)))

(defn validate-inventory!
  [{:keys [excluded-command-prefixes scopes] :as inventory}]
  (let [invalid-commands (->> scopes
                              vals
                              (mapcat :commands)
                              (filter #(excluded-command? excluded-command-prefixes %))
                              normalize-commands)
        invalid-scopes (->> scopes
                            (keep (fn [[scope {:keys [commands]}]]
                                    (when (some #(excluded-command? excluded-command-prefixes %) commands)
                                      scope)))
                            sort
                            vec)]
    (when (seq invalid-commands)
      (throw (ex-info "Excluded commands cannot appear in cli-e2e inventory"
                      {:invalid-commands invalid-commands
                       :invalid-scopes invalid-scopes
                       :inventory inventory})))
    inventory))

(defn validate-cases!
  [{:keys [excluded-command-prefixes] :as inventory} cases]
  (let [invalid-cases (->> cases
                           (filter (fn [{:keys [covers]}]
                                     (some #(excluded-command? excluded-command-prefixes %)
                                           (get covers :commands []))))
                           (mapv :id))]
    (when (seq invalid-cases)
      (throw (ex-info "Excluded commands cannot be covered by cli-e2e cases"
                      {:invalid-case-ids invalid-cases
                       :inventory inventory})))
    cases))

(defn command->scope
  [{:keys [scopes]}]
  (into {}
        (mapcat (fn [[scope {:keys [commands]}]]
                  (map (fn [command]
                         [command scope])
                       commands)))
        scopes))

(defn required-commands
  [{:keys [scopes]}]
  (->> scopes
       vals
       (mapcat :commands)
       normalize-commands))

(defn covered-commands
  [cases]
  (->> cases
       (mapcat #(get-in % [:covers :commands]))
       normalize-commands))

(defn required-options-by-scope
  [{:keys [scopes]}]
  (into {}
        (map (fn [[scope {:keys [options]}]]
               [scope (normalize-options options)]))
        scopes))

(defn covered-options-by-scope
  [cases]
  (reduce (fn [acc {:keys [covers]}]
            (reduce-kv (fn [acc' scope options]
                         (update acc' scope (fnil into #{}) options))
                       acc
                       (get covers :options {})))
          {}
          cases))

(defn coverage-report
  [inventory cases]
  (validate-inventory! inventory)
  (validate-cases! inventory cases)
  (let [required-commands* (set (required-commands inventory))
        covered-commands* (set (covered-commands cases))
        covered-options* (covered-options-by-scope cases)
        required-options* (required-options-by-scope inventory)]
    {:missing-commands (->> (set/difference required-commands* covered-commands*)
                            normalize-commands)
     :missing-options (into {}
                            (map (fn [[scope options]]
                                   [scope (->> (set/difference (set options)
                                                               (get covered-options* scope #{}))
                                               normalize-options)]))
                            required-options*)}))

(defn complete?
  [{:keys [missing-commands missing-options]}]
  (and (empty? missing-commands)
       (every? empty? (vals missing-options))))
