(ns frontend.worker.db-worker-node-lock-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node-lock :as db-lock]))

(deftest repo-dir-canonicalizes-db-prefixed-repo
  (testing "db-prefixed repo name resolves to prefix-free graph directory key"
    (let [data-dir "/tmp/logseq-db-worker-node-lock"
          expected (node-path/join data-dir "demo")]
      (is (= expected (db-lock/repo-dir data-dir "logseq_db_demo"))))))

(deftest repo-dir-canonicalizes-prefix-free-repo
  (testing "prefix-free repo name resolves to same graph directory key"
    (let [data-dir "/tmp/logseq-db-worker-node-lock"
          expected (node-path/join data-dir "demo")]
      (is (= expected (db-lock/repo-dir data-dir "demo"))))))

(deftest repo-dir-does-not-migrate-legacy-prefixed-dir
  (testing "canonical resolution does not rename legacy prefixed directories"
    (let [data-dir (node-helper/create-tmp-dir "db-worker-node-lock")
          legacy-dir (node-path/join data-dir "logseq_db_demo")
          canonical-dir (node-path/join data-dir "demo")]
      (fs/mkdirSync legacy-dir #js {:recursive true})
      (is (= canonical-dir (db-lock/repo-dir data-dir "logseq_db_demo")))
      (is (fs/existsSync legacy-dir))
      (is (not (fs/existsSync canonical-dir))))))

(deftest lock-path-default-data-dir-uses-canonical-graph-dir
  (testing "default data-dir lock path is built with canonical <graph> directory naming"
    (let [default-data-dir (db-lock/resolve-data-dir nil)
          expected-data-dir (node-path/join (.homedir os) "logseq" "graphs")
          expected-lock-path (node-path/join expected-data-dir "demo" "db-worker.lock")]
      (is (= expected-data-dir default-data-dir))
      (is (= expected-lock-path (db-lock/lock-path default-data-dir "logseq_db_demo"))))))
