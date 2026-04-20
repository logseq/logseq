(ns logseq.cli.command.graph
  "Graph-related CLI commands."
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.pprint :as pprint]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.common :as cli-common]
            [logseq.cli.config :as cli-config]
            [logseq.cli.humanize :as cli-humanize]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.graph :as common-graph]
            [logseq.common.graph-dir :as graph-dir]
            [promesa.core :as p]))

(def ^:private graph-export-spec
  {:type {:desc "Export type"
          :alias :t
          :validate #{"edn" "sqlite"}}
   :file {:desc "Export file path"
          :coerce common-graph/expand-home
          :complete :file}})

(def ^:private graph-import-spec
  {:type {:desc "Import type"
          :alias :t
          :validate #{"edn" "sqlite"}}
   :input {:desc "Input path"
           :coerce common-graph/expand-home
           :complete :file}})

(def ^:private graph-validate-spec
  {:fix {:desc "Attempt to fix validation errors"
         :alias :f
         :coerce :boolean
         :default false}})

(def ^:private graph-backup-create-spec
  {:name {:desc "Optional backup label"}})

(def ^:private graph-backup-restore-spec
  {:src {:desc "Source backup name"}
   :dst {:desc "Destination graph name"}})

(def ^:private graph-backup-remove-spec
  {:src {:desc "Source backup name"}})

(def ^:private backup-root-dir-name "backup")
(def ^:private backup-db-file-name "db.sqlite")

(def entries
  [(core/command-entry ["graph" "list"] :graph-list "List graphs" {})
   (core/command-entry ["graph" "create"] :graph-create "Create graph" {}
                       {:examples ["logseq graph create --graph my-graph"]})
   (core/command-entry ["graph" "switch"] :graph-switch "Switch current graph" {}
                       {:examples ["logseq graph switch --graph my-graph"]})
   (core/command-entry ["graph" "remove"] :graph-remove "Remove graph" {}
                       {:examples ["logseq graph remove --graph my-graph"]})
   (core/command-entry ["graph" "validate"] :graph-validate "Validate graph" graph-validate-spec
                       {:examples ["logseq graph validate --graph my-graph"
                                   "logseq graph validate --graph my-graph --fix"]})
   (core/command-entry ["graph" "info"] :graph-info "Graph metadata" {}
                       {:examples ["logseq graph info --graph my-graph"]})
   (core/command-entry ["graph" "export"] :graph-export "Export graph" graph-export-spec
                       {:examples ["logseq graph export --graph my-graph --type edn --file /tmp/my-graph.edn"]})
   (core/command-entry ["graph" "import"] :graph-import "Import graph" graph-import-spec
                       {:examples ["logseq graph import --graph my-graph --type edn --input /tmp/my-graph.edn"]})
   (core/command-entry ["graph" "backup" "list"] :graph-backup-list "List graph backups" {})
   (core/command-entry ["graph" "backup" "create"] :graph-backup-create "Create graph backup" graph-backup-create-spec
                       {:examples ["logseq graph backup create --graph my-graph"
                                   "logseq graph backup create --graph my-graph --name nightly"]})
   (core/command-entry ["graph" "backup" "restore"] :graph-backup-restore "Restore graph backup" graph-backup-restore-spec
                       {:examples ["logseq graph backup restore --src my-graph-nightly --dst my-graph-restore"]})
   (core/command-entry ["graph" "backup" "remove"] :graph-backup-remove "Remove graph backup" graph-backup-remove-spec
                       {:examples ["logseq graph backup remove --src my-graph-nightly"]})])

(def ^:private graph-info-kv-query
  '[:find ?ident ?value
    :where
    [?e :db/ident ?ident]
    [(namespace ?ident) ?ns]
    [(= "logseq.kv" ?ns)]
    [?e :kv/value ?value]])

(defn normalize-import-export-type
  [value]
  (some-> value string/lower-case string/trim))

(defn- missing-graph-error
  []
  {:ok? false
   :error {:code :missing-graph
           :message "graph name is required"}})

(defn- pad2
  [value]
  (if (< value 10)
    (str "0" value)
    (str value)))

(defn- utc-timestamp
  []
  (let [now (js/Date.)]
    (str (.getUTCFullYear now)
         (pad2 (inc (.getUTCMonth now)))
         (pad2 (.getUTCDate now))
         "T"
         (pad2 (.getUTCHours now))
         (pad2 (.getUTCMinutes now))
         (pad2 (.getUTCSeconds now))
         "Z")))

(defn- trimmed-option
  [value]
  (some-> value str string/trim not-empty))

(defn build-backup-list-action
  [repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for backup list"}}
    {:ok? true
     :action {:type :graph-backup-list
              :command :graph-backup-list
              :repo repo
              :graph (core/repo->graph repo)}}))

(defn build-backup-create-action
  [repo name]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for backup create"}}
    (let [graph (core/repo->graph repo)
          name-part (trimmed-option name)
          backup-name (if (seq name-part)
                        (str graph "-" name-part "-" (utc-timestamp))
                        (str graph "-" (utc-timestamp)))]
      {:ok? true
       :action {:type :graph-backup-create
                :command :graph-backup-create
                :repo repo
                :graph graph
                :backup-name backup-name}})))

(defn build-backup-restore-action
  [source-repo src dst]
  (let [src (trimmed-option src)
        dst (trimmed-option dst)
        destination-repo (core/resolve-repo dst)]
    (cond
      (not (seq source-repo))
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for backup restore"}}

      (not (seq destination-repo))
      {:ok? false
       :error {:code :missing-dst
               :message "destination graph name is required"}}

      :else
      {:ok? true
       :action {:type :graph-backup-restore
                :command :graph-backup-restore
                :repo destination-repo
                :graph (core/repo->graph destination-repo)
                :source-repo source-repo
                :source-graph (core/repo->graph source-repo)
                :src src
                :dst dst
                :allow-missing-graph true
                :require-missing-graph true}})))

(defn build-backup-remove-action
  [repo src]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for backup remove"}}
    {:ok? true
     :action {:type :graph-backup-remove
              :command :graph-backup-remove
              :repo repo
              :graph (core/repo->graph repo)
              :src (trimmed-option src)}}))

(defn build-graph-action
  [command graph repo options]
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
                :method :thread-api/create-or-open-db
                :direct-pass? false
                :args [repo {}]
                :repo repo
                :graph (core/repo->graph repo)
                :allow-missing-graph true
                :persist-repo (core/repo->graph repo)}})

    :graph-switch
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-switch
                :command :graph-switch
                :repo repo
                :graph (core/repo->graph repo)}})

    :graph-remove
    (if-not (seq graph)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-remove
                :command :graph-remove
                :repo repo
                :graph (core/repo->graph repo)}})

    :graph-validate
    (if-not (seq repo)
      (missing-graph-error)
      {:ok? true
       :action {:type :invoke
                :command :graph-validate
                :method :thread-api/validate-db
                :direct-pass? false
                :args [repo options]
                :repo repo
                :graph (core/repo->graph repo)}})

    :graph-info
    (if-not (seq repo)
      (missing-graph-error)
      {:ok? true
       :action {:type :graph-info
                :command :graph-info
                :repo repo
                :graph (core/repo->graph repo)}})))

(defn build-export-action
  [repo export-type file]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for export"}}
    {:ok? true
     :action {:type :graph-export
              :repo repo
              :graph (core/repo->graph repo)
              :export-type export-type
              :file file}}))

(defn build-import-action
  [repo import-type input]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for import"}}
    {:ok? true
     :action {:type :graph-import
              :repo repo
              :graph (core/repo->graph repo)
              :import-type import-type
              :input input
              :allow-missing-graph true
              :require-missing-graph (= import-type "sqlite")}}))

(defn- graph-item->graph-name
  [item]
  (case (:kind item)
    :canonical (:graph-name item)
    :legacy (or (:legacy-graph-name item)
                (:legacy-dir item))
    :legacy-undecodable (:legacy-dir item)
    nil))

(defn- backup-root-path
  [config repo]
  (when-let [graph-dir-name (graph-dir/repo->encoded-graph-dir-name repo)]
    (node-path/join (cli-server/resolve-data-dir config)
                    graph-dir-name
                    backup-root-dir-name)))

(defn- backup-dir-name
  [backup-name]
  (graph-dir/graph-dir-key->encoded-dir-name backup-name))

(defn- backup-dir-path
  [config repo backup-name]
  (some->> (backup-dir-name backup-name)
           (node-path/join (backup-root-path config repo))))

(defn- backup-db-path
  [config repo backup-name]
  (some-> (backup-dir-path config repo backup-name)
          (node-path/join backup-db-file-name)))

(defn- backup-metadata
  [^js dirent root-path]
  (let [dir-name (.-name dirent)
        backup-name (graph-dir/decode-graph-dir-name dir-name)
        db-path (node-path/join root-path dir-name backup-db-file-name)]
    (when (and (seq backup-name)
               (fs/existsSync db-path))
      (let [stat (fs/statSync db-path)]
        (when (.isFile stat)
          {:name backup-name
           :created-at (.-mtimeMs stat)
           :size-bytes (.-size stat)})))))

(defn- list-backups
  [config repo]
  (if-let [root-path (backup-root-path config repo)]
    (let [dirents (if (fs/existsSync root-path)
                    (fs/readdirSync root-path #js {:withFileTypes true})
                    #js [])]
      (->> dirents
           (filter #(.isDirectory ^js %))
           (keep #(backup-metadata % root-path))
           (sort-by (juxt :name :created-at))
           vec))
    []))

(defn- next-backup-target
  [config repo base-name]
  (loop [suffix 0]
    (let [backup-name (if (zero? suffix)
                        base-name
                        (str base-name "-" suffix))
          dir-path (backup-dir-path config repo backup-name)]
      (if (and (seq dir-path)
               (fs/existsSync dir-path))
        (recur (inc suffix))
        {:backup-name backup-name
         :dir-path dir-path
         :db-path (when (seq dir-path)
                    (node-path/join dir-path backup-db-file-name))}))))

(defn execute-graph-list
  [_action config]
  (let [graph-items (vec (cli-server/list-graph-items config))
        graphs (->> graph-items
                    (keep graph-item->graph-name)
                    (mapv core/repo->graph))
        legacy-count (->> graph-items
                          (filter (fn [{:keys [kind]}]
                                    (contains? #{:legacy :legacy-undecodable} kind)))
                          count)]
    (cond-> {:status :ok
             :data {:graphs graphs
                    :graph-items graph-items}}
      (pos? legacy-count) (assoc :human {:graph-list {:legacy-count legacy-count}}))))

(defn execute-graph-backup-list
  [action config]
  {:status :ok
   :data {:backups (list-backups config (:repo action))}})

(defn execute-graph-backup-create
  [action config]
  (p/let [cfg (cli-server/ensure-server! config (:repo action))
          {:keys [backup-name dir-path db-path]} (next-backup-target config (:repo action) (:backup-name action))
          _ (when-not (seq dir-path)
              (throw (ex-info "invalid backup target path"
                              {:code :invalid-backup-path
                               :backup-name backup-name})))
          _ (fs/mkdirSync dir-path #js {:recursive true})
          _ (transport/invoke cfg
                              :thread-api/backup-db-sqlite
                              true
                              [(:repo action) db-path])]
    {:status :ok
     :data {:backup-name backup-name
            :path db-path
            :message (str "Created backup " backup-name)}}))

(declare execute-graph-import)

(defn execute-graph-backup-restore
  [action config]
  (let [src-path (backup-db-path config (:source-repo action) (:src action))]
    (if-not (and (seq src-path)
                 (fs/existsSync src-path))
      {:status :error
       :error {:code :backup-not-found
               :message (str "backup not found: " (:src action))}}
      (execute-graph-import (assoc action
                                   :import-type "sqlite"
                                   :input src-path)
                            config))))

(defn execute-graph-backup-remove
  [action config]
  (let [dir-path (backup-dir-path config (:repo action) (:src action))]
    (if-not (and (seq dir-path)
                 (fs/existsSync dir-path))
      {:status :error
       :error {:code :backup-not-found
               :message (str "backup not found: " (:src action))}}
      (do
        (fs/rmSync dir-path #js {:recursive true :force true})
        {:status :ok
         :data {:message (str "Removed backup " (:src action))}}))))

(defn- format-validation-errors
  [errors]
  (let [error-count (count errors)]
    (str "Graph invalid. Found "
         (cli-humanize/format-count error-count)
         " "
         (cli-humanize/pluralize-noun error-count "entity")
         " with errors:\n"
         (with-out-str (pprint/pprint errors)))))

(defn- graph-validate-result
  [result]
  (if (seq (:errors result))
    {:status :error
     :error {:code :graph-validation-failed
             :message (format-validation-errors (:errors result))}
     :data {:errors (:errors result)}}
    {:status :ok :data {:result result}}))

(defn execute-invoke
  [action config]
  (p/let [cfg (if-let [repo (:repo action)]
                (cli-server/ensure-server! config repo)
                (p/resolved config))
          result (transport/invoke cfg
                                   (:method action)
                                   (:direct-pass? action)
                                   (:args action))]
    (when-let [repo (:persist-repo action)]
      (cli-config/update-config! config {:graph repo}))
    (let [write (:write action)]
      (cond
        (= :graph-validate (:command action))
        (graph-validate-result result)

        write
        (let [{:keys [format path]} write]
          (transport/write-output {:format format :path path :data result})
          {:status :ok
           :data {:message (str "wrote " path)}})

        :else
        {:status :ok :data {:result result}}))))

(defn execute-graph-remove
  [action config]
  (-> (p/let [stop-result (cli-server/stop-server! config (:repo action))
              _ (when-not (or (:ok? stop-result)
                              (= :server-not-found (get-in stop-result [:error :code])))
                  (throw (ex-info (get-in stop-result [:error :message] "failed to stop server")
                                  {:code (get-in stop-result [:error :code])})))
              unlinked-dir (cli-common/unlink-graph! (:repo action))]
        (if unlinked-dir
          {:status :ok
           :data {:result nil}}
          {:status :error
           :error {:code :graph-not-removed
                   :message "unable to remove graph"}}))))

(defn execute-graph-switch
  [action config]
  (-> (p/let [graphs (cli-server/list-graphs config)
              graph (:graph action)]
        (if-not (some #(= graph %) graphs)
          {:status :error
           :error {:code :graph-not-found
                   :message (str "graph not found: " graph)}}
          (p/let [_ (cli-server/ensure-server! config (:repo action))]
            (cli-config/update-config! config {:graph graph})
            {:status :ok
             :data {:message (str "switched to " graph)}})))))

(defn execute-graph-info
  [action config]
  (let [ident->kv-key (fn [ident]
                        (if (keyword? ident)
                          (if-let [ident-ns (namespace ident)]
                            (str ident-ns "/" (name ident))
                            (name ident))
                          (str ident)))
        kv-lookup (fn [kv key]
                    (or (get kv key)
                        (get kv (str ":" key))))]
    (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
                rows (transport/invoke cfg :thread-api/q false [(:repo action) [graph-info-kv-query]])
                kv (reduce (fn [acc [ident value]]
                             (assoc acc (ident->kv-key ident) value))
                           {}
                           (or rows []))
                created-at (kv-lookup kv "logseq.kv/graph-created-at")
                schema-version (kv-lookup kv "logseq.kv/schema-version")]
        {:status :ok
         :data {:graph (:graph action)
                :logseq.kv/graph-created-at created-at
                :logseq.kv/schema-version schema-version
                :kv kv}}))))

(defn execute-graph-export
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              export-type (:export-type action)
              export-result (case export-type
                              "edn"
                              (transport/invoke cfg
                                                :thread-api/export-edn
                                                false
                                                [(:repo action) {:export-type :graph}])
                              "sqlite"
                              (transport/invoke cfg
                                                :thread-api/export-db-base64
                                                true
                                                [(:repo action)])
                              (throw (ex-info "unsupported export type" {:export-type export-type})))
              data (if (= export-type "sqlite")
                     (js/Buffer.from export-result "base64")
                     export-result)
              format (if (= export-type "sqlite") :sqlite :edn)]
        (transport/write-output {:format format :path (:file action) :data data})
        {:status :ok
         :data {:message (str "wrote " (:file action))}})))

(defn execute-graph-import
  [action config]
  (-> (p/let [existing-graphs (cli-server/list-graphs config)
              graph (core/repo->graph (:repo action))
              new-graph? (not (some #(= graph %) existing-graphs))
              _ (cli-server/stop-server! config (:repo action))
              cfg (cli-server/ensure-server! config (:repo action))
              import-type (:import-type action)
              input-data (case import-type
                           "edn" (transport/read-input {:format :edn :path (:input action)})
                           "sqlite" (transport/read-input {:format :sqlite :path (:input action)})
                           (throw (ex-info "unsupported import type" {:import-type import-type})))
              payload (if (= import-type "sqlite")
                        (.toString (js/Buffer.from input-data) "base64")
                        input-data)
              method (if (= import-type "sqlite")
                       :thread-api/import-db-base64
                       :thread-api/import-edn)
              direct-pass? (= import-type "sqlite")
              _ (transport/invoke cfg method direct-pass? [(:repo action) payload])
              _ (cli-server/restart-server! config (:repo action))]
        {:status :ok
         :data {:new-graph? new-graph?
                :message (str (when new-graph?
                                (str "Created graph " graph "\n"))
                              "Imported " import-type " from " (:input action))}})))
