(ns logseq.cli.commands
  (:require ["fs" :as fs]
            [cljs-time.coerce :as tc]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.tools.cli :as cli]
            [logseq.cli.config :as cli-config]
            [logseq.cli.transport :as transport]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [promesa.core :as p]))

(def ^:private command->keyword
  {"ping" :ping
   "status" :status
   "query" :query
   "export" :export
   "graph-list" :graph-list
   "graph-create" :graph-create
   "graph-switch" :graph-switch
   "graph-remove" :graph-remove
   "graph-validate" :graph-validate
   "graph-info" :graph-info
   "add" :add
   "remove" :remove
   "search" :search
   "tree" :tree})

(def ^:private cli-options
  [["-h" "--help" "Show help"]
   [nil "--config PATH" "Path to cli.edn"
    :id :config-path]
   [nil "--base-url URL" "Base URL for db-worker-node"]
   [nil "--host HOST" "Host for db-worker-node"]
   [nil "--port PORT" "Port for db-worker-node"
    :parse-fn #(js/parseInt % 10)]
   [nil "--auth-token TOKEN" "Auth token for db-worker-node"]
   [nil "--repo REPO" "Graph name"]
   [nil "--graph GRAPH" "Graph name (alias for --repo in graph commands)"]
   [nil "--timeout-ms MS" "Request timeout in ms"
    :parse-fn #(js/parseInt % 10)]
   [nil "--retries N" "Retry count for requests"
    :parse-fn #(js/parseInt % 10)]
   [nil "--json" "Output JSON"
    :id :json?
    :default false]
   [nil "--format FORMAT" "Output format (tree/export)"]
   [nil "--limit N" "Limit results"
    :parse-fn #(js/parseInt % 10)]
   [nil "--page PAGE" "Page name"]
   [nil "--block UUID" "Block UUID"]
   [nil "--parent UUID" "Parent block UUID for add"]
   [nil "--content TEXT" "Block content for add"]
   [nil "--blocks EDN" "EDN vector of blocks for add"]
   [nil "--blocks-file PATH" "EDN file of blocks for add"]
   [nil "--text TEXT" "Search text"]
   [nil "--query QUERY" "EDN query input"]
   [nil "--file PATH" "Path to EDN query file"]
   [nil "--out PATH" "Output path"]])

(defn parse-args
  [args]
  (let [{:keys [options arguments errors summary]} (cli/parse-opts args cli-options)
        command-str (first arguments)
        command-args (vec (rest arguments))
        command (get command->keyword command-str)]
    (cond
      (seq errors)
      {:ok? false
       :error {:code :invalid-options
               :message (string/join "\n" errors)}
       :summary summary}

      (:help options)
      {:ok? false
       :help? true
       :summary summary}

      (nil? command-str)
      {:ok? false
       :error {:code :missing-command
               :message "missing command"}
       :summary summary}

      (nil? command)
      {:ok? false
       :error {:code :unknown-command
               :message (str "unknown command: " command-str)}
       :summary summary}

      :else
      {:ok? true
       :command command
       :options options
       :args command-args
       :summary summary})))

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

(defn- read-query
  [{:keys [query file]}]
  (cond
    (seq query)
    {:ok? true :value (reader/read-string query)}

    (seq file)
    (let [contents (.toString (fs/readFileSync file) "utf8")]
      {:ok? true :value (reader/read-string contents)})

    :else
    {:ok? false
     :error {:code :missing-query
             :message "query is required"}}))

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

(defn- ensure-vector
  [value]
  (if (vector? value)
    {:ok? true :value value}
    {:ok? false
     :error {:code :invalid-query
             :message "query must be a vector"}}))

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

(defn build-action
  [parsed config]
  (if-not (:ok? parsed)
    parsed
    (let [{:keys [command options args]} parsed
          graph (pick-graph options args config)
          repo (resolve-repo graph)]
      (case command
        :ping
        {:ok? true :action {:type :ping}}

        :status
        {:ok? true :action {:type :status}}

        :query
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-repo
                   :message "repo is required for query"}}
          (let [query-result (read-query options)]
            (if-not (:ok? query-result)
              query-result
              (let [vector-result (ensure-vector (:value query-result))]
                (if-not (:ok? vector-result)
                  vector-result
                  {:ok? true
                   :action {:type :invoke
                            :method "thread-api/q"
                            :direct-pass? false
                            :args [repo (:value vector-result)]}})))))

        :export
        (let [format (some-> (:format options) string/lower-case)
              out (:out options)
              repo repo]
          (cond
            (not (seq repo))
            {:ok? false
             :error {:code :missing-repo
                     :message "repo is required for export"}}

            (not (seq out))
            {:ok? false
             :error {:code :missing-output
                     :message "output path is required"}}

            (= format "edn")
            {:ok? true
             :action {:type :invoke
                      :method "thread-api/export-edn"
                      :direct-pass? false
                      :args [repo {}]
                      :write {:format :edn
                              :path out}}}

            (= format "db")
            {:ok? true
             :action {:type :invoke
                      :method "thread-api/export-db"
                      :direct-pass? true
                      :args [repo]
                      :write {:format :db
                              :path out}}}

            :else
            {:ok? false
             :error {:code :unsupported-format
                     :message (str "unsupported format: " format)}}))

        :graph-list
        {:ok? true
         :action {:type :invoke
                  :method "thread-api/list-db"
                  :direct-pass? false
                  :args []}}

        :graph-create
        (if-not (seq graph)
          {:ok? false
           :error {:code :missing-graph
                   :message "graph name is required"}}
          {:ok? true
           :action {:type :invoke
                    :method "thread-api/create-or-open-db"
                    :direct-pass? false
                    :args [repo {}]
                    :persist-repo (repo->graph repo)}})

        :graph-switch
        (if-not (seq graph)
          {:ok? false
           :error {:code :missing-graph
                   :message "graph name is required"}}
          {:ok? true
           :action {:type :graph-switch
                    :repo repo
                    :graph (repo->graph repo)}})

        :graph-remove
        (if-not (seq graph)
          {:ok? false
           :error {:code :missing-graph
                   :message "graph name is required"}}
          {:ok? true
           :action {:type :invoke
                    :method "thread-api/unsafe-unlink-db"
                    :direct-pass? false
                    :args [repo]}})

        :graph-validate
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-graph
                   :message "graph name is required"}}
          {:ok? true
           :action {:type :invoke
                    :method "thread-api/validate-db"
                    :direct-pass? false
                    :args [repo]}})

        :graph-info
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-graph
                   :message "graph name is required"}}
          {:ok? true
           :action {:type :graph-info
                    :repo repo
                    :graph (repo->graph repo)}})

        :add
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-repo
                   :message "repo is required for add"}}
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
                            :blocks (:value vector-result)}})))))

        :remove
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-repo
                   :message "repo is required for remove"}}
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
                       :message "block or page is required"}})))

        :search
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-repo
                   :message "repo is required for search"}}
          (let [text (or (:text options) (string/join " " args))]
            (if (seq text)
              {:ok? true
               :action {:type :search
                        :repo repo
                        :text text
                        :limit (:limit options)}}
              {:ok? false
               :error {:code :missing-search-text
                       :message "search text is required"}})))

        :tree
        (if-not (seq repo)
          {:ok? false
           :error {:code :missing-repo
                   :message "repo is required for tree"}}
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
                       :message "block or page is required"}})))

        {:ok? false
         :error {:code :unknown-command
                 :message (str "unknown command: " command)}}))))

(defn execute
  [action config]
  (case (:type action)
    :ping
    (-> (transport/ping config)
        (p/then (fn [_]
                  {:status :ok :data {:message "ok"}})))

    :status
    (-> (p/let [ready? (transport/ready config)
                dbs (transport/list-db config)]
          {:status :ok
           :data {:ready ready?
                  :dbs dbs}}))

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
