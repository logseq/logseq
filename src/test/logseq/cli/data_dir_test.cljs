(ns logseq.cli.data-dir-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.data-dir :as data-dir]))

(deftest ensure-data-dir-creates-missing-dir
  (testing "creates missing directories and returns normalized path"
    (let [base (node-helper/create-tmp-dir "data-dir")
          target (node-path/join base "nested" "dir")]
      (is (not (fs/existsSync target)))
      (let [resolved (data-dir/ensure-data-dir! target)]
        (is (fs/existsSync target))
        (is (.isDirectory (fs/statSync target)))
        (is (= (node-path/resolve target) resolved))))))

(deftest ensure-data-dir-rejects-file-path
  (testing "rejects paths that are files"
    (let [base (node-helper/create-tmp-dir "data-dir-file")
          target (node-path/join base "file.txt")]
      (fs/writeFileSync target "x")
      (try
        (data-dir/ensure-data-dir! target)
        (is false "expected data-dir permission error")
        (catch :default e
          (let [data (ex-data e)]
            (is (= :data-dir-permission (:code data)))
            (is (= (node-path/resolve target) (:path data)))))))))

(deftest ensure-data-dir-rejects-read-only-dir
  (testing "rejects directories without write permission"
    (let [target (node-helper/create-tmp-dir "data-dir-readonly")]
      (fs/chmodSync target 365)
      (try
        (data-dir/ensure-data-dir! target)
        (is false "expected data-dir permission error")
        (catch :default e
          (let [data (ex-data e)]
            (is (= :data-dir-permission (:code data)))
            (is (= (node-path/resolve target) (:path data)))))))))

(deftest normalize-data-dir-default
  (testing "defaults to ~/logseq/graphs"
    (let [expected (node-path/resolve (node-path/join (.homedir os) "logseq" "graphs"))
          resolved (data-dir/normalize-data-dir nil)]
      (is (= expected resolved)))))
