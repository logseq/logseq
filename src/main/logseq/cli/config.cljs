(ns logseq.cli.config
  "CLI configuration resolution and persistence."
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [goog.object :as gobj]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [logseq.common.graph :as common-graph]))

(defn- parse-int
  [value]
  (when (and (some? value) (not (string/blank? value)))
    (js/parseInt value 10)))

(def ^:private output-formats
  #{:human :json :edn})

(defn- parse-output-format
  [value]
  (let [kw (cond
             (keyword? value) value
             (string? value) (-> value string/trim string/lower-case keyword)
             :else nil)]
    (when (output-formats kw)
      kw)))

(defn- default-config-path
  []
  (node-path/join (.homedir os) "logseq" "cli.edn"))

(def ^:private removed-config-keys
  #{:auth-token :retries})

(defn- sanitize-file-config
  [config]
  (apply dissoc (or config {}) removed-config-keys))

(defn- read-config-file
  [config-path]
  (when (and (some? config-path) (fs/existsSync config-path))
    (let [contents (.toString (fs/readFileSync config-path) "utf8")]
      (-> (reader/read-string contents)
          sanitize-file-config))))

(defn- ensure-config-dir!
  [config-path]
  (when (seq config-path)
    (let [dir (node-path/dirname config-path)]
      (when (and (seq dir) (not (fs/existsSync dir)))
        (.mkdirSync fs dir #js {:recursive true})))))

(defn update-config!
  [{:keys [config-path]} updates]
  (let [path (or config-path (default-config-path))
        current (or (read-config-file path) {})
        filtered-current (sanitize-file-config current)
        filtered-updates (sanitize-file-config updates)
        nil-keys (->> filtered-updates
                      (keep (fn [[k v]]
                              (when (nil? v)
                                k))))
        merged (merge filtered-current filtered-updates)
        next (if (seq nil-keys)
               (apply dissoc merged nil-keys)
               merged)]
    (ensure-config-dir! path)
    (.writeFileSync fs path (pr-str next))
    next))

(defn- env-config
  []
  (let [env (.-env js/process)]
    (cond-> {}
      (seq (gobj/get env "LOGSEQ_CLI_GRAPH"))
      (assoc :graph (gobj/get env "LOGSEQ_CLI_GRAPH"))

      (seq (gobj/get env "LOGSEQ_CLI_DATA_DIR"))
      (assoc :data-dir (gobj/get env "LOGSEQ_CLI_DATA_DIR"))

      (seq (gobj/get env "LOGSEQ_CLI_TIMEOUT_MS"))
      (assoc :timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_LOGIN_TIMEOUT_MS"))
      (assoc :login-timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_LOGIN_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS"))
      (assoc :logout-timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_OUTPUT"))
      (assoc :output-format (parse-output-format (gobj/get env "LOGSEQ_CLI_OUTPUT")))

      (seq (gobj/get env "LOGSEQ_CLI_CONFIG"))
      (assoc :config-path (gobj/get env "LOGSEQ_CLI_CONFIG")))))

(defn resolve-config
  [opts]
  (let [defaults {:timeout-ms 10000
                  :login-timeout-ms 300000
                  :logout-timeout-ms 120000
                  :output-format nil
                  :data-dir (common-graph/get-default-graphs-dir)
                  :config-path (default-config-path)}
        env (env-config)
        config-path (or (:config-path opts)
                        (:config-path env)
                        (:config-path defaults))
        file-config (or (read-config-file config-path) {})
        output-format (or (parse-output-format (:output-format opts))
                          (parse-output-format (:output opts))
                          (parse-output-format (:output-format env))
                          (parse-output-format (:output env))
                          (parse-output-format (:output-format file-config))
                          (parse-output-format (:output file-config)))
        merged (merge defaults file-config env opts {:config-path config-path})]
    (cond-> merged
      output-format (assoc :output-format output-format))))
