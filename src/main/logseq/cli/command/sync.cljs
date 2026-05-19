(ns logseq.cli.command.sync
  "Sync-related CLI commands."
  (:require ["crypto" :as crypto]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.cli.auth :as cli-auth]
            [logseq.cli.command.core :as core]
            [logseq.cli.common :as cli-common]
            [logseq.cli.config :as cli-config]
            [logseq.cli.output-mode :as output-mode]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.cognito-config :as cognito-config]
            [logseq.common.graph-dir :as graph-dir]
            [promesa.core :as p]))

(def ^:private sync-grant-access-spec
  {:graph-id {:desc "Remote graph UUID"}
   :email {:desc "Target user email"}})

(def ^:private sync-start-spec
  {:e2ee-password {:desc "Verify and persist E2EE password before sync"
                   :coerce :string}})

(def ^:private sync-upload-spec
  {:e2ee-password {:desc "Verify and persist E2EE password before upload"
                   :coerce :string}})

(def ^:private sync-download-spec
  {:progress {:desc "Stream realtime download progress to stdout"
              :coerce :boolean}
   :e2ee-password {:desc "Verify and persist E2EE password before download"
                   :coerce :string}})

(def ^:private sync-asset-download-spec
  {:id {:desc "Target asset node db/id"
        :coerce :long}
   :uuid {:desc "Target asset block UUID"
          :coerce :string
          :validate {:pred (comp parse-uuid str)
                     :ex-msg (constantly "Option uuid must be a valid UUID string")}}})

(def ^:private sync-ensure-keys-spec
  {:e2ee-password {:desc "Verify and persist E2EE password before ensuring user RSA keys"
                   :coerce :string}
   :upload-keys {:desc "Ensure local RSA keys are uploaded to server (checks server presence first)"
                 :coerce :boolean}})

(def entries
  [(core/command-entry ["sync" "status"] :sync-status "Show db-sync runtime status" {}
                       {:examples ["logseq sync status --graph my-graph"]})
   (core/command-entry ["sync" "start"] :sync-start "Start db-sync client" sync-start-spec
                       {:examples ["logseq sync start --graph my-graph"
                                   "logseq sync start --graph my-graph --e2ee-password \"my-secret\""]})
   (core/command-entry ["sync" "stop"] :sync-stop "Stop db-sync client" {}
                       {:examples ["logseq sync stop --graph my-graph"]})
   (core/command-entry ["sync" "upload"] :sync-upload "Initialize upload of the entire graph" sync-upload-spec
                       {:examples ["logseq sync upload --graph my-graph"
                                   "logseq sync upload --graph my-graph --e2ee-password \"my-secret\""]
                        :long-desc "This command initializes upload of the entire graph. It is not for incremental graph data syncing."})
   (core/command-entry ["sync" "download"] :sync-download "Download remote graph snapshot" sync-download-spec
                       {:examples ["logseq sync download --graph my-graph"
                                   "logseq sync download --graph my-graph --progress"
                                   "logseq sync download --graph my-graph --e2ee-password \"my-secret\""]})
   (core/command-entry ["sync" "asset" "download"] :sync-asset-download "Download remote asset" sync-asset-download-spec
                       {:examples ["logseq sync asset download --graph my-graph --id 123"
                                   "logseq sync asset download --graph my-graph --uuid <asset-uuid>"]})
   (core/command-entry ["sync" "remote-graphs"] :sync-remote-graphs "List remote graphs" {})
   (core/command-entry ["sync" "ensure-keys"] :sync-ensure-keys "Ensure user RSA keys for sync/e2ee" sync-ensure-keys-spec
                       {:examples ["logseq sync ensure-keys"
                                   "logseq sync ensure-keys --upload-keys"
                                   "logseq sync ensure-keys --e2ee-password \"my-secret\" --upload-keys"]})
   (core/command-entry ["sync" "grant-access"] :sync-grant-access "Grant graph access to an email" sync-grant-access-spec
                       {:examples ["logseq sync grant-access --graph my-graph --graph-id 8b6ecdd0-1fab-4a9f-b3fb-3069c5f76e95 --email teammate@example.com"]})
   (core/command-entry ["sync" "config" "set"] :sync-config-set "Set sync config key" {}
                       {:examples ["logseq sync config set ws-url wss://sync.logseq.com"
                                   "logseq sync config set http-base https://api.logseq.com"
                                   "logseq sync config set ws-url ws://localhost:12315"
                                   "logseq sync config set http-base http://localhost:8080"
                                   "logseq sync config set ws-url wss://example.com/socket"]})
   (core/command-entry ["sync" "config" "get"] :sync-config-get "Get sync config key" {}
                       {:examples ["logseq sync config get ws-url"]})
   (core/command-entry ["sync" "config" "unset"] :sync-config-unset "Unset sync config key" {}
                       {:examples ["logseq sync config unset ws-url"]})])

(def ^:private config-key-map
  {"ws-url" :ws-url
   "http-base" :http-base})

(def ^:private authenticated-sync-actions
  #{:sync-start
    :sync-upload
    :sync-download
    :sync-asset-download
    :sync-remote-graphs
    :sync-ensure-keys
    :sync-grant-access})

(def ^:private sync-start-timeout-ms 10000)
(def ^:private sync-start-poll-interval-ms 1000)
(def ^:private sync-upload-timeout-ms (* 30 60 1000))
(def ^:private sync-download-timeout-ms (* 30 60 1000))

(def ^:private sync-start-skipped-states
  #{:inactive :stopped})

(def ^:private sync-config-defaults
  {:ws-url "wss://api.logseq.io/sync/%s"
   :http-base "https://api.logseq.io"})

(def ^:private required-sync-config-keys-by-action
  {:sync-start [:ws-url]
   :sync-upload [:http-base]
   :sync-download [:http-base]
   :sync-asset-download [:http-base]
   :sync-grant-access [:http-base]})

(defn- config-value-present?
  [value]
  (cond
    (string? value) (not (string/blank? value))
    :else (some? value)))

(defn- effective-sync-config-value
  [config key]
  (let [sentinel ::missing
        value (get config key sentinel)]
    (if (= sentinel value)
      (get sync-config-defaults key)
      value)))

(defn- missing-required-sync-config-keys
  [action-type config]
  (->> (get required-sync-config-keys-by-action action-type)
       (remove (fn [key]
                 (config-value-present? (effective-sync-config-value config key))))
       vec))

(defn- missing-sync-config-error
  [action-type missing-keys]
  {:status :error
   :error {:code :missing-sync-config
           :message (str "missing required sync config for " (name action-type)
                         ": " (string/join ", " (map name missing-keys)))
           :action action-type
           :missing-keys missing-keys}})

(defn- print-progress-line!
  [line]
  (when (seq (some-> line str string/trim))
    (println line)))

(defn- sync-upload-invoke-config
  [cfg]
  (assoc cfg :timeout-ms (max 0 (or (:sync-upload-timeout-ms cfg)
                                    sync-upload-timeout-ms))))

(defn- sync-download-invoke-config
  [cfg]
  (assoc cfg :timeout-ms (max 0 (or (:sync-download-timeout-ms cfg)
                                    sync-download-timeout-ms))))

(def ^:private sync-download-non-empty-query
  '[:find (count ?e) .
    :where
    (or [?e :block/name]
        [?e :block/page _]
        [?e :block/parent _])
    (not [?e :logseq.property/built-in? true])
    (not [?e :db/ident])
    (not [?e :file/path])])

(def ^:private graph-e2ee-query
  '[:find ?v .
    :where
    [?e :db/ident :logseq.kv/graph-rtc-e2ee?]
    [?e :kv/value ?v]])

(def ^:private asset-tag-ident
  :logseq.class/Asset)

(def ^:private sync-asset-pull-selector
  [:db/id
   :block/uuid
   {:block/tags [:db/ident]}
   :logseq.property.asset/type
   :logseq.property.asset/checksum
   :logseq.property.asset/remote-metadata
   :logseq.property.asset/external-url])

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

(defn- missing-e2ee-password-diagnostic?
  [error]
  (let [data (or (ex-data error) {})
        code (:code data)
        code' (or code (ex-message->code (ex-message error)))]
    (contains? #{:db-sync/missing-e2ee-password
                 :missing-e2ee-password
                 :db-sync/invalid-e2ee-password-payload
                 :invalid-e2ee-password-payload
                 :decrypt-text-by-text-password}
               code')))

(defn- e2ee-password-not-found-error
  [action-type repo]
  {:status :error
   :error {:code :e2ee-password-not-found
           :message "e2ee-password not found"
           :action action-type
           :repo repo
           :hint "Provide --e2ee-password to verify and persist it."}})

(defn- ensure-refresh-token!
  [config]
  (if (seq (:refresh-token config))
    (p/resolved (:refresh-token config))
    (p/let [auth (cli-auth/resolve-auth! config)
            refresh-token (:refresh-token auth)]
      (if (seq refresh-token)
        refresh-token
        (p/rejected (ex-info "missing refresh token"
                             {:code :missing-auth
                              :hint "Run logseq login first."
                              :auth-path (cli-auth/auth-path config)}))))))

(defn- <ensure-e2ee-password-available!
  [cfg config {:keys [type repo e2ee-password]} graph-e2ee?]
  (if-not (true? graph-e2ee?)
    (p/resolved nil)
    (-> (p/let [refresh-token (ensure-refresh-token! config)
                _ (if (seq e2ee-password)
                    (transport/invoke cfg :thread-api/verify-and-save-e2ee-password [refresh-token e2ee-password])
                    (transport/invoke cfg :thread-api/get-e2ee-password [refresh-token]))]
          nil)
        (p/catch (fn [error]
                   (if (missing-e2ee-password-diagnostic? error)
                     (p/rejected (ex-info "e2ee-password-not-found"
                                          {:code :e2ee-password-not-found
                                           :action type
                                           :repo repo
                                           :hint "Provide --e2ee-password to verify and persist it."}
                                          error))
                     (p/rejected error)))))))

(declare invoke-global)

(defn- <verify-and-save-e2ee-password-if-provided!
  [config {:keys [e2ee-password]}]
  (if (seq e2ee-password)
    (p/let [refresh-token (ensure-refresh-token! config)
            _ (invoke-global config :thread-api/verify-and-save-e2ee-password [refresh-token e2ee-password])]
      nil)
    (p/resolved nil)))

(defn- parse-config-key
  [raw-key]
  (let [raw-key (some-> raw-key string/trim string/lower-case)
        config-key (get config-key-map raw-key)]
    (if config-key
      {:ok? true
       :key config-key}
      (invalid-options (str "unknown config key: " raw-key)))))

(defn- build-basic-repo-action
  [command repo]
  (if-not (seq repo)
    (missing-repo (name command))
    {:ok? true
     :action {:type command
              :repo repo
              :graph (core/repo->graph repo)}}))

(defn- build-sync-start-action
  [options repo]
  (if-not (seq repo)
    (missing-repo "sync-start")
    {:ok? true
     :action {:type :sync-start
              :repo repo
              :graph (core/repo->graph repo)
              :e2ee-password (:e2ee-password options)}}))

(defn- build-sync-upload-action
  [options repo]
  (if-not (seq repo)
    (missing-repo "sync-upload")
    {:ok? true
     :action {:type :sync-upload
              :repo repo
              :graph (core/repo->graph repo)
              :e2ee-password (:e2ee-password options)}}))

(defn- build-sync-download-action
  [options repo]
  (if-not (seq repo)
    (missing-repo "sync-download")
    {:ok? true
     :action {:type :sync-download
              :repo repo
              :graph (core/repo->graph repo)
              :allow-missing-graph true
              :require-missing-graph true
              :progress (:progress options)
              :progress-explicit? (contains? options :progress)
              :e2ee-password (:e2ee-password options)}}))

(defn- build-sync-asset-download-action
  [options repo]
  (let [id (:id options)
        asset-uuid (some-> (:uuid options) string/trim)
        id? (some? id)
        has-uuid? (seq asset-uuid)]
    (cond
      (not (seq repo))
      (missing-repo "sync asset download")

      (not= 1 (count (filter true? [id? (boolean has-uuid?)])))
      (invalid-options "exactly one of --id or --uuid is required")

      :else
      {:ok? true
       :action (cond-> {:type :sync-asset-download
                        :repo repo
                        :graph (core/repo->graph repo)}
                 id? (assoc :id id)
                 has-uuid? (assoc :uuid asset-uuid))})))

(defn- build-sync-ensure-keys-action
  [options]
  {:ok? true
   :action {:type :sync-ensure-keys
            :e2ee-password (:e2ee-password options)
            :upload-keys (:upload-keys options)}})

(defn- build-sync-grant-access-action
  [options repo]
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
                  :email email}}))))

(defn- build-sync-config-get-action
  [args]
  (let [[name] args
        key-result (parse-config-key name)]
    (if-not (seq (some-> name string/trim))
      (invalid-options "config key is required")
      (if-not (:ok? key-result)
        key-result
        {:ok? true
         :action {:type :sync-config-get
                  :config-key (:key key-result)}}))))

(defn- build-sync-config-set-action
  [args]
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
                :config-value value}})))

(defn- build-sync-config-unset-action
  [args]
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
                :config-key (:key key-result)}})))

(defn build-action
  [command options args repo]
  (case command
    (:sync-status :sync-stop)
    (build-basic-repo-action command repo)

    :sync-upload
    (build-sync-upload-action options repo)

    :sync-start
    (build-sync-start-action options repo)

    :sync-download
    (build-sync-download-action options repo)

    :sync-asset-download
    (build-sync-asset-download-action options repo)

    :sync-remote-graphs
    {:ok? true
     :action {:type :sync-remote-graphs}}

    :sync-ensure-keys
    (build-sync-ensure-keys-action options)

    :sync-grant-access
    (build-sync-grant-access-action options repo)

    :sync-config-get
    (build-sync-config-get-action args)

    :sync-config-set
    (build-sync-config-set-action args)

    :sync-config-unset
    (build-sync-config-unset-action args)

    {:ok? false
     :error {:code :unknown-command
             :message (str "unknown sync command: " command)}}))

(defn- sync-config
  [config]
  {:ws-url (:ws-url config)
   :http-base (:http-base config)})

(defn- runtime-auth-present?
  [config]
  (or (seq (:id-token config))
      (seq (:access-token config))
      (seq (:refresh-token config))))

(defn- merge-runtime-auth
  [config auth]
  (cond-> config
    (seq (:id-token auth)) (assoc :id-token (:id-token auth))
    (seq (:access-token auth)) (assoc :access-token (:access-token auth))
    (seq (:refresh-token auth)) (assoc :refresh-token (:refresh-token auth))))

(defn- resolve-runtime-config!
  [action config]
  (if (contains? authenticated-sync-actions (:type action))
    (if (runtime-auth-present? config)
      (p/resolved config)
      (p/let [auth (cli-auth/resolve-auth! config)]
        (merge-runtime-auth config auth)))
    (p/resolved config)))

(defn- worker-auth-state
  [config]
  (let [oauth-domain (or (:oauth-domain config)
                         cognito-config/OAUTH-DOMAIN)
        oauth-client-id (or (:oauth-client-id config)
                            cognito-config/CLI-COGNITO-CLIENT-ID)
        oauth-token-url (or (:oauth-token-url config)
                            (when (seq oauth-domain)
                              (str "https://" oauth-domain "/oauth2/token")))
        id-token (:id-token config)
        access-token (:access-token config)
        refresh-token (:refresh-token config)
        has-auth? (or (seq id-token)
                      (seq access-token)
                      (seq refresh-token))]
    (cond-> {}
      (seq id-token) (assoc :auth/id-token id-token)
      (seq access-token) (assoc :auth/access-token access-token)
      (seq refresh-token) (assoc :auth/refresh-token refresh-token)
      (and has-auth? (seq oauth-token-url)) (assoc :auth/oauth-token-url oauth-token-url)
      (and has-auth? (seq oauth-domain)) (assoc :auth/oauth-domain oauth-domain)
      (and has-auth? (seq oauth-client-id)) (assoc :auth/oauth-client-id oauth-client-id))))

(defn- <sync-worker-runtime!
  [cfg config]
  (let [auth-state (worker-auth-state config)]
    (p/let [_ (when (seq auth-state)
                (transport/invoke cfg :thread-api/sync-app-state [auth-state]))
            _ (transport/invoke cfg :thread-api/set-db-sync-config [(sync-config config)])]
      nil)))

(defn- invoke-with-repo
  [config repo method args]
  (p/let [cfg (cli-server/ensure-server! config repo)
          _ (<sync-worker-runtime! cfg config)
          result (transport/invoke cfg method args)]
    result))

(defn- asset-download-error
  [code message action extra]
  {:status :error
   :error (merge {:code code
                  :message message
                  :repo (:repo action)
                  :graph (:graph action)}
                 extra)})

(defn- sync-asset-lookup-ref
  [{:keys [id] :as action}]
  (let [asset-uuid (:uuid action)]
    (if (some? id)
      id
      [:block/uuid (uuid asset-uuid)])))

(defn- resolve-sync-asset
  [cfg action]
  (transport/invoke cfg :thread-api/pull
                    [(:repo action)
                     sync-asset-pull-selector
                     (sync-asset-lookup-ref action)]))

(defn- asset-tag?
  [tag]
  (cond
    (= asset-tag-ident tag) true
    (map? tag) (= asset-tag-ident (:db/ident tag))
    :else false))

(defn- validate-sync-asset
  [action asset]
  (let [asset-uuid (:block/uuid asset)
        asset-type (:logseq.property.asset/type asset)
        checksum (:logseq.property.asset/checksum asset)]
    (cond
      (nil? asset)
      (asset-download-error :asset-not-found "asset not found" action nil)

      (not-any? asset-tag? (:block/tags asset))
      (asset-download-error :not-asset "selected entity is not an asset" action {:asset-id (:db/id asset)})

      (not (seq (some-> asset-uuid str string/trim)))
      (asset-download-error :asset-uuid-missing "asset uuid is missing" action {:asset-id (:db/id asset)})

      (not (seq (some-> asset-type str string/trim)))
      (asset-download-error :asset-type-missing "asset type is missing" action {:asset-id (:db/id asset)
                                                                                :asset-uuid asset-uuid})

      (not (seq (some-> checksum str string/trim)))
      (asset-download-error :asset-checksum-missing "asset checksum is missing" action {:asset-id (:db/id asset)
                                                                                        :asset-uuid asset-uuid})

      (nil? (:logseq.property.asset/remote-metadata asset))
      (asset-download-error :asset-not-remote "asset remote metadata is missing" action {:asset-id (:db/id asset)
                                                                                         :asset-uuid asset-uuid})

      (seq (some-> (:logseq.property.asset/external-url asset) str string/trim))
      (asset-download-error :external-asset "external URL assets cannot be downloaded through sync" action {:asset-id (:db/id asset)
                                                                                                             :asset-uuid asset-uuid})

      :else
      {:status :ok
       :asset asset})))

(defn- sync-active?
  [status]
  (and (= :open (:ws-state status))
       (seq (some-> (:graph-id status) str string/trim))))

(defn- sync-not-started-error
  [action status]
  (asset-download-error :sync-not-started
                        "sync is not started for this graph"
                        action
                        {:status status
                         :hint (str "Run logseq sync start --graph " (:graph action) " first.")}))

(defn- asset-file-exists?
  [path]
  (and (seq path)
       (fs/existsSync path)))

(defn- asset-file-checksum
  [path]
  (-> (.createHash crypto "sha256")
      (.update (fs/readFileSync path))
      (.digest "hex")))

(defn- graph-asset-file-path
  [config repo asset-uuid asset-type]
  (if-let [graph-dir-name (graph-dir/repo->encoded-graph-dir-name repo)]
    (node-path/join (cli-server/graphs-dir config)
                    graph-dir-name
                    "assets"
                    (str asset-uuid "." asset-type))
    (throw (ex-info "invalid repo"
                    {:code :invalid-repo
                     :repo repo}))))

(defn- asset-download-result-data
  [asset download-requested? checksum-status extra]
  (cond-> {:asset-uuid (str (:block/uuid asset))
           :asset-type (:logseq.property.asset/type asset)
           :download-requested? download-requested?
           :checksum-status checksum-status}
    (some? (:db/id asset)) (assoc :asset-id (:db/id asset))
    (seq extra) (merge extra)))

(defn- local-asset-checksum-status
  [config action asset]
  (let [asset-path (graph-asset-file-path config
                                          (:repo action)
                                          (:block/uuid asset)
                                          (:logseq.property.asset/type asset))]
    (if-not (asset-file-exists? asset-path)
      {:checksum-status :missing}
      (let [local-checksum (asset-file-checksum asset-path)]
        (if (= local-checksum (:logseq.property.asset/checksum asset))
          {:checksum-status :match}
          {:checksum-status :mismatch
           :local-path asset-path
           :local-checksum local-checksum})))))

(defn- remove-local-asset-file!
  [path]
  (when (asset-file-exists? path)
    (fs/rmSync path #js {:force true})))

(defn- request-asset-download-result
  [cfg action asset checksum-status extra]
  (p/let [_ (transport/invoke cfg :thread-api/db-sync-request-asset-download
                              [(:repo action) (:block/uuid asset)])]
    {:status :ok
     :data (asset-download-result-data asset true checksum-status extra)}))

(defn- execute-sync-asset-download*
  [cfg config action asset]
  (let [validation (validate-sync-asset action asset)]
    (if (= :error (:status validation))
      (p/resolved validation)
      (p/let [status (transport/invoke cfg :thread-api/db-sync-status [(:repo action)])]
        (if-not (sync-active? status)
          (sync-not-started-error action status)
          (let [{:keys [checksum-status local-path]} (local-asset-checksum-status config action asset)]
            (case checksum-status
              :match
              {:status :ok
               :data (asset-download-result-data asset false :match {:skipped-reason :already-downloaded})}

              :mismatch
              (do
                (remove-local-asset-file! local-path)
                (request-asset-download-result cfg
                                               action
                                               asset
                                               :mismatch
                                               {:hint "Local asset checksum mismatched; requested re-download."}))

              (request-asset-download-result cfg action asset :missing nil))))))))

(defn- invoke-global
  [config method args]
  (let [base-url (:base-url config)]
    (if (seq base-url)
      (p/let [_ (<sync-worker-runtime! config config)]
        (transport/invoke config method args))
      (p/let [repo (or (core/resolve-repo (:graph config))
                       (p/let [graphs (cli-server/list-graphs config)]
                         (some-> graphs first core/resolve-repo)))
              cfg (if (seq repo)
                    (cli-server/ensure-server! config repo)
                    (p/rejected (ex-info "graph name is required"
                                         {:code :missing-graph})))
              _ (<sync-worker-runtime! cfg config)]
        (transport/invoke cfg method args)))))

(defn- download-config
  [config]
  (assoc config :create-empty-db? true))

(defn- ensure-empty-download-db!
  [cfg repo]
  (p/let [non-empty-entity-count (transport/invoke cfg :thread-api/q [repo [sync-download-non-empty-query]])]
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
        config-skipped-hint "Run logseq login, set sync config keys (ws-url/http-base), and retry sync start."
        graph-id-skipped-hint "Graph-id is missing locally. Run sync download first, then retry sync start."
        runtime-error-hint "Run sync status to inspect last-error and fix sync runtime error before retrying."
        timeout-hint "Run sync status to inspect ws-state and ensure sync endpoint/token are valid."]
    (letfn [(poll! [initial?]
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

                  (and initial? (contains? sync-start-skipped-states ws-state))
                  (p/let [_ (invoke-with-repo config repo :thread-api/db-sync-start [repo])
                          _ (p/delay poll-interval-ms)]
                    (poll! false))

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
                    (poll! false)))))]
      (poll! true))))

(defn- <verify-and-save-e2ee-password-on-worker-if-provided!
  [cfg config {:keys [e2ee-password]}]
  (if (seq e2ee-password)
    (p/let [refresh-token (ensure-refresh-token! config)
            _ (transport/invoke cfg :thread-api/verify-and-save-e2ee-password [refresh-token e2ee-password])]
      nil)
    (p/resolved nil)))

(defn- execute-sync-upload
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              upload-cfg (sync-upload-invoke-config cfg)
              _ (<sync-worker-runtime! cfg config)
              _ (<verify-and-save-e2ee-password-on-worker-if-provided! upload-cfg config action)
              result (transport/invoke upload-cfg :thread-api/db-sync-upload-graph [(:repo action)])]
        {:status :ok
         :data (if (map? result)
                 result
                 {:result result})})
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)})))))

(defn- sync-download-progress-enabled?
  [action config]
  (if (:progress-explicit? action)
    (true? (:progress action))
    (not (output-mode/structured? (:output-format config)))))

(defn- download-progress-message
  [graph-id event-type payload]
  (when (and (= :rtc-log event-type)
             (map? payload)
             (= :rtc.log/download (:type payload))
             (= graph-id (:graph-uuid payload)))
    (:message payload)))

(defn- cleanup-error-details
  [error]
  (let [data (ex-data error)]
    (cond-> {:code (or (:code data) :exception)
             :message (or (ex-message error) (str error))}
      (seq data) (assoc :context data))))

(defn- <cleanup-created-download-graph!
  [config repo]
  (-> (p/let [stop-result (cli-server/stop-server! config repo)
              _ (when-not (or (:ok? stop-result)
                              (= :server-not-found (get-in stop-result [:error :code])))
                  (throw (ex-info (get-in stop-result [:error :message] "failed to stop server")
                                  {:code (get-in stop-result [:error :code])
                                   :repo repo
                                   :stage :stop-server
                                   :stop-result stop-result})))
              graphs-after-stop (cli-server/list-graphs config)
              graph-exists? (some #(= (core/repo->graph repo) %) graphs-after-stop)
              unlinked-dir (when graph-exists?
                             (cli-common/unlink-graph! (cli-server/graphs-dir config) repo))
              _ (when (and graph-exists? (not unlinked-dir))
                  (throw (ex-info "unable to remove graph"
                                  {:code :graph-not-removed
                                   :repo repo
                                   :stage :unlink-graph})))]
        {:status :ok
         :data {:repo repo
                :unlinked-dir unlinked-dir}})
      (p/catch (fn [error]
                 (log/warn :cli-sync-download-cleanup-failed
                           {:repo repo
                            :error (cleanup-error-details error)})
                 {:status :error
                  :error (cleanup-error-details error)}))))

(defn- execute-sync-download
  [action config]
  (let [config' (download-config config)
        progress-enabled? (sync-download-progress-enabled? action config')]
    (p/let [local-graphs-before (cli-server/list-graphs config')
            graph-existed-before? (some #(= (:graph action) %) local-graphs-before)]
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
                      _ (<sync-worker-runtime! cfg config')
                      _ (<ensure-e2ee-password-available! cfg config' action (true? (:graph-e2ee? remote-graph)))
                      _ (ensure-empty-download-db! cfg (:repo action))
                      download-cfg (sync-download-invoke-config cfg)
                      graph-id (:graph-id remote-graph)
                      events-sub (when progress-enabled?
                                   (transport/connect-events!
                                    download-cfg
                                    (fn [event-type payload]
                                      (when-let [message (download-progress-message graph-id event-type payload)]
                                        (print-progress-line! message)))))
                      result (-> (transport/invoke download-cfg :thread-api/db-sync-download-graph-by-id
                                                   [(:repo action) graph-id (:graph-e2ee? remote-graph)])
                                 (p/finally (fn []
                                              (when-let [close! (:close! events-sub)]
                                                (close!)))))]
                {:status :ok
                 :data (if (map? result)
                         result
                         {:result result})})))
          (p/then (fn [result]
                    (if (and (not graph-existed-before?)
                             (= :error (:status result)))
                      (p/let [_ (<cleanup-created-download-graph! config' (:repo action))]
                        result)
                      result)))
          (p/catch (fn [error]
                     (p/let [_ (when-not graph-existed-before?
                                  (<cleanup-created-download-graph! config' (:repo action)))]
                       (if (= :e2ee-password-not-found (:code (ex-data error)))
                         (e2ee-password-not-found-error :sync-download (:repo action))
                         (exception->error error {:repo (:repo action)
                                                  :graph (:graph action)})))))))))

(defn- run-sync-status
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              cfg (cli-server/ensure-server! config' (:repo action))
              _ (<sync-worker-runtime! cfg config')
              result (transport/invoke cfg :thread-api/db-sync-status [(:repo action)])]
        {:status :ok
         :data result})
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)})))))

(defn- run-sync-start
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              missing-keys (missing-required-sync-config-keys (:type action) config')
              start-config (assoc config' :ws-url (effective-sync-config-value config' :ws-url))]
        (if (seq missing-keys)
          (missing-sync-config-error (:type action) missing-keys)
          (p/let [cfg (cli-server/ensure-server! start-config (:repo action))
                  _ (<sync-worker-runtime! cfg start-config)
                  graph-e2ee? (transport/invoke cfg :thread-api/q [(:repo action) [graph-e2ee-query]])
                  _ (<ensure-e2ee-password-available! cfg start-config action (true? graph-e2ee?))
                  _ (transport/invoke cfg :thread-api/db-sync-start [(:repo action)])
                  result (wait-sync-start-ready start-config (:repo action) action)]
            result)))
      (p/catch (fn [error]
                 (if (= :e2ee-password-not-found (:code (ex-data error)))
                   (e2ee-password-not-found-error :sync-start (:repo action))
                   (exception->error error {:repo (:repo action)}))))))

(defn- run-sync-stop
  [action config]
  (p/let [result (invoke-with-repo config (:repo action)
                                   :thread-api/db-sync-stop
                                   [])]
    {:status :ok
     :data {:result result}}))

(defn- run-sync-upload
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              missing-keys (missing-required-sync-config-keys (:type action) config')]
        (if (seq missing-keys)
          (missing-sync-config-error (:type action) missing-keys)
          (execute-sync-upload action config')))
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)})))))

(defn- run-sync-download
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              missing-keys (missing-required-sync-config-keys (:type action) config')]
        (if (seq missing-keys)
          (missing-sync-config-error (:type action) missing-keys)
          (execute-sync-download action config')))
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)
                                          :graph (:graph action)})))))

(defn- run-sync-asset-download
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              missing-keys (missing-required-sync-config-keys (:type action) config')]
        (if (seq missing-keys)
          (missing-sync-config-error (:type action) missing-keys)
          (let [config* (assoc config' :http-base (effective-sync-config-value config' :http-base))]
            (p/let [cfg (cli-server/ensure-server! config* (:repo action))
                    _ (<sync-worker-runtime! cfg config*)
                    asset (resolve-sync-asset cfg action)]
              (execute-sync-asset-download* cfg config* action asset)))))
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)
                                          :graph (:graph action)})))))

(defn- run-sync-remote-graphs
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              graphs (invoke-global config' :thread-api/db-sync-list-remote-graphs [])]
        {:status :ok
         :data {:graphs (or graphs [])}})
      (p/catch (fn [error]
                 (exception->error error nil)))))

(defn- sync-ensure-keys-upload-options
  [{:keys [upload-keys e2ee-password]}]
  (when (true? upload-keys)
    (cond-> {:ensure-server? true}
      (seq e2ee-password) (assoc :password e2ee-password))))

(defn- run-sync-ensure-keys
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              upload-options (sync-ensure-keys-upload-options action)
              _ (when-not upload-options
                  (<verify-and-save-e2ee-password-if-provided! config' action))
              result (invoke-global config'
                                    :thread-api/db-sync-ensure-user-rsa-keys
                                    (if upload-options [upload-options] []))
              _ (when upload-options
                  (<verify-and-save-e2ee-password-if-provided! config' action))]
        {:status :ok
         :data {:result result}})
      (p/catch (fn [error]
                 (exception->error error nil)))))

(defn- run-sync-grant-access
  [action config]
  (-> (p/let [config' (resolve-runtime-config! action config)
              missing-keys (missing-required-sync-config-keys (:type action) config')]
        (if (seq missing-keys)
          (missing-sync-config-error (:type action) missing-keys)
          (p/let [result (invoke-with-repo config' (:repo action)
                                           :thread-api/db-sync-grant-graph-access
                                           [(:repo action) (:graph-id action) (:email action)])]
            {:status :ok
             :data {:result result}})))
      (p/catch (fn [error]
                 (exception->error error {:repo (:repo action)
                                          :graph-id (:graph-id action)
                                          :email (:email action)})))))

(defn- run-sync-config-get
  [action config]
  (p/let [current config]
    {:status :ok
     :data {:key (:config-key action)
            :value (get (or current {}) (:config-key action))}}))

(defn- run-sync-config-set
  [action config]
  (p/let [_ (cli-config/update-config! config {(:config-key action) (:config-value action)})]
    {:status :ok
     :data {:key (:config-key action)
            :value (:config-value action)}}))

(defn- run-sync-config-unset
  [action config]
  (p/let [_ (cli-config/update-config! config {(:config-key action) nil})]
    {:status :ok
     :data {:key (:config-key action)}}))

(defn execute
  [action config]
  (case (:type action)
    :sync-status (run-sync-status action config)
    :sync-start (run-sync-start action config)
    :sync-stop (run-sync-stop action config)
    :sync-upload (run-sync-upload action config)
    :sync-download (run-sync-download action config)
    :sync-asset-download (run-sync-asset-download action config)
    :sync-remote-graphs (run-sync-remote-graphs action config)
    :sync-ensure-keys (run-sync-ensure-keys action config)
    :sync-grant-access (run-sync-grant-access action config)
    :sync-config-get (run-sync-config-get action config)
    :sync-config-set (run-sync-config-set action config)
    :sync-config-unset (run-sync-config-unset action config)
    (p/resolved {:status :error
                 :error {:code :unknown-action
                         :message "unknown sync action"}})))
