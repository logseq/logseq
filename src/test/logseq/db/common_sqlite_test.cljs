(ns logseq.db.common-sqlite-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.common.sqlite :as common-sqlite]))

(deftest get-db-full-path-uses-encoded-graph-dir
  (is (= ["foo~2Fbar" "/tmp/graphs/foo~2Fbar/db.sqlite"]
         (common-sqlite/get-db-full-path "/tmp/graphs" "logseq_db_foo/bar"))))

(deftest get-db-backups-path-uses-encoded-graph-dir
  (is (= "/tmp/graphs/foo~2Fbar/backups"
         (common-sqlite/get-db-backups-path "/tmp/graphs" "logseq_db_foo/bar"))))
