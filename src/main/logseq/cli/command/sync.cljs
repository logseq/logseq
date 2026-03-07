(ns logseq.cli.command.sync
  "Sync-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.config :as cli-config]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private sync-grant-access-spec
  {:graph-id {:desc "Remote graph UUID"}
   :email {:desc "Target user email"}})

(def entries
  [(core/command-entry ["sync" "status"] :sync-status "Show db-sync runtime status" {})
   (core/command-entry ["sync" "start"] :sync-start "Start db-sync client" {})
   (core/command-entry ["sync" "stop"] :sync-stop "Stop db-sync client" {})
   (core/command-entry ["sync" "upload"] :sync-upload "Upload current graph snapshot" {})
   (core/command-entry ["sync" "download"] :sync-download "Download remote graph snapshot" {})
   (core/command-entry ["sync" "remote-graphs"] :sync-remote-graphs "List remote graphs" {})
   (core/command-entry ["sync" "ensure-keys"] :sync-ensure-keys "Ensure user RSA keys for sync/e2ee" {})
   (core/command-entry ["sync" "grant-access"] :sync-grant-access "Grant graph access to an email" sync-grant-access-spec)
   (core/command-entry ["sync" "config" "set"] :sync-config-set "Set sync config key" {})
   (core/command-entry ["sync" "config" "get"] :sync-config-get "Get sync config key" {})
   (core/command-entry ["sync" "config" "unset"] :sync-config-unset "Unset sync config key" {})])

(def ^:private config-key-map
  {"ws-url" :ws-url
   "http-base" :http-base
   "auth-token" :auth-token
   "e2ee-password" :e2ee-password})

(def ^:private sync-start-timeout-ms 10000)
(def ^:private sync-start-poll-interval-ms 100)

(def ^:private sync-start-skipped-states
  #{:inactive :stopped})

(def ^:private sync-download-non-empty-query
  '[:find (count ?e) .
    :where
    (or [?e :block/name]
        [?e :block/page _]
        [?e :block/parent _])
    (not [?e :logseq.property/built-in? true])
    (not [?e :db/ident])
    (not [?e :file/path])])

(defn- missing-repo
  [label]
  {:ok? false
   :error {:code :missing-repo
           :message (str "repo is required for " label)}})

(defn- invalid-options
  [message]
  {:ok? false
   :error {:code :invalid-options
           :message message}})

(defn- ex-message->code
  [message]
  (when (and (string? message)
             (re-matches #"[a-zA-Z0-9._/\-]+" message))
    (keyword message)))

(defn- exception->error
  [error extra]
  (let [data (or (ex-data error) {})
        code (or (:code data)
                 (ex-message->code (ex-message error))
                 :exception)]
    {:status :error
     :error (merge {:code code
                    :message (or (ex-message error) (str error))}
                   (when (seq data) {:context data})
                   extra)}))

(defn- parse-config-key
  [raw-key]
  (let [raw-key (some-> raw-key string/trim string/lower-case)
        config-key (get config-key-map raw-key)]
    (if config-key
      {:ok? true
       :key config-key}
      (invalid-options (str "unknown config key: " raw-key)))))

(defn build-action
  [command options args repo]
  (case command
    (:sync-status :sync-start :sync-stop :sync-upload)
    (if-not (seq repo)
      (missing-repo (name command))
      {:ok? true
       :action {:type command
                :repo repo
                :graph (core/repo->graph repo)}})

    :sync-download
    (if-not (seq repo)
      (missing-repo (name command))
      {:ok? true
       :action {:type :sync-download
                :repo repo
                :graph (core/repo->graph repo)
                :allow-missing-graph true
                :require-missing-graph true}})

    :sync-remote-graphs
    {:ok? true
     :action {:type :sync-remote-graphs}}

    :sync-ensure-keys
    {:ok? true
     :action {:type :sync-ensure-keys}}

    :sync-grant-access
    (if-not (seq repo)
      (missing-repo "sync grant-access")
      (let [graph-id (some-> (:graph-id options) string/trim)
            email (some-> (:email options) string/trim)]
        (cond
          (not (seq graph-id))
          (invalid-options "--graph-id is required")

          (not (seq email))
          (invalid-options "--email is required")

          :else
          {:ok? true
           :action {:type :sync-grant-access
                    :repo repo
                    :graph (core/repo->graph repo)
                    :graph-id graph-id
                    :email email}})))

    :sync-config-get
    (let [[name] args
          key-result (parse-config-key name)]
      (if-not (seq (some-> name string/trim))
        (invalid-options "config key is required")
        (if-not (:ok? key-result)
        key-result
        {:ok? true
         :action {:type :sync-config-get
                  :config-key (:key key-result)}})))

    :sync-config-set
    (let [[name value] args
          key-result (parse-config-key name)]
      (cond
        (not (seq (some-> name string/trim)))
        (invalid-options "config key is required")

        (not (seq (some-> value str string/trim)))
        (invalid-options "config value is required")

        (not (:ok? key-result))
        key-result

        :else
        {:ok? true
         :action {:type :sync-config-set
                  :config-key (:key key-result)
                  :config-value value}}))

    :sync-config-unset
    (let [[name] args
          key-result (parse-config-key name)]
      (cond
        (not (seq (some-> name string/trim)))
        (invalid-options "config key is required")

        (not (:ok? key-result))
        key-result

        :else
        {:ok? true
         :action {:type :sync-config-unset
                  :config-key (:key key-result)}}))

      {:ok? false
     :error {:code :unknown-command
             :message (str "unknown sync command: " command)}}))

(defn- sync-config
  [config]
  {:ws-url (:ws-url config)
   :http-base (:http-base config)
   :auth-token (:auth-token config)
   :e2ee-password (:e2ee-password config)})

(defn- invoke-with-repo
  [config repo method args]
  (let [sync-cfg (sync-config config)]
    (p/let [cfg (cli-server/ensure-server! config repo)
            _ (transport/invoke cfg :thread-api/set-db-sync-config false [sync-cfg])
          result (transport/invoke cfg method false args)]
      result)))

(defn- invoke-global
  [config method args]
  (let [base-url (:base-url config)
        sync-cfg (sync-config config)]
    (if (seq base-url)
      (p/let [_ (transport/invoke config :thread-api/set-db-sync-config false [sync-cfg])]
        (transport/invoke config method false args))
      (p/let [repo (or (core/resolve-repo (:graph config))
                       (p/let [graphs (cli-server/list-graphs config)]
                         (some-> graphs first core/resolve-repo)))
              cfg (if (seq repo)
                    (cli-server/ensure-server! config repo)
                    (p/rejected (ex-info "graph name is required"
                                         {:code :missing-graph})))
              _ (transport/invoke cfg :thread-api/set-db-sync-config false [sync-cfg])]
        (transport/invoke cfg method false args)))))

(defn- download-config
  [config]
  (assoc config :create-empty-db? true))

(defn- ensure-empty-download-db!
  [cfg repo]
  (p/let [non-empty-entity-count (transport/invoke cfg :thread-api/q false [repo [sync-download-non-empty-query]])]
    (when (and (number? non-empty-entity-count)
               (pos? non-empty-entity-count))
      (throw (ex-info "graph db is not empty"
                      {:code :graph-db-not-empty
                       :repo repo
                       :non-empty-entity-count non-empty-entity-count})))
    nil))

(defn- wait-sync-start-ready
  [config repo action]
  (let [timeout-ms (max 0 (or (:wait-timeout-ms action) sync-start-timeout-ms))
        poll-interval-ms (max 0 (or (:wait-poll-interval-ms action) sync-start-poll-interval-ms))
        deadline (+ (js/Date.now) timeout-ms)
        config-skipped-hint "Set sync config keys (ws-url/http-base/auth-token) and retry sync start."
        graph-id-skipped-hint "Graph-id is missing locally. Run sync download first, then retry sync start."
        runtime-error-hint "Run sync status to inspect last-error and fix sync runtime error before retrying."
        timeout-hint "Run sync status to inspect ws-state and ensure sync endpoint/token are valid."]
    (letfn [(poll! []
              (p/let [status (invoke-with-repo config repo :thread-api/db-sync-status [repo])
                      ws-state (:ws-state status)
                      graph-id (:graph-id status)
                      last-error (:last-error status)
                      skipped-hint (if (seq graph-id)
                                     config-skipped-hint
                                     graph-id-skipped-hint)]
                (cond
                  (and (= :open ws-state) (some? last-error))
                  {:status :error
                   :error {:code :sync-start-runtime-error
                           :message "sync start reached open websocket but runtime sync error is present"
                           :repo repo
                           :ws-state ws-state
                           :status status
                           :last-error last-error
                           :hint runtime-error-hint}}

                  (= :open ws-state)
                  {:status :ok
                   :data status}

                  (contains? sync-start-skipped-states ws-state)
                  {:status :error
                   :error {:code :sync-start-skipped
                           :message "sync start was skipped"
                           :repo repo
                           :ws-state ws-state
                           :status status
                           :hint skipped-hint}}

                  (>= (js/Date.now) deadline)
                  {:status :error
                   :error {:code :sync-start-timeout
                           :message "sync start timed out before websocket reached open state"
                           :repo repo
                           :ws-state ws-state
                           :status status
                           :hint timeout-hint}}

                  :else
                  (p/let [_ (p/delay poll-interval-ms)]
                    (poll!)))))]
      (poll!))))

(defn- execute-sync-upload
  [action config]
  (-> (p/let [result (invoke-with-repo config (:repo action)
                                       :thread-api/db-sync-upload-graph
                                       [(:repo action)])]
        {:status :ok
         :data (if (map? result)
                 result
                 {:result result})})
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)})))))

(defn- execute-sync-download
  [action config]
  (let [config' (download-config config)]
    (-> (p/let [remote-graphs (invoke-global config'
                                             :thread-api/db-sync-list-remote-graphs
                                             [])
                remote-graph (some (fn [graph]
                                     (when (= (:graph action) (:graph-name graph))
                                       graph))
                                   remote-graphs)]
          (if-not remote-graph
            {:status :error
             :error {:code :remote-graph-not-found
                     :message (str "remote graph not found: " (:graph action))
                     :graph (:graph action)}}
            (p/let [cfg (cli-server/ensure-server! config' (:repo action))
                    _ (transport/invoke cfg :thread-api/set-db-sync-config false [(sync-config config')])
                    _ (ensure-empty-download-db! cfg (:repo action))
                    result (transport/invoke cfg :thread-api/db-sync-download-graph-by-id false
                                             [(:repo action) (:graph-id remote-graph) (:graph-e2ee? remote-graph)])]
              {:status :ok
               :data (if (map? result)
                       result
                       {:result result})})))
        (p/catch (fn [error]
                   (exception->error error {:repo (:repo action)
                                            :graph (:graph action)}))))))

(defn execute
  [action config]
  (case (:type action)
    :sync-status
    (p/let [result (invoke-with-repo config (:repo action)
                                     :thread-api/db-sync-status
                                     [(:repo action)])]
      {:status :ok
       :data result})

    :sync-start
    (-> (p/let [_ (invoke-with-repo config (:repo action)
                                    :thread-api/db-sync-start
                                    [(:repo action)])
                result (wait-sync-start-ready config (:repo action) action)]
          result)
        (p/catch (fn [error]
                   (exception->error error {:repo (:repo action)}))))

    :sync-stop
    (p/let [result (invoke-with-repo config (:repo action)
                                     :thread-api/db-sync-stop
                                     [])]
      {:status :ok
       :data {:result result}})

    :sync-upload
    (execute-sync-upload action config)

    :sync-download
    (execute-sync-download action config)

    :sync-remote-graphs
    (p/let [graphs (invoke-global config :thread-api/db-sync-list-remote-graphs [])]
      {:status :ok
       :data {:graphs (or graphs [])}})

    :sync-ensure-keys
    (p/let [result (invoke-global config :thread-api/db-sync-ensure-user-rsa-keys [])]
      {:status :ok
       :data {:result result}})

    :sync-grant-access
    (p/let [result (invoke-with-repo config (:repo action)
                                     :thread-api/db-sync-grant-graph-access
                                     [(:repo action) (:graph-id action) (:email action)])]
      {:status :ok
       :data {:result result}})

    :sync-config-get
    (p/let [current config]
      {:status :ok
       :data {:key (:config-key action)
              :value (get (or current {}) (:config-key action))}})

    :sync-config-set
    (p/let [_ (cli-config/update-config! config {(:config-key action) (:config-value action)})]
      {:status :ok
       :data {:key (:config-key action)
              :value (:config-value action)}})

    :sync-config-unset
    (p/let [_ (cli-config/update-config! config {(:config-key action) nil})]
      {:status :ok
       :data {:key (:config-key action)}})

    (p/resolved {:status :error
                 :error {:code :unknown-action
                         :message "unknown sync action"}})))
