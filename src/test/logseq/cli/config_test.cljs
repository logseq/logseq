(ns logseq.cli.config-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is]]
            [frontend.test.node-helper :as node-helper]
            [goog.object :as gobj]
            [logseq.cli.config :as config]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn- with-env
  [env f]
  (let [original (js/Object.assign #js {} (.-env js/process))]
    (doseq [[k v] env]
      (if (some? v)
        (gobj/set (.-env js/process) k v)
        (gobj/remove (.-env js/process) k)))
    (try
      (f)
      (finally
        (set! (.-env js/process) original)))))

(deftest test-config-precedence
  (let [dir (node-helper/create-tmp-dir)
        cfg-path (node-path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path
                            (str "{:auth-token \"file-token\" "
                                 ":repo \"file-repo\" "
                                 ":data-dir \"file-data\" "
                                 ":timeout-ms 111 "
                                 ":retries 1 "
                                 ":output-format :edn}"))
        env {"LOGSEQ_DB_WORKER_AUTH_TOKEN" "env-token"
             "LOGSEQ_CLI_REPO" "env-repo"
             "LOGSEQ_CLI_DATA_DIR" "env-data"
             "LOGSEQ_CLI_TIMEOUT_MS" "222"
             "LOGSEQ_CLI_RETRIES" "2"
             "LOGSEQ_CLI_OUTPUT" "json"}
        opts {:config-path cfg-path
              :auth-token "cli-token"
              :repo "cli-repo"
              :data-dir "cli-data"
              :timeout-ms 333
              :retries 3
              :output-format :human}
        result (with-env env #(config/resolve-config opts))]
    (is (= cfg-path (:config-path result)))
    (is (= "cli-token" (:auth-token result)))
    (is (= "cli-repo" (:repo result)))
    (is (= "cli-data" (:data-dir result)))
    (is (= 333 (:timeout-ms result)))
    (is (= 3 (:retries result)))
    (is (= :human (:output-format result)))))

(deftest test-env-overrides-file
  (let [dir (node-helper/create-tmp-dir)
        cfg-path (node-path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path "{:repo \"file-repo\" :data-dir \"file-data\"}")
        env {"LOGSEQ_CLI_REPO" "env-repo"
             "LOGSEQ_CLI_DATA_DIR" "env-data"}
        result (with-env env #(config/resolve-config {:config-path cfg-path}))]
    (is (= "env-repo" (:repo result)))
    (is (= "env-data" (:data-dir result)))))

(deftest test-output-format-env-overrides-file
  (let [dir (node-helper/create-tmp-dir)
        cfg-path (node-path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path "{:output-format :edn}")
        env {"LOGSEQ_CLI_OUTPUT" "json"}
        result (with-env env #(config/resolve-config {:config-path cfg-path}))]
    (is (= :json (:output-format result)))))

(deftest test-output-format-precedence
  (let [dir (node-helper/create-tmp-dir)
        cfg-path (node-path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path "{:output-format :edn}")
        env {"LOGSEQ_CLI_OUTPUT" "json"}
        result (with-env env #(config/resolve-config {:config-path cfg-path
                                                      :output "human"}))]
    (is (= :human (:output-format result)))))

(deftest test-output-format-overrides-output
  (let [result (config/resolve-config {:output-format :edn
                                       :output "json"})]
    (is (= :edn (:output-format result)))))

(deftest test-update-config
  (let [dir (node-helper/create-tmp-dir "cli")
        cfg-path (node-path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path "{:repo \"old\"}")
        _ (config/update-config! {:config-path cfg-path} {:repo "new"})
        contents (.toString (fs/readFileSync cfg-path) "utf8")
        parsed (reader/read-string contents)]
    (is (= "new" (:repo parsed)))))
