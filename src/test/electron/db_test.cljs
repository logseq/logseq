(ns electron.db-test
  (:require [cljs.test :refer [deftest is]]
            [electron.db :as electron-db]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.common.graph :as cli-common-graph]
            ["fs-extra" :as fs]
            ["path" :as node-path]))

(deftest ensure-graph-dir-uses-encoded-directory-name
  (let [graphs-dir (node-helper/create-tmp-dir "electron-db-graph-dir")]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [graph-dir (electron-db/ensure-graph-dir! "logseq_db_foo/bar")]
        (is (= (node-path/join graphs-dir "foo~2Fbar") graph-dir))
        (is (fs/existsSync graph-dir))))))

(deftest save-and-read-db-use-encoded-directory-name
  (let [graphs-dir (node-helper/create-tmp-dir "electron-db-save")
        payload (.from js/Buffer "db-data")]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (electron-db/save-db! "logseq_db_foo/bar" payload)
      (is (fs/existsSync (node-path/join graphs-dir "foo~2Fbar" "db.sqlite")))
      (is (= "db-data"
             (.toString (electron-db/get-db "logseq_db_foo/bar")))))))
