(ns logseq.cli.command.task-status
  "Runtime task status helpers for graph-derived validation."
  (:require [clojure.string :as string]))

(def status-closed-values-query
  '[:find [?status-ident ...]
    :where
    [?property :db/ident :logseq.property/status]
    [?value :block/closed-value-property ?property]
    [?value :db/ident ?status-ident]])

(defn- status-ident->value
  [ident]
  (when (keyword? ident)
    (let [n (name ident)]
      (when (string/starts-with? n "status.")
        (subs n (count "status."))))))

(defn- normalize-token
  [value]
  (some-> value
          str
          string/trim
          string/lower-case
          (string/replace #"^:+" "")
          (string/replace #"^logseq\.property/status\." "")
          (string/replace #"^status\." "")
          (string/replace #"[\s_]+" "-")))

(defn normalize-available-statuses
  "Normalize db-worker status values into sorted maps of
  `{:ident <kw> :value <string>}` for deterministic matching/output."
  [statuses]
  (->> statuses
       (keep (fn [item]
               (let [ident (cond
                             (keyword? item) item
                             (map? item) (:ident item)
                             :else nil)
                     value (or (when (map? item)
                                 (some-> (:value item) normalize-token))
                               (some-> ident status-ident->value normalize-token))]
                 (when (and ident (seq value))
                   {:ident ident :value value}))))
       (sort-by (juxt :value (comp str :ident)))
       distinct
       vec))

(defn resolve-status-ident
  "Resolve user `status-input` to one of `available-statuses` idents.
  Returns nil when unresolved."
  [status-input available-statuses]
  (let [available-statuses (normalize-available-statuses available-statuses)
        available-idents (set (map :ident available-statuses))
        by-value (into {} (map (juxt :value :ident) available-statuses))
        token (normalize-token status-input)
        ident-from-token (when (seq token)
                           (keyword "logseq.property" (str "status." token)))]
    (or (get by-value token)
        (when (contains? available-idents ident-from-token)
          ident-from-token))))

(defn invalid-status-message
  [status-input available-statuses]
  (let [values (map :value (normalize-available-statuses available-statuses))
        available-text (if (seq values)
                         (string/join ", " values)
                         "(none)")]
    (str "Invalid value for option :status: " status-input
         ". Available values: "
         available-text)))
