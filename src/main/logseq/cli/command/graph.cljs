(ns logseq.cli.command.graph
  "Graph-related CLI commands."
  (:require [cljs.pprint :as pprint]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.common :as cli-common]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private graph-export-spec
  {:type {:desc "Export type"
          :values ["edn" "sqlite"]}
   :file {:desc "Export file path"
          :complete :file}})

(def ^:private graph-import-spec
  {:type {:desc "Import type"
          :values ["edn" "sqlite"]}
   :input {:desc "Input path"
           :complete :file}})

(def ^:private graph-validate-spec
  {:fix {:desc "Attempt to fix validation errors"
         :alias :f
         :default false}})

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
                       {:examples ["logseq graph import --graph my-graph --type edn --input /tmp/my-graph.edn"]})])

(def ^:private import-export-types*
  #{"edn" "sqlite"})

(def ^:private graph-info-kv-query
  '[:find ?ident ?value
    :where
    [?e :db/ident ?ident]
    [(namespace ?ident) ?ns]
    [(= "logseq.kv" ?ns)]
    [?e :kv/value ?value]])

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
              :require-missing-graph true}}))

(defn execute-graph-list
  [_action config]
  (let [graphs (->> (cli-server/list-graphs config)
                    (mapv core/repo->graph))]
    {:status :ok
     :data {:graphs graphs}}))

(defn- format-validation-errors
  [errors]
  (str "Graph invalid. Found " (count errors)
       (if (= 1 (count errors)) " entity" " entities")
       " with errors:\n"
       (with-out-str (pprint/pprint errors))))

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
