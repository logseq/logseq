(ns logseq.db-sync.node.config
  (:require ["net" :as node-net]
            [clojure.string :as string]))

(defn- env-value [^js env k]
  (let [v (aget env k)]
    (when (seq v) v)))

(defn- parse-int [v default]
  (let [n (js/parseInt v 10)]
    (if (js/isNaN n) default n)))

(defn config-from-env []
  (let [env (.-env js/process)]
    {:port (when-let [v (env-value env "DB_SYNC_PORT")] (parse-int v 8080))
     :host (aget env "DB_SYNC_HOST")
     :base-url (env-value env "DB_SYNC_BASE_URL")
     :data-dir (or (env-value env "DB_SYNC_DATA_DIR") "data/db-sync")
     :storage-driver (or (env-value env "DB_SYNC_STORAGE_DRIVER") "sqlite")
     :assets-driver (or (env-value env "DB_SYNC_ASSETS_DRIVER") "filesystem")
     :log-level (or (env-value env "DB_SYNC_LOG_LEVEL") "info")
     :cognito-issuer (env-value env "COGNITO_ISSUER")
     :cognito-client-id (env-value env "COGNITO_CLIENT_ID")
     :cognito-jwks-url (env-value env "COGNITO_JWKS_URL")}))

(def ^:private allowed-config-keys
  [:port :host :base-url :data-dir :storage-driver :assets-driver :log-level
   :cognito-issuer :cognito-client-id :cognito-jwks-url])

(defn- valid-host? [host]
  (and (string? host)
       (or (pos? (.isIP node-net host))
           (and (<= 1 (count host) 253)
                (every? #(re-matches #"[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?" %)
                        (string/split host #"\." -1))))))

(defn normalize-config [overrides]
  (let [defaults {:port 8080
                  :data-dir "data/db-sync"
                  :storage-driver "sqlite"
                  :assets-driver "filesystem"
                  :log-level "info"}
        merged (merge defaults (config-from-env) overrides)
        host (:host merged)
        storage-driver (string/lower-case (:storage-driver merged))
        assets-driver (string/lower-case (:assets-driver merged))]
    (when (and (or (some? host) (contains? overrides :host))
               (not (valid-host? host)))
      (throw (js/Error. "DB_SYNC_HOST must be an IP address or hostname")))
    (when-not (#{"sqlite"} storage-driver)
      (throw (js/Error. (str "unsupported storage driver: " storage-driver))))
    (when-not (#{"filesystem"} assets-driver)
      (throw (js/Error. (str "unsupported assets driver: " assets-driver))))
    (-> merged
        (select-keys allowed-config-keys)
        (assoc :storage-driver storage-driver
               :assets-driver assets-driver))))
