(ns logseq.cli.config
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [goog.object :as gobj]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as path]))

(defn- parse-int
  [value]
  (when (and (some? value) (not (string/blank? value)))
    (js/parseInt value 10)))

(defn- default-config-path
  []
  (path/join (.homedir os) ".logseq" "cli.edn"))

(defn- read-config-file
  [config-path]
  (when (and (some? config-path) (fs/existsSync config-path))
    (let [contents (.toString (fs/readFileSync config-path) "utf8")]
      (reader/read-string contents))))

(defn- ensure-config-dir!
  [config-path]
  (when (seq config-path)
    (let [dir (path/dirname config-path)]
      (when (and (seq dir) (not (fs/existsSync dir)))
        (.mkdirSync fs dir #js {:recursive true})))))

(defn update-config!
  [{:keys [config-path]} updates]
  (let [path (or config-path (default-config-path))
        current (or (read-config-file path) {})
        next (merge current updates)]
    (ensure-config-dir! path)
    (.writeFileSync fs path (pr-str next))
    next))

(defn- env-config
  []
  (let [env (.-env js/process)]
    (cond-> {}
      (seq (gobj/get env "LOGSEQ_DB_WORKER_URL"))
      (assoc :base-url (gobj/get env "LOGSEQ_DB_WORKER_URL"))

      (seq (gobj/get env "LOGSEQ_DB_WORKER_AUTH_TOKEN"))
      (assoc :auth-token (gobj/get env "LOGSEQ_DB_WORKER_AUTH_TOKEN"))

      (seq (gobj/get env "LOGSEQ_CLI_REPO"))
      (assoc :repo (gobj/get env "LOGSEQ_CLI_REPO"))

      (seq (gobj/get env "LOGSEQ_CLI_TIMEOUT_MS"))
      (assoc :timeout-ms (parse-int (gobj/get env "LOGSEQ_CLI_TIMEOUT_MS")))

      (seq (gobj/get env "LOGSEQ_CLI_RETRIES"))
      (assoc :retries (parse-int (gobj/get env "LOGSEQ_CLI_RETRIES")))

      (seq (gobj/get env "LOGSEQ_CLI_CONFIG"))
      (assoc :config-path (gobj/get env "LOGSEQ_CLI_CONFIG")))))

(defn- build-base-url
  [{:keys [host port]}]
  (when (or (seq host) (some? port))
    (str "http://" (or host "127.0.0.1") ":" (or port 9101))))

(defn resolve-config
  [opts]
  (let [defaults {:base-url "http://127.0.0.1:9101"
                  :timeout-ms 10000
                  :retries 0
                  :json? false
                  :output-format nil
                  :config-path (default-config-path)}
        env (env-config)
        config-path (or (:config-path opts)
                        (:config-path env)
                        (:config-path defaults))
        file-config (or (read-config-file config-path) {})
        merged (merge defaults file-config env opts {:config-path config-path})
        derived (build-base-url merged)]
    (cond-> merged
      (seq derived) (assoc :base-url derived))))
