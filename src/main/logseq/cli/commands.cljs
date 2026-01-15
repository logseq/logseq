(ns logseq.cli.commands
  "Command parsing and action building for the Logseq CLI."
  (:require ["fs" :as fs]
            [babashka.cli :as cli]
            [cljs-time.coerce :as tc]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [logseq.cli.config :as cli-config]
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
   :base-url {:desc "Base URL for db-worker-node"}
   :host {:desc "Host for db-worker-node"}
   :port {:desc "Port for db-worker-node"
          :coerce :long}
   :auth-token {:desc "Auth token for db-worker-node"}
   :repo {:desc "Graph name"}
   :timeout-ms {:desc "Request timeout in ms"
                :coerce :long}
   :retries {:desc "Retry count for requests"
             :coerce :long}
   :output {:desc "Output format (human, json, edn)"}})

(def ^:private graph-spec
  {:graph {:desc "Graph name"}})

(def ^:private content-add-spec
  {:content {:desc "Block content for add"}
   :blocks {:desc "EDN vector of blocks for add"}
   :blocks-file {:desc "EDN file of blocks for add"}
   :page {:desc "Page name"}
   :parent {:desc "Parent block UUID for add"}})

(def ^:private content-remove-spec
  {:block {:desc "Block UUID"}
   :page {:desc "Page name"}})

(def ^:private content-search-spec
  {:text {:desc "Search text"}
   :limit {:desc "Limit results"
           :coerce :long}})

(def ^:private content-tree-spec
  {:block {:desc "Block UUID"}
   :page {:desc "Page name"}
   :format {:desc "Output format (tree)"}})

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
                 [(str "Usage: logseq-cli " group " <subcommand> [options]")
                  ""
                  "Subcommands:"
                  (format-commands group-table)
                  ""
                  "Options:"
                  (cli/format-opts {:spec global-spec})])))

(defn- top-level-summary
  [table]
  (string/join "\n"
               ["Usage: logseq-cli <command> [options]"
                ""
                "Commands:"
                (format-commands table)
                ""
                "Options:"
                (cli/format-opts {:spec global-spec})]))

(defn- command-summary
  [{:keys [cmds spec]}]
  (string/join "\n"
               [(str "Usage: logseq-cli " (string/join " " cmds) " [options]")
                ""
                "Options:"
                (cli/format-opts {:spec spec})]))

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
   (command-entry ["graph" "create"] :graph-create "Create graph" graph-spec)
   (command-entry ["graph" "switch"] :graph-switch "Switch current graph" graph-spec)
   (command-entry ["graph" "remove"] :graph-remove "Remove graph" graph-spec)
   (command-entry ["graph" "validate"] :graph-validate "Validate graph" graph-spec)
   (command-entry ["graph" "info"] :graph-info "Graph metadata" graph-spec)
   (command-entry ["block" "add"] :add "Add blocks" content-add-spec)
   (command-entry ["block" "remove"] :remove "Remove block or page" content-remove-spec)
   (command-entry ["block" "search"] :search "Search blocks" content-search-spec)
   (command-entry ["block" "tree"] :tree "Show tree" content-tree-spec)])

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
        graph (or (:graph opts) (:repo opts))
        has-args? (seq args)
        has-content? (or (seq (:content opts))
                         (seq (:blocks opts))
                         (seq (:blocks-file opts))
                         has-args?)]
    (cond
      (:help opts)
      (help-result cmd-summary)

      (and (#{:graph-create :graph-switch :graph-remove :graph-validate} command)
           (not (seq graph)))
      (missing-graph-result summary)

      (and (= command :add) (not has-content?))
      (missing-content-result summary)

      (and (= command :remove) (not (or (seq (:block opts)) (seq (:page opts)))))
      (missing-target-result summary)

      (and (= command :tree) (not (or (seq (:block opts)) (seq (:page opts)))))
      (missing-target-result summary)

      (and (= command :search) (not (or (seq (:text opts)) has-args?)))
      (missing-search-result summary)

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
      (if (and (= 1 (count args)) (#{"graph" "block"} (first args)))
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

(defn- pick-graph
  [options command-args config]
  (or (:graph options)
      (:repo options)
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
  [blocks root-id]
  (let [parent->children (group-by #(get-in % [:block/parent :db/id]) blocks)
        sort-children (fn [children]
                        (vec (sort-by :block/order children)))
        build (fn build [parent-id]
                (mapv (fn [b]
                        (let [children (build (:db/id b))]
                          (cond-> b
                            (seq children) (assoc :block/children children))))
                      (sort-children (get parent->children parent-id))))]
    (build root-id)))

(defn- fetch-tree
  [config {:keys [repo block page]}]
  (if (seq block)
    (if-not (common-util/uuid-string? block)
      (p/rejected (ex-info "block must be a uuid" {:code :invalid-block}))
      (p/let [entity (transport/invoke config "thread-api/pull" false
                                       [repo [:db/id :block/uuid :block/title {:block/page [:db/id :block/title]}]
                                        [:block/uuid (uuid block)]])]
        (if-let [page-id (get-in entity [:block/page :db/id])]
          (p/let [blocks (fetch-blocks-for-page config repo page-id)
                  children (build-tree blocks (:db/id entity))]
            {:root (assoc entity :block/children children)})
          (throw (ex-info "block not found" {:code :block-not-found})))))
    (p/let [page-entity (transport/invoke config "thread-api/pull" false
                                          [repo [:db/id :block/uuid :block/title] [:block/name page]])]
      (if-let [page-id (:db/id page-entity)]
        (p/let [blocks (fetch-blocks-for-page config repo page-id)
                children (build-tree blocks page-id)]
          {:root (assoc page-entity :block/children children)})
        (throw (ex-info "page not found" {:code :page-not-found}))))))

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

(defn- build-graph-action
  [command graph repo]
  (case command
    :graph-list
    {:ok? true
     :action {:type :invoke
              :method "thread-api/list-db"
              :direct-pass? false
              :args []}}

    :graph-create
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :method "thread-api/create-or-open-db"
                :direct-pass? false
                :args [repo {}]
                :persist-repo (repo->graph repo)}})

    :graph-switch
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-switch
                :repo repo
                :graph (repo->graph repo)}})

    :graph-remove
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :method "thread-api/unsafe-unlink-db"
                :direct-pass? false
                :args [repo]}})

    :graph-validate
    (if-not (seq repo)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :method "thread-api/validate-db"
                :direct-pass? false
                :args [repo]}})

    :graph-info
    (if-not (seq repo)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-info
                :repo repo
                :graph (repo->graph repo)}})))

(defn- build-add-action
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
             :action {:type :add
                      :repo repo
                      :graph (repo->graph repo)
                      :page (:page options)
                      :parent (:parent options)
                      :blocks (:value vector-result)}}))))))

(defn- build-remove-action
  [options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for remove")
    (let [block (:block options)
          page (:page options)]
      (if (or (seq block) (seq page))
        {:ok? true
         :action {:type :remove
                  :repo repo
                  :block block
                  :page page}}
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}))))

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
                  :limit (:limit options)}}
        {:ok? false
         :error {:code :missing-search-text
                 :message "search text is required"}}))))

(defn- build-tree-action
  [options repo]
  (if-not (seq repo)
    (missing-repo-error "repo is required for tree")
    (let [block (:block options)
          page (:page options)
          target (or block page)]
      (if (seq target)
        {:ok? true
         :action {:type :tree
                  :repo repo
                  :block block
                  :page page
                  :format (some-> (:format options) string/lower-case)}}
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}))))

(defn build-action
  [parsed config]
  (if-not (:ok? parsed)
    parsed
    (let [{:keys [command options args]} parsed
          graph (pick-graph options args config)
          repo (resolve-repo graph)]
      (case command
        (:graph-list :graph-create :graph-switch :graph-remove :graph-validate :graph-info)
        (build-graph-action command graph repo)

        :add
        (build-add-action options args repo)

        :remove
        (build-remove-action options repo)

        :search
        (build-search-action options args repo)

        :tree
        (build-tree-action options repo)

        {:ok? false
         :error {:code :unknown-command
                 :message (str "unknown command: " command)}}))))

(defn execute
  [action config]
  (case (:type action)
    :invoke
    (-> (p/let [result (transport/invoke config
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
            {:status :ok :data {:result result}})))

    :graph-switch
    (-> (p/let [exists? (transport/invoke config "thread-api/db-exists" false [(:repo action)])]
          (if-not exists?
            {:status :error
             :error {:code :graph-not-found
                     :message (str "graph not found: " (:graph action))}}
            (p/let [_ (transport/invoke config "thread-api/create-or-open-db" false [(:repo action) {}])]
              (cli-config/update-config! config {:repo (:graph action)})
              {:status :ok
               :data {:message (str "switched to " (:graph action))}}))))

    :graph-info
    (-> (p/let [created (transport/invoke config "thread-api/pull" false [(:repo action) [:kv/value] :logseq.kv/graph-created-at])
                schema (transport/invoke config "thread-api/pull" false [(:repo action) [:kv/value] :logseq.kv/schema-version])]
          {:status :ok
           :data {:graph (:graph action)
                  :logseq.kv/graph-created-at (:kv/value created)
                  :logseq.kv/schema-version (:kv/value schema)}}))

    :add
    (-> (p/let [target-id (resolve-add-target config action)
                ops [[:insert-blocks [(:blocks action)
                                      target-id
                                      {:sibling? false
                                       :bottom? true
                                       :outliner-op :insert-blocks}]]]
                result (transport/invoke config "thread-api/apply-outliner-ops" false [(:repo action) ops {}])]
          {:status :ok
           :data {:result result}}))

    :remove
    (-> (p/let [result (perform-remove config action)]
          {:status :ok
           :data {:result result}}))

    :search
    (-> (p/let [query '[:find ?e ?title
                        :in $ ?q
                        :where
                        [?e :block/title ?title]
                        [(clojure.string/includes? ?title ?q)]]
                results (transport/invoke config "thread-api/q" false [(:repo action) [query (:text action)]])
                mapped (mapv (fn [[id title]] {:db/id id :block/title title}) results)
                limited (if (some? (:limit action)) (vec (take (:limit action) mapped)) mapped)]
          {:status :ok
           :data {:results limited}}))

    :tree
    (-> (p/let [tree-data (fetch-tree config action)
                format (or (:format action) (when (:json? config) "json"))]
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
             :data {:message (tree->text tree-data)}})))

    {:status :error
     :error {:code :unknown-action
             :message "unknown action"}}))
