(ns logseq.db-sync.node.config
  (:require [clojure.string :as string]))

(defn- env-value [^js env k]
  (let [v (aget env k)]
    (when (seq v) v)))

(defn- parse-int [v default]
  (let [n (js/parseInt v 10)]
    (if (js/isNaN n) default n)))

(defn config-from-env []
  (let [env (.-env js/process)
        base-url-raw (env-value env "DB_SYNC_BASE_URL")
        base-urls (when base-url-raw
                    (->> (string/split base-url-raw #"\s*,\s*")
                         (mapv string/trim)
                         (filterv seq)))]
    {:port (when-let [v (env-value env "DB_SYNC_PORT")] (parse-int v 8080))
     :base-url (first base-urls)
     :base-urls base-urls
     :data-dir (or (env-value env "DB_SYNC_DATA_DIR") "data/db-sync")
     :storage-driver (or (env-value env "DB_SYNC_STORAGE_DRIVER") "sqlite")
     :assets-driver (or (env-value env "DB_SYNC_ASSETS_DRIVER") "filesystem")
     :log-level (or (env-value env "DB_SYNC_LOG_LEVEL") "info")
     :cognito-issuer (env-value env "COGNITO_ISSUER")
     :cognito-client-id (env-value env "COGNITO_CLIENT_ID")
     :cognito-jwks-url (env-value env "COGNITO_JWKS_URL")}))

(def ^:private allowed-config-keys
  [:port :base-url :base-urls :data-dir :storage-driver :assets-driver :log-level
   :cognito-issuer :cognito-client-id :cognito-jwks-url])

(defn normalize-config [overrides]
  (let [defaults {:port 8080
                  :data-dir "data/db-sync"
                  :storage-driver "sqlite"
                  :assets-driver "filesystem"
                  :log-level "info"}
        merged (merge defaults (config-from-env) overrides)
        ;; When a single :base-url is passed (e.g. in tests or programmatic use)
        ;; promote it into :base-urls so the rest of the code only needs to
        ;; deal with the vector form.
        merged (cond
                 (and (:base-url merged) (nil? (:base-urls merged)))
                 (assoc merged :base-urls [(:base-url merged)])
                 (and (:base-urls merged) (nil? (:base-url merged)))
                 (assoc merged :base-url (first (:base-urls merged)))
                 :else merged)
        storage-driver (string/lower-case (:storage-driver merged))
        assets-driver (string/lower-case (:assets-driver merged))]
    (when-not (#{"sqlite"} storage-driver)
      (throw (js/Error. (str "unsupported storage driver: " storage-driver))))
    (when-not (#{"filesystem"} assets-driver)
      (throw (js/Error. (str "unsupported assets driver: " assets-driver))))
    (-> merged
        (select-keys allowed-config-keys)
        (assoc :storage-driver storage-driver
               :assets-driver assets-driver))))
