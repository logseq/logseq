(ns logseq.sync.node.config
  (:require [clojure.string :as string]))

(defn- env-value [^js env k]
  (let [v (aget env k)]
    (when (seq v) v)))

(defn- parse-int [v default]
  (let [n (js/parseInt v 10)]
    (if (js/isNaN n) default n)))

(defn config-from-env []
  (let [env (.-env js/process)]
    {:port (when-let [v (env-value env "DB_SYNC_PORT")] (parse-int v 8080))
     :base-url (env-value env "DB_SYNC_BASE_URL")
     :data-dir (or (env-value env "DB_SYNC_DATA_DIR") "data/db-sync")
     :storage-driver (or (env-value env "DB_SYNC_STORAGE_DRIVER") "sqlite")
     :assets-driver (or (env-value env "DB_SYNC_ASSETS_DRIVER") "filesystem")
     :auth-driver (or (env-value env "DB_SYNC_AUTH_DRIVER") "cognito")
     :auth-token (env-value env "DB_SYNC_AUTH_TOKEN")
     :static-user-id (env-value env "DB_SYNC_STATIC_USER_ID")
     :static-email (env-value env "DB_SYNC_STATIC_EMAIL")
     :static-username (env-value env "DB_SYNC_STATIC_USERNAME")
     :agent-runtime-provider (env-value env "AGENT_RUNTIME_PROVIDER")
     :sandbox-agent-url (env-value env "SANDBOX_AGENT_URL")
     :sandbox-agent-token (env-value env "SANDBOX_AGENT_TOKEN")
     :e2b-api-key (env-value env "E2B_API_KEY")
     :e2b-domain (env-value env "E2B_DOMAIN")
     :e2b-template (env-value env "E2B_TEMPLATE")
     :e2b-repo-clone-command (env-value env "E2B_REPO_CLONE_COMMAND")
     :e2b-sandbox-agent-port (env-value env "E2B_SANDBOX_AGENT_PORT")
     :e2b-sandbox-timeout-ms (env-value env "E2B_SANDBOX_TIMEOUT_MS")
     :e2b-health-retries (env-value env "E2B_HEALTH_RETRIES")
     :e2b-health-interval-ms (env-value env "E2B_HEALTH_INTERVAL_MS")
     :github-app-id (env-value env "GITHUB_APP_ID")
     :github-app-installation-id (env-value env "GITHUB_APP_INSTALLATION_ID")
     :github-app-private-key (env-value env "GITHUB_APP_PRIVATE_KEY")
     :github-app-slug (env-value env "GITHUB_APP_SLUG")
     :github-api-base (env-value env "GITHUB_API_BASE")
     :openai-api-key (env-value env "OPENAI_API_KEY")
     :anthropic-api-key (env-value env "ANTHROPIC_API_KEY")
     :openai-base-url (env-value env "OPENAI_BASE_URL")
     :anthropic-base-url (env-value env "ANTHROPIC_BASE_URL")
     :log-level (or (env-value env "DB_SYNC_LOG_LEVEL") "info")
     :cognito-issuer (env-value env "COGNITO_ISSUER")
     :cognito-client-id (env-value env "COGNITO_CLIENT_ID")
     :cognito-jwks-url (env-value env "COGNITO_JWKS_URL")}))

(def ^:private allowed-config-keys
  [:port :base-url :data-dir :storage-driver :assets-driver
   :auth-driver :auth-token :static-user-id :static-email :static-username
   :agent-runtime-provider :sandbox-agent-url :sandbox-agent-token
   :e2b-api-key :e2b-domain :e2b-template :e2b-repo-clone-command
   :e2b-sandbox-agent-port :e2b-sandbox-timeout-ms
   :e2b-health-retries :e2b-health-interval-ms
   :github-app-id :github-app-installation-id :github-app-private-key :github-app-slug :github-api-base
   :openai-api-key :anthropic-api-key :openai-base-url :anthropic-base-url
   :log-level :cognito-issuer :cognito-client-id :cognito-jwks-url])

(defn normalize-config [overrides]
  (let [defaults {:port 8080
                  :data-dir "data/db-sync"
                  :storage-driver "sqlite"
                  :assets-driver "filesystem"
                  :auth-driver "cognito"
                  :log-level "info"}
        merged (merge defaults (config-from-env) overrides)
        auth-driver (string/lower-case (:auth-driver merged))
        storage-driver (string/lower-case (:storage-driver merged))
        assets-driver (string/lower-case (:assets-driver merged))]
    (when-not (#{"cognito" "static" "none"} auth-driver)
      (throw (js/Error. (str "unsupported auth driver: " auth-driver))))
    (when-not (#{"sqlite"} storage-driver)
      (throw (js/Error. (str "unsupported storage driver: " storage-driver))))
    (when-not (#{"filesystem"} assets-driver)
      (throw (js/Error. (str "unsupported assets driver: " assets-driver))))
    (-> merged
        (select-keys allowed-config-keys)
        (assoc :auth-driver auth-driver
               :storage-driver storage-driver
               :assets-driver assets-driver))))
