(ns logseq.cli.config
  "CLI configuration resolution and persistence."
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [goog.object :as gobj]
            ["fs" :as fs]
            ["path" :as node-path]
            [logseq.cli.output-mode :as output-mode]
            [logseq.cli.root-dir :as root-dir]
            [logseq.db-worker.server-list :as server-list]))

(defn- parse-int
  [value]
  (when (and (some? value) (not (string/blank? value)))
    (js/parseInt value 10)))

(def ^:private list-title-max-display-width-default 40)

(defn- parse-positive-int
  [value]
  (cond
    (and (number? value)
         (integer? value)
         (pos? value))
    value

    (string? value)
    (let [trimmed (string/trim value)]
      (when (re-matches #"[1-9]\d*" trimmed)
        (js/parseInt trimmed 10)))

    :else nil))

(defn- default-config-path
  ([]
   (default-config-path (root-dir/default-root-dir)))
  ([root-dir]
   (node-path/join root-dir "cli.edn")))

(defn server-list-path
  [root-dir]
  (server-list/path (or root-dir (root-dir/default-root-dir))))

(def ^:private removed-config-keys
  #{:auth-token :retries :e2ee-password})

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
  [{:keys [config-path root-dir]} updates]
  (let [path (or config-path (default-config-path (root-dir/normalize-root-dir root-dir)))
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

      (seq (gobj/get env "LOGSEQ_CLI_ROOT_DIR"))
      (assoc :root-dir (gobj/get env "LOGSEQ_CLI_ROOT_DIR"))

      (seq (gobj/get env "LOGSEQ_CLI_TIMEOUT_MS"))
      (assoc :timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_LOGIN_TIMEOUT_MS"))
      (assoc :login-timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_LOGIN_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS"))
      (assoc :logout-timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_OUTPUT"))
      (assoc :output-format (output-mode/parse (gobj/get env "LOGSEQ_CLI_OUTPUT")))

      (seq (gobj/get env "LOGSEQ_CLI_CONFIG"))
      (assoc :config-path (gobj/get env "LOGSEQ_CLI_CONFIG")))))

(defn resolve-config
  [opts]
  (let [defaults {:timeout-ms 10000
                  :login-timeout-ms 300000
                  :logout-timeout-ms 120000
                  :list-title-max-display-width list-title-max-display-width-default
                  :output-format nil
                  :root-dir (root-dir/default-root-dir)
                  :ws-url "wss://api.logseq.io/sync/%s"
                  :http-base "https://api.logseq.io"}
        env (env-config)
        root-dir (root-dir/normalize-root-dir
                  (or (:root-dir opts)
                      (:root-dir env)
                      (:root-dir defaults)))
        config-path (or (:config-path opts)
                        (:config-path env)
                        (default-config-path root-dir))
        file-config (or (read-config-file config-path) {})
        root-dir (root-dir/normalize-root-dir
                  (or (:root-dir opts)
                      (:root-dir env)
                      (:root-dir file-config)
                      root-dir))
        output-format (or (output-mode/parse (:output-format opts))
                          (output-mode/parse (:output opts))
                          (output-mode/parse (:output-format env))
                          (output-mode/parse (:output env))
                          (output-mode/parse (:output-format file-config))
                          (output-mode/parse (:output file-config)))
        merged (merge defaults file-config env opts {:root-dir root-dir
                                                     :config-path config-path})
        list-title-max-display-width (or (parse-positive-int (:list-title-max-display-width merged))
                                         list-title-max-display-width-default)]
    (cond-> merged
      output-format (assoc :output-format output-format)
      true (assoc :list-title-max-display-width list-title-max-display-width))))
