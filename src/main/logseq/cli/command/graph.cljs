(ns logseq.cli.command.graph
  "Graph-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private graph-export-spec
  {:type {:desc "Export type (edn, sqlite)"}
   :output {:desc "Output path"}})

(def ^:private graph-import-spec
  {:type {:desc "Import type (edn, sqlite)"}
   :input {:desc "Input path"}})

(def entries
  [(core/command-entry ["graph" "list"] :graph-list "List graphs" {})
   (core/command-entry ["graph" "create"] :graph-create "Create graph" {})
   (core/command-entry ["graph" "switch"] :graph-switch "Switch current graph" {})
   (core/command-entry ["graph" "remove"] :graph-remove "Remove graph" {})
   (core/command-entry ["graph" "validate"] :graph-validate "Validate graph" {})
   (core/command-entry ["graph" "info"] :graph-info "Graph metadata" {})
   (core/command-entry ["graph" "export"] :graph-export "Export graph" graph-export-spec)
   (core/command-entry ["graph" "import"] :graph-import "Import graph" graph-import-spec)])

(def ^:private import-export-types*
  #{"edn" "sqlite"})

(defn import-export-types
  []
  import-export-types*)

(defn normalize-import-export-type
  [value]
  (some-> value string/lower-case string/trim))

(defn- missing-graph-error
  []
  {:ok? false
   :error {:code :missing-graph
           :message "graph name is required"}})

(defn build-graph-action
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
       :action {:type :invoke
                :command :graph-remove
                :method :thread-api/unsafe-unlink-db
                :direct-pass? false
                :args [repo]
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
                :args [repo]
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
  [repo export-type output]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for export"}}
    {:ok? true
     :action {:type :graph-export
              :repo repo
              :graph (core/repo->graph repo)
              :export-type export-type
              :output output}}))

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
              :allow-missing-graph true}}))

(defn execute-graph-list
  [_action config]
  (let [graphs (->> (cli-server/list-graphs config)
                    (mapv core/repo->graph))]
    {:status :ok
     :data {:graphs graphs}}))

(defn execute-invoke
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

(defn execute-graph-switch
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

(defn execute-graph-info
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              created (transport/invoke cfg :thread-api/pull false [(:repo action) [:kv/value] :logseq.kv/graph-created-at])
              schema (transport/invoke cfg :thread-api/pull false [(:repo action) [:kv/value] :logseq.kv/schema-version])]
        {:status :ok
         :data {:graph (:graph action)
                :logseq.kv/graph-created-at (:kv/value created)
                :logseq.kv/schema-version (:kv/value schema)}})))

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
        (transport/write-output {:format format :path (:output action) :data data})
        {:status :ok
         :data {:message (str "wrote " (:output action))}})))

(defn execute-graph-import
  [action config]
  (-> (p/let [_ (cli-server/stop-server! config (:repo action))
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
         :data {:message (str "imported " import-type " from " (:input action))}})))
