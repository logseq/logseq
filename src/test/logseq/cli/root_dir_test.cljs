(ns logseq.cli.root-dir-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.root-dir :as root-dir]))

(deftest ensure-root-dir-creates-missing-dir
  (testing "creates missing directories and returns normalized path"
    (let [base (node-helper/create-tmp-dir "root-dir")
          target (node-path/join base "nested" "dir")]
      (is (not (fs/existsSync target)))
      (let [resolved (root-dir/ensure-root-dir! target)]
        (is (fs/existsSync target))
        (is (.isDirectory (fs/statSync target)))
        (is (= (node-path/resolve target) resolved))))))

(deftest ensure-root-dir-rejects-file-path
  (testing "rejects paths that are files"
    (let [base (node-helper/create-tmp-dir "root-dir-file")
          target (node-path/join base "file.txt")]
      (fs/writeFileSync target "x")
      (try
        (root-dir/ensure-root-dir! target)
        (is false "expected root-dir permission error")
        (catch :default e
          (let [data (ex-data e)]
            (is (= :root-dir-permission (:code data)))
            (is (= (node-path/resolve target) (:path data)))))))))

(deftest ensure-root-dir-rejects-read-only-dir
  (testing "rejects directories without write permission"
    (when-not (= "win32" (.-platform js/process))
      (let [target (node-helper/create-tmp-dir "root-dir-readonly")]
        (fs/chmodSync target 365)
        (try
          (root-dir/ensure-root-dir! target)
          (is false "expected root-dir permission error")
          (catch :default e
            (let [data (ex-data e)]
              (is (= :root-dir-permission (:code data)))
              (is (= (node-path/resolve target) (:path data))))))))))

(deftest normalize-root-dir-default
  (testing "defaults to ~/logseq"
    (let [expected (node-path/resolve (node-path/join (.homedir os) "logseq"))
          resolved (root-dir/normalize-root-dir nil)]
      (is (= expected resolved)))))

(deftest graphs-dir-derived-from-root-dir
  (testing "graphs dir is derived as <root-dir>/graphs"
    (let [root-dir-path (node-path/join (.homedir os) "custom-logseq")]
      (is (= (node-path/resolve root-dir-path "graphs")
             (root-dir/graphs-dir root-dir-path))))))
