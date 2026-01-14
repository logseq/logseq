(ns logseq.cli.config-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is testing]]
            [frontend.test.node-helper :as node-helper]
            [goog.object :as gobj]
            [logseq.cli.config :as config]
            ["fs" :as fs]
            ["path" :as path]))

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
        cfg-path (path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path
                            (str "{:base-url \"http://file:7777\" "
                                 ":auth-token \"file-token\" "
                                 ":repo \"file-repo\" "
                                 ":timeout-ms 111 "
                                 ":retries 1}"))
        env {"LOGSEQ_DB_WORKER_URL" "http://env:9999"
             "LOGSEQ_DB_WORKER_AUTH_TOKEN" "env-token"
             "LOGSEQ_CLI_REPO" "env-repo"
             "LOGSEQ_CLI_TIMEOUT_MS" "222"
             "LOGSEQ_CLI_RETRIES" "2"}
        opts {:config-path cfg-path
              :base-url "http://cli:1234"
              :auth-token "cli-token"
              :repo "cli-repo"
              :timeout-ms 333
              :retries 3}
        result (with-env env #(config/resolve-config opts))]
    (is (= cfg-path (:config-path result)))
    (is (= "http://cli:1234" (:base-url result)))
    (is (= "cli-token" (:auth-token result)))
    (is (= "cli-repo" (:repo result)))
    (is (= 333 (:timeout-ms result)))
    (is (= 3 (:retries result)))))

(deftest test-host-port-derived-base-url
  (let [result (config/resolve-config {:host "127.0.0.2" :port 9200})]
    (is (= "http://127.0.0.2:9200" (:base-url result)))))

(deftest test-env-overrides-file
  (let [dir (node-helper/create-tmp-dir)
        cfg-path (path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path "{:base-url \"http://file:7777\" :repo \"file-repo\"}")
        env {"LOGSEQ_DB_WORKER_URL" "http://env:9999"
             "LOGSEQ_CLI_REPO" "env-repo"}
        result (with-env env #(config/resolve-config {:config-path cfg-path}))]
    (is (= "http://env:9999" (:base-url result)))
    (is (= "env-repo" (:repo result)))))

(deftest test-update-config
  (let [dir (node-helper/create-tmp-dir "cli")
        cfg-path (path/join dir "cli.edn")
        _ (fs/writeFileSync cfg-path "{:repo \"old\"}")
        _ (config/update-config! {:config-path cfg-path} {:repo "new"})
        contents (.toString (fs/readFileSync cfg-path) "utf8")
        parsed (reader/read-string contents)]
    (is (= "new" (:repo parsed)))))
