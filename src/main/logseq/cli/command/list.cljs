(ns logseq.cli.command.list
  "List-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.task-status :as task-status-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]
            [logseq.db.frontend.property :as db-property]))

(def ^:private list-common-spec
  {:expand {:desc "Include expanded metadata"
            :alias :e
            :coerce :boolean}
   :include-built-in {:coerce :boolean}
   :fields {:desc "Select output fields (comma separated)"
            :alias :f}
   :limit {:desc "Limit results"
           :coerce :long}
   :offset {:desc "Offset results"
            :coerce :long}
   :sort {:desc "Sort field. Default: updated-at"
          :alias :s}
   :order {:desc "Sort order. Default: asc"
           :validate #{"asc" "desc"}}})

(def ^:private default-sort-field "updated-at")

(def ^:private available-task-priority-values
  ["low" "medium" "high" "urgent"])

(def ^:private available-task-priority-values-set
  (set available-task-priority-values))

(def ^:private task-priority-aliases
  {"low" :logseq.property/priority.low
   "medium" :logseq.property/priority.medium
   "high" :logseq.property/priority.high
   "urgent" :logseq.property/priority.urgent})

(defn- invalid-task-priority-message
  [priority-input]
  (let [value (if (map? priority-input)
                (:value priority-input)
                priority-input)]
    (str "Invalid value for option :priority: " value
         ". Available values: "
         (string/join ", " available-task-priority-values))))

(defn- effective-sort-field
  [options]
  (or (:sort options) default-sort-field))

;; Update format/list-page-columns to make field visible
(def ^:private list-page-field-map
  {"id" :db/id
   "ident" :db/ident
   "title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at})

(def ^:private list-page-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:validate (set (keys list-page-field-map))}
    :fields {:multiple-values (keys list-page-field-map)}
    :include-built-in {:desc "Include built-in pages"}
    :include-journal {:desc "Include journal pages"
                      :coerce :boolean}
    :journal-only {:desc "Only journal pages"
                   :coerce :boolean}
    :include-hidden {:desc "Include hidden pages"
                     :coerce :boolean}
    :updated-after {:desc "Filter by updated-at (ISO8601)"}
    :created-after {:desc "Filter by created-at (ISO8601)"}}))

;; Update format/list-tag-columns to make field visible
(def ^:private list-tag-field-map
  {"id" :db/id
   "ident" :db/ident
   "title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at
   "properties" :logseq.property.class/properties
   "extends" :logseq.property.class/extends
   "description" :logseq.property/description})

(def ^:private list-tag-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:validate (set (keys list-tag-field-map))}
    :fields {:multiple-values (keys list-tag-field-map)}
    :include-built-in {:desc "Include built-in tags"}
    :with-properties {:desc "Include tag properties"
                      :coerce :boolean}
    :with-extends {:desc "Include tag extends"
                   :coerce :boolean}}))

;; Update format/list-property-columns to make field visible
(def ^:private list-property-field-map
  {"id" :db/id
   "ident" :db/ident
   "title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at
   "classes" :logseq.property/classes
   "type" :logseq.property/type
   "cardinality" :db/cardinality
   "description" :logseq.property/description})

(def ^:private list-property-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:validate (set (keys list-property-field-map))}
    :fields {:multiple-values (keys list-property-field-map)}
    :include-built-in {:desc "Include built-in properties"}
    :with-classes {:desc "Include property classes"
                   :coerce :boolean}
    :with-type {:desc "Include property type"
                :default true
                :coerce :boolean}}))

(def ^:private list-task-field-map
  {"id" :db/id
   "title" :block/title
   "status" :logseq.property/status
   "priority" :logseq.property/priority
   "scheduled" :logseq.property/scheduled
   "deadline" :logseq.property/deadline
   "updated-at" :block/updated-at
   "created-at" :block/created-at})

(def ^:private list-task-spec
  (merge-with
   merge
   list-common-spec
   {:status {:desc "Filter by task status"
             :values (mapv (comp string/lower-case :value)
                           (db-property/built-in-closed-values :logseq.property/status))}
    :priority {:desc "Filter by task priority"
               :validate {:pred available-task-priority-values-set
                          :ex-msg invalid-task-priority-message}}
    :content {:desc "Filter by task title content"
              :alias :c}
    :sort {:validate (set (keys list-task-field-map))}
    :fields {:multiple-values (keys list-task-field-map)}}))

(def ^:private list-node-field-map
  {"id" :db/id
   "title" :block/title
   "type" :node/type
   "page-id" :block/page-id
   "page-title" :block/page-title
   "created-at" :block/created-at
   "updated-at" :block/updated-at})

(def ^:private list-node-spec
  (merge-with
   merge
   list-common-spec
   {:tags {:desc "Filter by tags (comma separated selectors)"
           ;; Autocomplete first tag until there is comma-delimited tags completion
           :complete :tags}
    :properties {:desc "Filter by properties (comma separated selectors)"
                 :complete :properties}
    :sort {:validate (set (keys list-node-field-map))}
    :fields {:multiple-values (keys list-node-field-map)}}))

(def ^:private list-asset-field-map
  list-node-field-map)

(def ^:private list-asset-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:validate (set (keys list-asset-field-map))}
    :fields {:multiple-values (keys list-asset-field-map)}}))

(def entries
  [(core/command-entry ["list" "page"] :list-page "List pages" list-page-spec
                       {:examples ["logseq list page --graph my-graph"
                                   "logseq list page --graph my-graph --journal-only --limit 20"
                                   "logseq list page --graph my-graph --limit 50 --sort updated-at --order desc"]})
   (core/command-entry ["list" "tag"] :list-tag "List tags" list-tag-spec
                       {:examples ["logseq list tag --graph my-graph --with-properties"
                                   "logseq list tag --graph my-graph --include-built-in --limit 20 --output json"]})
   (core/command-entry ["list" "property"] :list-property "List properties" list-property-spec
                       {:examples ["logseq list property --graph my-graph --with-type"
                                   "logseq list property --graph my-graph --include-built-in --limit 20 --output json"]})
   (core/command-entry ["list" "task"] :list-task "List tasks" list-task-spec
                       {:examples ["logseq list task --graph my-graph --status todo --priority high"
                                   "logseq list task --graph my-graph --content \"release\" --sort updated-at --order desc"]})
   (core/command-entry ["list" "node"] :list-node "List nodes" list-node-spec
                       {:examples ["logseq list node --graph my-graph --tags project,work"
                                   "logseq list node --graph my-graph --properties status,priority --sort updated-at --order desc"]})
   (core/command-entry ["list" "asset"] :list-asset "List assets" list-asset-spec
                       {:examples ["logseq list asset --graph my-graph"
                                   "logseq list asset --graph my-graph --limit 20 --sort updated-at --order desc"]})])

(defn- parse-csv-option
  [value]
  (when (some? value)
    (->> (string/split (str value) #",")
         (map string/trim)
         (remove string/blank?)
         vec)))

(defn- normalize-csv-option
  [value]
  (when-let [values (seq (parse-csv-option value))]
    (string/join "," values)))

(defn normalize-options
  [command opts]
  (if (= command :list-node)
    (cond-> opts
      (contains? opts :tags) (update :tags normalize-csv-option)
      (contains? opts :properties) (update :properties normalize-csv-option))
    opts))

(defn invalid-options?
  [command opts]
  (let [{:keys [include-journal journal-only tags properties]} opts
        tags-specified? (contains? opts :tags)
        properties-specified? (contains? opts :properties)]
    (cond
      (and include-journal journal-only)
      "include-journal and journal-only are mutually exclusive"

      (and (= command :list-node) tags-specified? (not (seq tags)))
      "list node --tags must include at least one non-empty value"

      (and (= command :list-node) properties-specified? (not (seq properties)))
      "list node --properties must include at least one non-empty value"

      (and (= command :list-node)
           (not (seq tags))
           (not (seq properties)))
      "list node requires at least one of --tags or --properties"

      :else
      nil)))

(defn build-action
  [command options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for list"}}
    {:ok? true
     :action {:type command
              :repo repo
              :options options}}))

(defn- parse-field-list
  [fields]
  (when (seq fields)
    (->> (string/split fields #",")
         (map string/trim)
         (remove string/blank?)
         vec)))

(defn- apply-fields
  [items fields field-map]
  (if (seq fields)
    (let [keys (->> fields
                    (map #(get field-map %))
                    (remove nil?)
                    vec)]
      (if (seq keys)
        (mapv #(select-keys % keys) items)
        items))
    items))

(defn- apply-sort
  [items sort-field order field-map]
  (if (seq sort-field)
    (let [sort-key (get field-map sort-field)
          sorted (if sort-key
                   (sort-by (fn [item]
                              [(get item sort-key) (:db/id item)])
                            items)
                   items)
          sorted (if (= "desc" order) (reverse sorted) sorted)]
      (vec sorted))
    (vec items)))

(defn- apply-offset-limit
  [items offset limit]
  (cond-> items
    (some? offset) (->> (drop offset) vec)
    (some? limit) (->> (take limit) vec)))

(defn- prepare-tag-item
  [item {:keys [with-properties with-extends fields]}]
  (cond-> item
    (not with-properties) (dissoc :logseq.property.class/properties)
    (not with-extends) (dissoc :logseq.property.class/extends)
    (not (string/includes? (str fields) "description")) (dissoc :logseq.property/description)))

(defn- prepare-property-item
  [item {:keys [with-classes with-type fields]}]
  (cond-> item
    (not with-classes) (dissoc :logseq.property/classes)
    (not with-type) (dissoc :logseq.property/type)
    (not (string/includes? (str fields) "description")) (dissoc :logseq.property/description)))

(defn execute-list-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg :thread-api/cli-list-pages false
                                      [(:repo action) options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              sorted (apply-sort items sort-field order list-page-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-page-field-map)]
        {:status :ok
         :data {:items final}})))

(defn execute-list-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (cond-> (:options action)
                        ((some-fn :with-extends :with-properties) (:options action))
                        (assoc :expand true))
              items (transport/invoke cfg :thread-api/cli-list-tags false
                                      [(:repo action) options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-tag-item % options) items)
              sorted (apply-sort prepared sort-field order list-tag-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-tag-field-map)]
        {:status :ok
         :data {:items final}})))

(defn execute-list-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (cond-> (:options action)
                        (:with-classes (:options action)) (assoc :expand true))
              items (transport/invoke cfg :thread-api/cli-list-properties false
                                      [(:repo action) options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-property-item % options) items)
              sorted (apply-sort prepared sort-field order list-property-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-property-field-map)]
        {:status :ok
         :data {:items final}})))

(defn- parse-selector-token
  [token]
  (let [text (some-> token str string/trim)]
    (cond
      (not (seq text)) nil
      (re-matches #"^-?\d+$" text) (js/parseInt text 10)
      (common-util/uuid-string? text) (uuid text)
      (common-util/valid-edn-keyword? text)
      (let [value (common-util/safe-read-string {:log-error? false} text)]
        (if (keyword? value) value text))
      :else text)))

(defn- parse-selector-csv
  [value]
  (->> (parse-csv-option value)
       (map parse-selector-token)
       (remove nil?)
       vec))

(defn- resolve-tag-ids
  [config repo tags-csv]
  (let [selectors (parse-selector-csv tags-csv)]
    (if (seq selectors)
      (p/let [entities (add-command/resolve-tags config repo selectors)]
        (mapv :db/id entities))
      (p/resolved nil))))

(defn- resolve-property-idents
  [config repo properties-csv]
  (let [selectors (parse-selector-csv properties-csv)]
    (if (seq selectors)
      (add-command/resolve-property-identifiers config repo selectors {:allow-non-built-in? true})
      (p/resolved nil))))

(defn execute-list-node
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              tag-ids (resolve-tag-ids cfg (:repo action) (:tags options))
              property-idents (resolve-property-idents cfg (:repo action) (:properties options))
              worker-options (cond-> (dissoc options :tags :properties)
                               (seq tag-ids) (assoc :tag-ids tag-ids)
                               (seq property-idents) (assoc :property-idents property-idents))
              items (transport/invoke cfg :thread-api/cli-list-nodes false
                                      [(:repo action) worker-options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              sorted (apply-sort items sort-field order list-node-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-node-field-map)]
        {:status :ok
         :data {:items final}})))

(def ^:private asset-tag-ident
  :logseq.class/Asset)

(defn- ensure-asset-tag-id!
  [config repo]
  (p/let [entity (transport/invoke config :thread-api/pull false
                                   [repo [:db/id] [:db/ident asset-tag-ident]])]
    (if-let [tag-id (:db/id entity)]
      tag-id
      (throw (ex-info "asset tag not found"
                      {:code :asset-tag-not-found})))))

(defn execute-list-asset
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              asset-tag-id (ensure-asset-tag-id! cfg (:repo action))
              worker-options (assoc options :tag-ids [asset-tag-id])
              items (transport/invoke cfg :thread-api/cli-list-nodes false
                                      [(:repo action) worker-options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              sorted (apply-sort items sort-field order list-asset-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-asset-field-map)]
        {:status :ok
         :data {:items final}})))

(defn- normalize-priority
  [value]
  (let [text (some-> value string/trim string/lower-case)]
    (when (seq text)
      (get task-priority-aliases text))))

(defn execute-list-task
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              status-input (some-> (:status options) string/trim)
              available-statuses (when (seq status-input)
                                   (transport/invoke cfg :thread-api/q false
                                                     [(:repo action)
                                                      [task-status-command/status-closed-values-query]]))
              resolved-status (when (seq status-input)
                                (task-status-command/resolve-status-ident status-input available-statuses))]
        (if (and (seq status-input) (not resolved-status))
          {:status :error
           :error {:code :invalid-options
                   :message (task-status-command/invalid-status-message status-input available-statuses)}}
          (let [normalized-options (cond-> options
                                     resolved-status
                                     (assoc :status resolved-status)
                                     (seq (some-> (:priority options) string/trim))
                                     (assoc :priority (normalize-priority (:priority options))))]
            (p/let [items (transport/invoke cfg :thread-api/cli-list-tasks false
                                            [(:repo action) normalized-options])
                    sort-field (effective-sort-field normalized-options)
                    order (or (:order normalized-options) "asc")
                    fields (parse-field-list (:fields normalized-options))
                    sorted (apply-sort items sort-field order list-task-field-map)
                    limited (apply-offset-limit sorted (:offset normalized-options) (:limit normalized-options))
                    final (apply-fields limited fields list-task-field-map)]
              {:status :ok
               :data {:items final}}))))))
