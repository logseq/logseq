(ns logseq.cli.commands
  "Command parsing and action building for the Logseq CLI."
  (:require ["fs" :as fs]
            [babashka.cli :as cli]
            [cljs-time.coerce :as tc]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [promesa.core :as p]))

(def ^:private global-spec
  {:help {:alias :h
          :desc "Show help"
          :coerce :boolean}
   :config {:desc "Path to cli.edn"}
   :auth-token {:desc "Auth token for db-worker-node"}
   :repo {:desc "Graph name"}
   :data-dir {:desc "Path to db-worker data dir"}
   :timeout-ms {:desc "Request timeout in ms"
                :coerce :long}
   :retries {:desc "Retry count for requests"
             :coerce :long}
   :output {:desc "Output format (human, json, edn)"}})

(def ^:private server-spec
  {:repo {:desc "Graph name"}})

(def ^:private content-add-spec
  {:content {:desc "Block content for add"}
   :blocks {:desc "EDN vector of blocks for add"}
   :blocks-file {:desc "EDN file of blocks for add"}
   :page {:desc "Page name"}
   :parent {:desc "Parent block UUID for add"}})

(def ^:private add-page-spec
  {:page {:desc "Page name"}})

(def ^:private remove-block-spec
  {:block {:desc "Block UUID"}})

(def ^:private remove-page-spec
  {:page {:desc "Page name"}})

(def ^:private list-common-spec
  {:expand {:desc "Include expanded metadata"
            :coerce :boolean}
   :limit {:desc "Limit results"
           :coerce :long}
   :offset {:desc "Offset results"
            :coerce :long}
   :sort {:desc "Sort field"}
   :order {:desc "Sort order (asc, desc)"}})

(def ^:private list-page-spec
  (merge list-common-spec
         {:include-journal {:desc "Include journal pages"
                            :coerce :boolean}
          :journal-only {:desc "Only journal pages"
                         :coerce :boolean}
          :include-hidden {:desc "Include hidden pages"
                           :coerce :boolean}
          :updated-after {:desc "Filter by updated-at (ISO8601)"}
          :created-after {:desc "Filter by created-at (ISO8601)"}
          :fields {:desc "Select output fields (comma separated)"}}))

(def ^:private list-tag-spec
  (merge list-common-spec
         {:include-built-in {:desc "Include built-in tags"
                             :coerce :boolean}
          :with-properties {:desc "Include tag properties"
                            :coerce :boolean}
          :with-extends {:desc "Include tag extends"
                         :coerce :boolean}
          :fields {:desc "Select output fields (comma separated)"}}))

(def ^:private list-property-spec
  (merge list-common-spec
         {:include-built-in {:desc "Include built-in properties"
                             :coerce :boolean}
          :with-classes {:desc "Include property classes"
                         :coerce :boolean}
          :with-type {:desc "Include property type"
                      :coerce :boolean}
          :fields {:desc "Select output fields (comma separated)"}}))

(def ^:private search-spec
  {:text {:desc "Search text"}
   :type {:desc "Search types (page, block, tag, property, all)"}
   :tag {:desc "Restrict to a specific tag"}
   :limit {:desc "Limit results"
           :coerce :long}
   :case-sensitive {:desc "Case sensitive search"
                    :coerce :boolean}
   :include-content {:desc "Search block content"
                     :coerce :boolean}
   :sort {:desc "Sort field (updated-at, created-at)"}
   :order {:desc "Sort order (asc, desc)"}})

(def ^:private show-spec
  {:id {:desc "Block db/id"
        :coerce :long}
   :uuid {:desc "Block UUID"}
   :page-name {:desc "Page name"}
   :level {:desc "Limit tree depth"
           :coerce :long}
   :format {:desc "Output format (text, json, edn)"}})

(defn- format-commands
  [table]
  (let [rows (->> table
                  (filter (comp seq :cmds))
                  (map (fn [{:keys [cmds desc spec]}]
                         (let [command (str (string/join " " cmds)
                                            (when (seq spec) " [options]"))]
                           {:command command
                            :desc desc}))))
        width (apply max 0 (map (comp count :command) rows))]
    (->> rows
         (map (fn [{:keys [command desc]}]
                (let [padding (apply str (repeat (- width (count command)) " "))]
                  (cond-> (str "  " command padding)
                    (seq desc) (str "  " desc)))))
         (string/join "\n"))))

(defn- group-summary
  [group table]
  (let [group-table (filter #(= group (first (:cmds %))) table)]
    (string/join "\n"
                 [(str "Usage: logseq " group " <subcommand> [options]")
                  ""
                  "Subcommands:"
                  (format-commands group-table)
                  ""
                  "Global options:"
                  (cli/format-opts {:spec global-spec})
                  ""
                  "Command options:"
                  (str "  See `logseq " group " <subcommand> --help`")])))

(defn- top-level-summary
  [table]
  (let [groups [{:title "Graph Inspect and Edit"
                 :commands #{"list" "add" "remove" "search" "show"}}
                {:title "Graph Management"
                 :commands #{"graph" "server"}}]
        render-group (fn [{:keys [title commands]}]
                       (let [entries (filter #(contains? commands (first (:cmds %))) table)]
                         (string/join "\n" [title (format-commands entries)])))]
    (string/join "\n"
                 ["Usage: logseq <command> [options]"
                  ""
                  "Commands:"
                  (string/join "\n\n" (map render-group groups))
                  ""
                  "Global options:"
                  (cli/format-opts {:spec global-spec})
                  ""
                  "Command options:"
                  "  See `logseq <command> --help`"])))

(defn- command-summary
  [{:keys [cmds spec]}]
  (let [command-spec (apply dissoc spec (keys global-spec))]
    (string/join "\n"
                 [(str "Usage: logseq " (string/join " " cmds) " [options]")
                  ""
                  "Global options:"
                  (cli/format-opts {:spec global-spec})
                  ""
                  "Command options:"
                  (cli/format-opts {:spec command-spec})])))

(defn- merge-spec
  [spec]
  (merge global-spec (or spec {})))

(defn- normalize-opts
  [opts]
  (cond-> opts
    (:config opts) (-> (assoc :config-path (:config opts))
                       (dissoc :config))))

(defn- ok-result
  [command opts args summary]
  {:ok? true
   :command command
   :options (normalize-opts opts)
   :args (vec args)
   :summary summary})

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

(defn- missing-page-name-result
  [summary]
  {:ok? false
   :error {:code :missing-page-name
           :message "page name is required"}
   :summary summary})

(defn- missing-search-result
  [summary]
  {:ok? false
   :error {:code :missing-search-text
           :message "search text is required"}
   :summary summary})

(defn- help-result
  [summary]
  {:ok? false
   :help? true
   :summary summary})

(defn- invalid-options-result
  [summary message]
  {:ok? false
   :error {:code :invalid-options
           :message message}
   :summary summary})

(defn- unknown-command-result
  [summary message]
  {:ok? false
   :error {:code :unknown-command
           :message message}
   :summary summary})

(def ^:private list-sort-fields
  {:list-page #{"title" "created-at" "updated-at"}
   :list-tag #{"name" "title"}
   :list-property #{"name" "title"}})

(def ^:private show-formats
  #{"text" "json" "edn"})

(def ^:private search-types
  #{"page" "block" "tag" "property" "all"})

(defn- invalid-list-options?
  [command opts]
  (let [{:keys [order include-journal journal-only]} opts
        sort-field (:sort opts)
        allowed (get list-sort-fields command)]
    (cond
      (and include-journal journal-only)
      "include-journal and journal-only are mutually exclusive"

      (and (seq sort-field) (not (contains? allowed sort-field)))
      (str "invalid sort field: " sort-field)

      (and (seq order) (not (#{"asc" "desc"} order)))
      (str "invalid order: " order)

      :else
      nil)))

(defn- invalid-show-options?
  [opts]
  (let [format (:format opts)
        level (:level opts)]
    (cond
      (and (seq format) (not (contains? show-formats (string/lower-case format))))
      (str "invalid format: " format)

      (and (some? level) (< level 1))
      "level must be >= 1"

      :else
      nil)))

(defn- invalid-search-options?
  [opts]
  (let [type (:type opts)
        order (:order opts)
        sort-field (:sort opts)]
    (cond
      (and (seq type) (not (contains? search-types type)))
      (str "invalid type: " type)

      (and (seq sort-field) (not (#{"updated-at" "created-at"} sort-field)))
      (str "invalid sort field: " sort-field)

      (and (seq order) (not (#{"asc" "desc"} order)))
      (str "invalid order: " order)

      :else
      nil)))

(defn- command-entry
  [cmds command desc spec]
  (let [spec* (merge-spec spec)]
    {:cmds cmds
     :desc desc
     :spec spec*
     :restrict true
     :fn (fn [{:keys [opts args]}]
           {:command command
            :cmds cmds
            :spec spec*
            :opts opts
            :args args})}))

(def ^:private table
  [(command-entry ["graph" "list"] :graph-list "List graphs" {})
   (command-entry ["graph" "create"] :graph-create "Create graph" {})
   (command-entry ["graph" "switch"] :graph-switch "Switch current graph" {})
   (command-entry ["graph" "remove"] :graph-remove "Remove graph" {})
   (command-entry ["graph" "validate"] :graph-validate "Validate graph" {})
   (command-entry ["graph" "info"] :graph-info "Graph metadata" {})
   (command-entry ["server" "list"] :server-list "List db-worker-node servers" {})
   (command-entry ["server" "status"] :server-status "Show server status for a graph" server-spec)
   (command-entry ["server" "start"] :server-start "Start db-worker-node for a graph" server-spec)
   (command-entry ["server" "stop"] :server-stop "Stop db-worker-node for a graph" server-spec)
   (command-entry ["server" "restart"] :server-restart "Restart db-worker-node for a graph" server-spec)
   (command-entry ["list" "page"] :list-page "List pages" list-page-spec)
   (command-entry ["list" "tag"] :list-tag "List tags" list-tag-spec)
   (command-entry ["list" "property"] :list-property "List properties" list-property-spec)
   (command-entry ["add" "block"] :add-block "Add blocks" content-add-spec)
   (command-entry ["add" "page"] :add-page "Create page" add-page-spec)
   (command-entry ["remove" "block"] :remove-block "Remove block" remove-block-spec)
   (command-entry ["remove" "page"] :remove-page "Remove page" remove-page-spec)
   (command-entry ["search"] :search "Search graph" search-spec)
   (command-entry ["show"] :show "Show tree" show-spec)])

(def ^:private global-aliases
  (->> global-spec
       (keep (fn [[k {:keys [alias]}]]
               (when alias
                 [alias k])))
       (into {})))

(def ^:private global-flag-options
  (->> global-spec
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

(defn- parse-leading-global-opts
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

(defn- unknown-command-message
  [{:keys [dispatch wrong-input]}]
  (string/join " " (cond-> (vec dispatch)
                     wrong-input (conj wrong-input))))

(defn- finalize-command
  [summary {:keys [command opts args cmds spec]}]
  (let [opts (normalize-opts opts)
        args (vec args)
        cmd-summary (command-summary {:cmds cmds :spec spec})
        graph (:repo opts)
        has-args? (seq args)
        has-content? (or (seq (:content opts))
                         (seq (:blocks opts))
                         (seq (:blocks-file opts))
                         has-args?)
        show-targets (filter some? [(:id opts) (:uuid opts) (:page-name opts)])]
    (cond
      (:help opts)
      (help-result cmd-summary)

      (and (#{:graph-create :graph-switch :graph-remove :graph-validate} command)
           (not (seq graph)))
      (missing-graph-result summary)

      (and (= command :add-block) (not has-content?))
      (missing-content-result summary)

      (and (= command :add-page) (not (seq (:page opts))))
      (missing-page-name-result summary)

      (and (= command :remove-block) (not (seq (:block opts))))
      (missing-target-result summary)

      (and (= command :remove-page) (not (seq (:page opts))))
      (missing-target-result summary)

      (and (= command :show) (empty? show-targets))
      (missing-target-result summary)

      (and (= command :show) (> (count show-targets) 1))
      (invalid-options-result summary "only one of --id, --uuid, or --page-name is allowed")

      (and (= command :search) (not (or (seq (:text opts)) has-args?)))
      (missing-search-result summary)

      (and (#{:list-page :list-tag :list-property} command)
           (invalid-list-options? command opts))
      (invalid-options-result summary (invalid-list-options? command opts))

      (and (= command :show) (invalid-show-options? opts))
      (invalid-options-result summary (invalid-show-options? opts))

      (and (= command :search) (invalid-search-options? opts))
      (invalid-options-result summary (invalid-search-options? opts))

      (and (#{:server-status :server-start :server-stop :server-restart} command)
           (not (seq (:repo opts))))
      (missing-repo-result summary)

      :else
      (ok-result command opts args summary))))

(defn- cli-error->result
  [summary {:keys [msg]}]
  (invalid-options-result summary (or msg "invalid options")))

(defn parse-args
  [raw-args]
  (let [summary (top-level-summary table)
        {:keys [opts args]} (parse-leading-global-opts raw-args)]
    (if (empty? args)
      (if (:help opts)
        (help-result summary)
        {:ok? false
         :error {:code :missing-command
                 :message "missing command"}
         :summary summary})
      (if (and (= 1 (count args)) (#{"graph" "server" "list" "add" "remove"} (first args)))
        (help-result (group-summary (first args) table))
        (try
          (let [result (cli/dispatch table args {:spec global-spec})]
            (if (nil? result)
              (unknown-command-result summary (str "unknown command: " (string/join " " args)))
              (finalize-command summary (update result :opts #(merge opts (or % {}))))))
          (catch :default e
            (let [{:keys [cause] :as data} (ex-data e)]
              (cond
                (= cause :input-exhausted)
                (if (:help opts)
                  (help-result summary)
                  {:ok? false
                   :error {:code :missing-command
                           :message "missing command"}
                   :summary summary})

                (= cause :no-match)
                (unknown-command-result summary (str "unknown command: " (unknown-command-message data)))

                (some? data)
                (cli-error->result summary data)

                :else
                (unknown-command-result summary (str "unknown command: " (string/join " " args)))))))))))

(defn- graph->repo
  [graph]
  (when (seq graph)
    (if (string/starts-with? graph common-config/db-version-prefix)
      graph
      (str common-config/db-version-prefix graph))))

(defn- repo->graph
  [repo]
  (when (seq repo)
    (string/replace-first repo common-config/db-version-prefix "")))

(defn- ensure-existing-graph
  [action config]
  (if (and (:repo action) (not (:allow-missing-graph action)))
    (p/let [graphs (cli-server/list-graphs config)
            graph (repo->graph (:repo action))]
      (if (some #(= graph %) graphs)
        {:ok? true}
        {:ok? false
         :error {:code :graph-not-exists
                 :message "graph not exists"}}))
    (p/resolved {:ok? true})))

(defn- pick-graph
  [options command-args config]
  (or (:repo options)
      (first command-args)
      (:repo config)))

(defn- read-blocks
  [options command-args]
  (cond
    (seq (:blocks options))
    {:ok? true :value (reader/read-string (:blocks options))}

    (seq (:blocks-file options))
    (let [contents (.toString (fs/readFileSync (:blocks-file options)) "utf8")]
      {:ok? true :value (reader/read-string contents)})

    (seq (:content options))
    {:ok? true :value [{:block/title (:content options)}]}

    (seq command-args)
    {:ok? true :value [{:block/title (string/join " " command-args)}]}

    :else
    {:ok? false
     :error {:code :missing-content
             :message "content is required"}}))

(defn- ensure-blocks
  [value]
  (if (vector? value)
    {:ok? true :value value}
    {:ok? false
     :error {:code :invalid-blocks
             :message "blocks must be a vector"}}))

(defn- today-page-title
  [config repo]
  (p/let [journal (transport/invoke config "thread-api/pull" false
                                    [repo [:logseq.property.journal/title-format] :logseq.class/Journal])
          formatter (or (:logseq.property.journal/title-format journal) "MMM do, yyyy")
          now (tc/from-date (js/Date.))]
    (date-time-util/format now formatter)))

(defn- ensure-page!
  [config repo page-name]
  (p/let [page (transport/invoke config "thread-api/pull" false
                                 [repo [:db/id :block/uuid :block/name :block/title] [:block/name page-name]])]
    (if (:db/id page)
      page
      (p/let [_ (transport/invoke config "thread-api/apply-outliner-ops" false
                                  [repo [[:create-page [page-name {}]]] {}])]
        (transport/invoke config "thread-api/pull" false
                          [repo [:db/id :block/uuid :block/name :block/title] [:block/name page-name]])))))

(defn- resolve-add-target
  [config {:keys [repo page parent]}]
  (if (seq parent)
    (if-not (common-util/uuid-string? parent)
      (p/rejected (ex-info "parent must be a uuid" {:code :invalid-parent}))
      (p/let [block (transport/invoke config "thread-api/pull" false
                                      [repo [:db/id :block/uuid :block/title] [:block/uuid (uuid parent)]])]
        (if-let [id (:db/id block)]
          id
          (throw (ex-info "parent block not found" {:code :parent-not-found})))))
    (p/let [page-name (if (seq page) page (today-page-title config repo))
            page-entity (ensure-page! config repo page-name)]
      (or (:db/id page-entity)
          (throw (ex-info "page not found" {:code :page-not-found}))))))

(defn- perform-remove
  [config {:keys [repo block page]}]
  (cond
    (seq block)
    (if-not (common-util/uuid-string? block)
      (p/rejected (ex-info "block must be a uuid" {:code :invalid-block}))
      (p/let [entity (transport/invoke config "thread-api/pull" false
                                       [repo [:db/id :block/uuid] [:block/uuid (uuid block)]])]
        (if-let [id (:db/id entity)]
          (transport/invoke config "thread-api/apply-outliner-ops" false
                            [repo [[:delete-blocks [[id] {}]]] {}])
          (throw (ex-info "block not found" {:code :block-not-found})))))

    (seq page)
    (p/let [entity (transport/invoke config "thread-api/pull" false
                                     [repo [:db/id :block/uuid] [:block/name page]])]
      (if-let [page-uuid (:block/uuid entity)]
        (transport/invoke config "thread-api/apply-outliner-ops" false
                          [repo [[:delete-page [page-uuid]]] {}])
        (throw (ex-info "page not found" {:code :page-not-found}))))

    :else
    (p/rejected (ex-info "block or page required" {:code :missing-target}))))

(def ^:private tree-block-selector
  [:db/id :block/uuid :block/title :block/order {:block/parent [:db/id]}])

(defn- fetch-blocks-for-page
  [config repo page-id]
  (let [query [:find (list 'pull '?b tree-block-selector)
               :in '$ '?page-id
               :where ['?b :block/page '?page-id]]]
    (p/let [rows (transport/invoke config "thread-api/q" false [repo [query page-id]])]
      (mapv first rows))))

(defn- build-tree
  [blocks root-id max-depth]
  (let [parent->children (group-by #(get-in % [:block/parent :db/id]) blocks)
        sort-children (fn [children]
                        (vec (sort-by :block/order children)))
        build (fn build [parent-id depth]
                (mapv (fn [b]
                        (let [children (build (:db/id b) (inc depth))]
                          (cond-> b
                            (seq children) (assoc :block/children children))))
                      (if (and max-depth (>= depth max-depth))
                        []
                        (sort-children (get parent->children parent-id)))))]
    (build root-id 1)))

(defn- fetch-tree
  [config {:keys [repo id page-name level] :as opts}]
  (let [max-depth (or level 10)
        uuid-str (:uuid opts)]
    (cond
      (some? id)
      (p/let [entity (transport/invoke config "thread-api/pull" false
                                       [repo [:db/id :block/name :block/uuid :block/title {:block/page [:db/id :block/title]}] id])]
        (if-let [page-id (get-in entity [:block/page :db/id])]
          (p/let [blocks (fetch-blocks-for-page config repo page-id)
                  children (build-tree blocks (:db/id entity) max-depth)]
            {:root (assoc entity :block/children children)})
          (if (:db/id entity)
            (p/let [blocks (fetch-blocks-for-page config repo (:db/id entity))
                    children (build-tree blocks (:db/id entity) max-depth)]
              {:root (assoc entity :block/children children)})
            (throw (ex-info "block not found" {:code :block-not-found})))))

      (seq uuid-str)
      (if-not (common-util/uuid-string? uuid-str)
        (p/rejected (ex-info "block must be a uuid" {:code :invalid-block}))
        (p/let [entity (transport/invoke config "thread-api/pull" false
                                         [repo [:db/id :block/name :block/uuid :block/title {:block/page [:db/id :block/title]}]
                                          [:block/uuid (uuid uuid-str)]])
                entity (if (:db/id entity)
                         entity
                         (transport/invoke config "thread-api/pull" false
                                           [repo [:db/id :block/name :block/uuid :block/title {:block/page [:db/id :block/title]}]
                                            [:block/uuid uuid-str]]))]
          (if-let [page-id (get-in entity [:block/page :db/id])]
            (p/let [blocks (fetch-blocks-for-page config repo page-id)
                    children (build-tree blocks (:db/id entity) max-depth)]
              {:root (assoc entity :block/children children)})
            (if (:db/id entity)
              (p/let [blocks (fetch-blocks-for-page config repo (:db/id entity))
                      children (build-tree blocks (:db/id entity) max-depth)]
                {:root (assoc entity :block/children children)})
              (throw (ex-info "block not found" {:code :block-not-found}))))))

      (seq page-name)
      (p/let [page-entity (transport/invoke config "thread-api/pull" false
                                            [repo [:db/id :block/uuid :block/title] [:block/name page-name]])]
        (if-let [page-id (:db/id page-entity)]
          (p/let [blocks (fetch-blocks-for-page config repo page-id)
                  children (build-tree blocks page-id max-depth)]
            {:root (assoc page-entity :block/children children)})
          (throw (ex-info "page not found" {:code :page-not-found}))))

      :else
      (p/rejected (ex-info "block or page required" {:code :missing-target})))))

(defn- tree->text
  [{:keys [root]}]
  (let [title (or (:block/title root) (:block/name root) (str (:block/uuid root)))
        lines (atom [title])
        walk (fn walk [node depth]
               (doseq [child (:block/children node)]
                 (let [prefix (apply str (repeat depth "  "))
                       label (or (:block/title child) (:block/name child) (str (:block/uuid child)))]
                   (swap! lines conj (str prefix "- " label)))
                 (walk child (inc depth))))]
    (walk root 1)
    (string/join "\n" @lines)))

(defn- resolve-repo
  [graph]
  (let [graph (some-> graph string/trim)]
    (when (seq graph)
      (graph->repo graph))))

(defn- missing-graph-error
  []
  {:ok? false
   :error {:code :missing-graph
           :message "graph name is required"}})

(defn- missing-repo-error
  [message]
  {:ok? false
   :error {:code :missing-repo
           :message message}})

(def ^:private list-page-field-map
  {"title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at})

(def ^:private list-tag-field-map
  {"name" :block/title
   "title" :block/title
   "uuid" :block/uuid
   "properties" :logseq.property.class/properties
   "extends" :logseq.property.class/extends
   "description" :logseq.property/description})

(def ^:private list-property-field-map
  {"name" :block/title
   "title" :block/title
   "uuid" :block/uuid
   "classes" :logseq.property/classes
   "type" :logseq.property/type
   "description" :logseq.property/description})

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
                   (sort-by #(get % sort-key) items)
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
  [item {:keys [expand with-properties with-extends]}]
  (if expand
    (cond-> item
      (not with-properties) (dissoc :logseq.property.class/properties)
      (not with-extends) (dissoc :logseq.property.class/extends))
    item))

(defn- prepare-property-item
  [item {:keys [expand with-classes with-type]}]
  (if expand
    (cond-> item
      (not with-classes) (dissoc :logseq.property/classes)
      (not with-type) (dissoc :logseq.property/type))
    item))

(defn- build-graph-action
  [command graph repo]
  (case command
    :graph-list
    {:ok? true
     :action {:type :graph-list
              :command :graph-list}}

    :graph-create
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :command :graph-create
                :method "thread-api/create-or-open-db"
                :direct-pass? false
                :args [repo {}]
                :repo repo
                :graph (repo->graph repo)
                :allow-missing-graph true
                :persist-repo (repo->graph repo)}})

    :graph-switch
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-switch
                :command :graph-switch
                :repo repo
                :graph (repo->graph repo)}})

    :graph-remove
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :command :graph-remove
                :method "thread-api/unsafe-unlink-db"
                :direct-pass? false
                :args [repo]
                :repo repo
                :graph (repo->graph repo)}})

    :graph-validate
    (if-not (seq repo)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :command :graph-validate
                :method "thread-api/validate-db"
                :direct-pass? false
                :args [repo]
                :repo repo
                :graph (repo->graph repo)}})

    :graph-info
    (if-not (seq repo)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-info
                :command :graph-info
                :repo repo
                :graph (repo->graph repo)}})))

(defn- build-server-action
  [command repo]
  (case command
    :server-list
    {:ok? true
     :action {:type :server-list}}

    :server-status
    (if-not (seq repo)
      (missing-repo-error "repo is required for server status")
      {:ok? true
       :action {:type :server-status
                :repo repo}})

    :server-start
    (if-not (seq repo)
      (missing-repo-error "repo is required for server start")
      {:ok? true
       :action {:type :server-start
                :repo repo}})

    :server-stop
    (if-not (seq repo)
      (missing-repo-error "repo is required for server stop")
      {:ok? true
       :action {:type :server-stop
                :repo repo}})

    :server-restart
    (if-not (seq repo)
      (missing-repo-error "repo is required for server restart")
      {:ok? true
       :action {:type :server-restart
                :repo repo}})

    {:ok? false
     :error {:code :unknown-command
             :message (str "unknown server command: " command)}}))

(defn- build-add-block-action
  [options args repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for add")
    (let [blocks-result (read-blocks options args)]
      (if-not (:ok? blocks-result)
        blocks-result
        (let [vector-result (ensure-blocks (:value blocks-result))]
          (if-not (:ok? vector-result)
            vector-result
            {:ok? true
             :action {:type :add-block
                      :repo repo
                      :graph (repo->graph repo)
                      :page (:page options)
                      :parent (:parent options)
                      :blocks (:value vector-result)}}))))))

(defn- build-add-page-action
  [options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for add")
    (let [page (some-> (:page options) string/trim)]
      (if (seq page)
        {:ok? true
         :action {:type :add-page
                  :repo repo
                  :graph (repo->graph repo)
                  :page page}}
        {:ok? false
         :error {:code :missing-page-name
                 :message "page name is required"}}))))

(defn- build-remove-block-action
  [options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for remove")
    (let [block (some-> (:block options) string/trim)]
      (if (seq block)
        {:ok? true
         :action {:type :remove-block
                  :repo repo
                  :block block}}
        {:ok? false
         :error {:code :missing-target
                 :message "block is required"}}))))

(defn- build-remove-page-action
  [options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for remove")
    (let [page (some-> (:page options) string/trim)]
      (if (seq page)
        {:ok? true
         :action {:type :remove-page
                  :repo repo
                  :page page}}
        {:ok? false
         :error {:code :missing-target
                 :message "page is required"}}))))

(defn- build-list-action
  [command options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for list")
    {:ok? true
     :action {:type command
              :repo repo
              :options options}}))

(defn- build-search-action
  [options args repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for search")
    (let [text (or (:text options) (string/join " " args))]
      (if (seq text)
        {:ok? true
         :action {:type :search
                  :repo repo
                  :text text
                  :search-type (:type options)
                  :tag (:tag options)
                  :limit (:limit options)
                  :case-sensitive (:case-sensitive options)
                  :include-content (:include-content options)
                  :sort (:sort options)
                  :order (:order options)}}
        {:ok? false
         :error {:code :missing-search-text
                 :message "search text is required"}}))))

(defn- build-show-action
  [options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for show")
    (let [format (some-> (:format options) string/lower-case)
          targets (filter some? [(:id options) (:uuid options) (:page-name options)])]
      (if (empty? targets)
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}
        {:ok? true
         :action {:type :show
                  :repo repo
                  :id (:id options)
                  :uuid (:uuid options)
                  :page-name (:page-name options)
                  :level (:level options)
                  :format format}}))))

(defn build-action
  [parsed config]
  (if-not (:ok? parsed)
    parsed
    (let [{:keys [command options args]} parsed
          graph (pick-graph options args config)
          repo (resolve-repo graph)
          server-repo (resolve-repo (:repo options))]
      (case command
        (:graph-list :graph-create :graph-switch :graph-remove :graph-validate :graph-info)
        (build-graph-action command graph repo)

        (:server-list :server-status :server-start :server-stop :server-restart)
        (build-server-action command server-repo)

        (:list-page :list-tag :list-property)
        (build-list-action command options repo)

        :add-block
        (build-add-block-action options args repo)

        :add-page
        (build-add-page-action options repo)

        :remove-block
        (build-remove-block-action options repo)

        :remove-page
        (build-remove-page-action options repo)

        :search
        (build-search-action options args repo)

        :show
        (build-show-action options repo)

        {:ok? false
         :error {:code :unknown-command
                 :message (str "unknown command: " command)}}))))

(defn- execute-graph-list
  [_action config]
  (let [graphs (cli-server/list-graphs config)]
    {:status :ok
     :data {:graphs graphs}}))

(defn- execute-invoke
  [action config]
  (-> (p/let [cfg (if-let [repo (:repo action)]
                    (cli-server/ensure-server! config repo)
                    (p/resolved config))
              result (transport/invoke cfg
                                       (:method action)
                                       (:direct-pass? action)
                                       (:args action))]
        (when-let [repo (:persist-repo action)]
          (cli-config/update-config! config {:repo repo}))
        (if-let [write (:write action)]
          (let [{:keys [format path]} write]
            (transport/write-output {:format format :path path :data result})
            {:status :ok
             :data {:message (str "wrote " path)}})
          {:status :ok :data {:result result}}))))

(defn- execute-graph-switch
  [action config]
  (-> (p/let [graphs (cli-server/list-graphs config)
              graph (:graph action)]
        (if-not (some #(= graph %) graphs)
          {:status :error
           :error {:code :graph-not-found
                   :message (str "graph not found: " graph)}}
          (p/let [_ (cli-server/ensure-server! config (:repo action))]
            (cli-config/update-config! config {:repo graph})
            {:status :ok
             :data {:message (str "switched to " graph)}})))))

(defn- execute-graph-info
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              created (transport/invoke cfg "thread-api/pull" false [(:repo action) [:kv/value] :logseq.kv/graph-created-at])
              schema (transport/invoke cfg "thread-api/pull" false [(:repo action) [:kv/value] :logseq.kv/schema-version])]
        {:status :ok
         :data {:graph (:graph action)
                :logseq.kv/graph-created-at (:kv/value created)
                :logseq.kv/schema-version (:kv/value schema)}})))

(defn- execute-list-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg "thread-api/api-list-pages" false
                                      [(:repo action) options])
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              sorted (apply-sort items (:sort options) order list-page-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (if (:expand options)
                      (apply-fields limited fields list-page-field-map)
                      limited)]
        {:status :ok
         :data {:items final}})))

(defn- execute-list-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg "thread-api/api-list-tags" false
                                      [(:repo action) options])
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-tag-item % options) items)
              sorted (apply-sort prepared (:sort options) order list-tag-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (if (:expand options)
                      (apply-fields limited fields list-tag-field-map)
                      limited)]
        {:status :ok
         :data {:items final}})))

(defn- execute-list-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg "thread-api/api-list-properties" false
                                      [(:repo action) options])
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-property-item % options) items)
              sorted (apply-sort prepared (:sort options) order list-property-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (if (:expand options)
                      (apply-fields limited fields list-property-field-map)
                      limited)]
        {:status :ok
         :data {:items final}})))

(defn- execute-add-block
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              target-id (resolve-add-target cfg action)
              ops [[:insert-blocks [(:blocks action)
                                    target-id
                                    {:sibling? false
                                     :bottom? true
                                     :outliner-op :insert-blocks}]]]
              result (transport/invoke cfg "thread-api/apply-outliner-ops" false [(:repo action) ops {}])]
        {:status :ok
         :data {:result result}})))

(defn- execute-add-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              ops [[:create-page [(:page action) {}]]]
              result (transport/invoke cfg "thread-api/apply-outliner-ops" false [(:repo action) ops {}])]
        {:status :ok
         :data {:result result}})))

(defn- execute-remove
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              result (perform-remove cfg action)]
        {:status :ok
         :data {:result result}})))

(defn- query-pages
  [cfg repo text case-sensitive?]
  (let [query (if case-sensitive?
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e :block/name ?name]
                  [?e :block/title ?title]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(string/includes? ?title ?q)]]
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e :block/name ?name]
                  [?e :block/title ?title]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(string/includes? (string/lower-case ?title) ?q)]])
        q* (if case-sensitive? text (string/lower-case text))]
    (transport/invoke cfg "thread-api/q" false [repo [query q*]])))

(defn- query-blocks
  [cfg repo text case-sensitive? tag include-content?]
  (let [has-tag? (seq tag)
        content-attr (if include-content? :block/content :block/title)
        query (cond
                (and case-sensitive? has-tag?)
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q ?tag-name
                  :where
                  [?tag :block/name ?tag-name]
                  [?e :block/tags ?tag]
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(string/includes? ?value ?q)]]

                case-sensitive?
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(string/includes? ?value ?q)]]

                has-tag?
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q ?tag-name
                  :where
                  [?tag :block/name ?tag-name]
                  [?e :block/tags ?tag]
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(string/includes? (string/lower-case ?value) ?q)]]

                :else
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(string/includes? (string/lower-case ?value) ?q)]])
        q* (if case-sensitive? text (string/lower-case text))
        tag-name (some-> tag string/lower-case)]
    (if has-tag?
      (transport/invoke cfg "thread-api/q" false [repo [query q* tag-name]])
      (transport/invoke cfg "thread-api/q" false [repo [query q*]]))))

(defn- normalize-search-types
  [type]
  (let [type (or type "all")]
    (case type
      "page" [:page]
      "block" [:block]
      "tag" [:tag]
      "property" [:property]
      [:page :block :tag :property])))

(defn- search-sort-key
  [item sort-field]
  (case sort-field
    "updated-at" (:updated-at item)
    "created-at" (:created-at item)
    nil))

(defn- execute-search
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              types (normalize-search-types (:search-type action))
              case-sensitive? (boolean (:case-sensitive action))
              text (:text action)
              tag (:tag action)
              page-results (when (some #{:page} types)
                             (p/let [rows (query-pages cfg (:repo action) text case-sensitive?)]
                               (mapv (fn [[id title uuid updated created]]
                                       {:type "page"
                                        :db/id id
                                        :title title
                                        :uuid (str uuid)
                                        :updated-at updated
                                        :created-at created})
                                     rows)))
              include-content? (boolean (:include-content action))
              block-results (when (some #{:block} types)
                              (p/let [rows (query-blocks cfg (:repo action) text case-sensitive? tag include-content?)]
                                (mapv (fn [[id content uuid updated created]]
                                        {:type "block"
                                         :db/id id
                                         :content content
                                         :uuid (str uuid)
                                         :updated-at updated
                                         :created-at created})
                                      rows)))
              tag-results (when (some #{:tag} types)
                            (p/let [items (transport/invoke cfg "thread-api/api-list-tags" false
                                                            [(:repo action) {:expand true :include-built-in true}])
                                    q* (if case-sensitive? text (string/lower-case text))]
                              (->> items
                                   (filter (fn [item]
                                             (let [title (:block/title item)]
                                               (if case-sensitive?
                                                 (string/includes? title q*)
                                                 (string/includes? (string/lower-case title) q*)))))
                                   (mapv (fn [item]
                                           {:type "tag"
                                            :title (:block/title item)
                                            :uuid (:block/uuid item)})))))
              property-results (when (some #{:property} types)
                                 (p/let [items (transport/invoke cfg "thread-api/api-list-properties" false
                                                                 [(:repo action) {:expand true :include-built-in true}])
                                         q* (if case-sensitive? text (string/lower-case text))]
                                   (->> items
                                        (filter (fn [item]
                                                  (let [title (:block/title item)]
                                                    (if case-sensitive?
                                                      (string/includes? title q*)
                                                      (string/includes? (string/lower-case title) q*)))))
                                        (mapv (fn [item]
                                                {:type "property"
                                                 :title (:block/title item)
                                                 :uuid (:block/uuid item)})))))
              results (->> (concat (or page-results [])
                                   (or block-results [])
                                   (or tag-results [])
                                   (or property-results []))
                           (distinct)
                           vec)
              sorted (if-let [sort-field (:sort action)]
                       (let [order (or (:order action) "desc")]
                         (->> results
                              (sort-by #(search-sort-key % sort-field))
                              (cond-> (= order "desc") reverse)
                              vec))
                       results)
              limited (if (some? (:limit action)) (vec (take (:limit action) sorted)) sorted)]
        {:status :ok
         :data {:results limited}})))

(defn- execute-show
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              tree-data (fetch-tree cfg action)
              format (:format action)]
        (case format
          "edn"
          {:status :ok
           :data tree-data
           :output-format :edn}

          "json"
          {:status :ok
           :data tree-data
           :output-format :json}

          {:status :ok
           :data {:message (tree->text tree-data)}}))))

(defn- server-result->response
  [result]
  (if (:ok? result)
    {:status :ok
     :data (:data result)}
    {:status :error
     :error (:error result)}))

(defn- execute-server-list
  [_action config]
  (-> (p/let [servers (cli-server/list-servers config)]
        {:status :ok
         :data {:servers servers}})))

(defn- execute-server-status
  [action config]
  (-> (p/let [result (cli-server/server-status config (:repo action))]
        (server-result->response result))))

(defn- execute-server-start
  [action config]
  (-> (p/let [result (cli-server/start-server! config (:repo action))]
        (server-result->response result))))

(defn- execute-server-stop
  [action config]
  (-> (p/let [result (cli-server/stop-server! config (:repo action))]
        (server-result->response result))))

(defn- execute-server-restart
  [action config]
  (-> (p/let [result (cli-server/restart-server! config (:repo action))]
        (server-result->response result))))

(defn execute
  [action config]
  (-> (p/let [check (ensure-existing-graph action config)
              result (if-not (:ok? check)
                       {:status :error
                        :error (:error check)}
                       (case (:type action)
                         :graph-list (execute-graph-list action config)
                         :invoke (execute-invoke action config)
                         :graph-switch (execute-graph-switch action config)
                         :graph-info (execute-graph-info action config)
                         :list-page (execute-list-page action config)
                         :list-tag (execute-list-tag action config)
                         :list-property (execute-list-property action config)
                         :add-block (execute-add-block action config)
                         :add-page (execute-add-page action config)
                         :remove-block (execute-remove action config)
                         :remove-page (execute-remove action config)
                         :search (execute-search action config)
                         :show (execute-show action config)
                         :server-list (execute-server-list action config)
                         :server-status (execute-server-status action config)
                         :server-start (execute-server-start action config)
                         :server-stop (execute-server-stop action config)
                         :server-restart (execute-server-restart action config)
                         {:status :error
                          :error {:code :unknown-action
                                  :message "unknown action"}}))]
        (assoc result
               :command (or (:command action) (:type action))
               :context (select-keys action [:repo :graph :page :block :blocks])))))
