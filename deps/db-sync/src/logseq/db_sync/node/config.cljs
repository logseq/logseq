(ns logseq.db-sync.node.config
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
     :openai-api-key (env-value env "OPENAI_API_KEY")
     :codex-api-key (env-value env "CODEX_API_KEY")
     :codex-auth-token (env-value env "CODEX_AUTH_TOKEN")
     :sprites-codex-auth-json (env-value env "SPRITES_CODEX_AUTH_JSON")
     :sprite-token (env-value env "SPRITE_TOKEN")
     :sprites-token (env-value env "SPRITES_TOKEN")
     :sprites-api-url (env-value env "SPRITES_API_URL")
     :sprites-timeout-ms (env-value env "SPRITES_TIMEOUT_MS")
     :sprites-name-prefix (env-value env "SPRITES_NAME_PREFIX")
     :sprites-ram-mb (env-value env "SPRITES_RAM_MB")
     :sprites-cpus (env-value env "SPRITES_CPUS")
     :sprites-region (env-value env "SPRITES_REGION")
     :sprites-storage-gb (env-value env "SPRITES_STORAGE_GB")
     :sprites-bootstrap-command (env-value env "SPRITES_BOOTSTRAP_COMMAND")
     :sprites-sandbox-agent-port (env-value env "SPRITES_SANDBOX_AGENT_PORT")
     :sprites-health-retries (env-value env "SPRITES_HEALTH_RETRIES")
     :sprites-health-interval-ms (env-value env "SPRITES_HEALTH_INTERVAL_MS")
     :log-level (or (env-value env "DB_SYNC_LOG_LEVEL") "info")
     :cognito-issuer (env-value env "COGNITO_ISSUER")
     :cognito-client-id (env-value env "COGNITO_CLIENT_ID")
     :cognito-jwks-url (env-value env "COGNITO_JWKS_URL")}))

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
    (assoc merged
           :auth-driver auth-driver
           :storage-driver storage-driver
           :assets-driver assets-driver)))
