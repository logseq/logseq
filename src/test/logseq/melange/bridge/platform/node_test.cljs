(ns logseq.melange.bridge.platform.node-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.melange.bridge.platform.node :as platform-node]
            ["fs" :as fs]
            ["path" :as node-path]))

(deftest get-db-based-graphs-canonicalizes-legacy-prefixed-directory-names
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph")
        _ (doseq [dir ["demo"
                       "logseq_db_demo"
                       "logseq_db_logseq_db_demo"
                       "logseq_local_file-graph"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        graphs (platform-node/get-db-based-graphs-in-dir graphs-dir)]
    (is (= #{"logseq_db_demo"} (set graphs)))
    (is (not-any? #(string/starts-with? % "logseq_db_logseq_db_") graphs))))

(deftest get-db-based-graphs-decodes-encoded-graph-directories
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph-encoded")
        _ (doseq [dir ["foo~2Fbar"
                       "a~3Ab"
                       "space name"
                       "space~20name"
                       "space%20name"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        graphs (set (platform-node/get-db-based-graphs-in-dir graphs-dir))]
    (is (= #{"logseq_db_foo/bar"
             "logseq_db_a:b"
             "logseq_db_space name"}
           graphs))))

(deftest get-db-based-graphs-ignores-legacy-graph-dir-encodings
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph-legacy")
        _ (doseq [dir ["foo++bar"
                       "a+3A+b"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (is (= [] (vec (platform-node/get-db-based-graphs-in-dir graphs-dir))))))
