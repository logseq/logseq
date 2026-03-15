(ns logseq.cli.common.graph-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.common.graph :as cli-common-graph]
            ["fs" :as fs]
            ["path" :as node-path]))

(deftest get-db-based-graphs-canonicalizes-legacy-prefixed-directory-names
  (let [graphs-dir (node-helper/create-tmp-dir "cli-common-graph")
        _ (doseq [dir ["demo"
                       "logseq_db_demo"
                       "logseq_db_logseq_db_demo"
                       "logseq_local_file-graph"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [graphs (cli-common-graph/get-db-based-graphs)]
        (is (= #{"logseq_db_demo"} (set graphs)))
        (is (not-any? #(string/starts-with? % "logseq_db_logseq_db_") graphs))))))

(deftest get-db-based-graphs-decodes-encoded-graph-directories
  (let [graphs-dir (node-helper/create-tmp-dir "cli-common-graph-encoded")
        _ (doseq [dir ["foo~2Fbar"
                       "a~3Ab"
                       "space~20name"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [graphs (set (cli-common-graph/get-db-based-graphs))]
        (is (= #{"logseq_db_foo/bar"
                 "logseq_db_a:b"
                 "logseq_db_space name"}
               graphs))))))

(deftest get-db-based-graphs-ignores-legacy-graph-dir-encodings
  (let [graphs-dir (node-helper/create-tmp-dir "cli-common-graph-legacy")
        _ (doseq [dir ["foo++bar"
                       "a+3A+b"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (is (= [] (cli-common-graph/get-db-based-graphs))))))
