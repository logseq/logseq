(ns logseq.cli.command.server
  "Server-related CLI commands."
  (:require [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.version :as version]
            [promesa.core :as p]))

(def ^:private server-spec
  {:graph {:desc "Graph name"}})

(def entries
  [(core/command-entry ["server" "list"] :server-list "List db-worker-node servers" {})
   (core/command-entry ["server" "status"] :server-status "Show server status for a graph" server-spec
                       {:examples ["logseq server status --graph my-graph"]})
   (core/command-entry ["server" "start"] :server-start "Start db-worker-node for a graph" server-spec
                       {:examples ["logseq server start --graph my-graph"]})
   (core/command-entry ["server" "stop"] :server-stop "Stop db-worker-node for a graph" server-spec
                       {:examples ["logseq server stop --graph my-graph"]})
   (core/command-entry ["server" "restart"] :server-restart "Restart db-worker-node for a graph" server-spec
                       {:examples ["logseq server restart --graph my-graph"]})])

(defn build-action
  [command repo]
  (case command
    :server-list
    {:ok? true
     :action {:type :server-list}}

    :server-status
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for server status"}}
      {:ok? true
       :action {:type :server-status
                :repo repo}})

    :server-start
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for server start"}}
      {:ok? true
       :action {:type :server-start
                :repo repo}})

    :server-stop
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for server stop"}}
      {:ok? true
       :action {:type :server-stop
                :repo repo}})

    :server-restart
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for server restart"}}
      {:ok? true
       :action {:type :server-restart
                :repo repo}})

    {:ok? false
     :error {:code :unknown-command
             :message (str "unknown server command: " command)}}))

(defn- server-result->response
  [result]
  (if (:ok? result)
    {:status :ok
     :data (:data result)}
    {:status :error
     :error (:error result)}))

(defn execute-list
  [_action config]
  (-> (p/let [servers (cli-server/list-servers config)
              revision-mismatch (cli-server/compute-revision-mismatches (version/revision) servers)]
        (cond-> {:status :ok
                 :data {:servers servers}}
          revision-mismatch
          (assoc :human {:server-list {:revision-mismatch revision-mismatch}})))))

(defn execute-status
  [action config]
  (-> (p/let [result (cli-server/server-status config (:repo action))]
        (server-result->response result))))

(defn execute-start
  [action config]
  (-> (p/let [result (cli-server/start-server! config (:repo action))]
        (server-result->response result))))

(defn execute-stop
  [action config]
  (-> (p/let [result (cli-server/stop-server! config (:repo action))]
        (server-result->response result))))

(defn execute-restart
  [action config]
  (-> (p/let [result (cli-server/restart-server! config (:repo action))]
        (server-result->response result))))
