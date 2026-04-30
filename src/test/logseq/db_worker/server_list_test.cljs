(ns logseq.db-worker.server-list-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db-worker.server-list :as server-list]))

(deftest path-derives-server-list-from-root-dir
  (is (= "/tmp/logseq-root/server-list"
         (server-list/path "/tmp/logseq-root"))))

(deftest path-rejects-missing-root-dir
  (is (thrown-with-msg? js/Error
                        #"root-dir is required"
                        (server-list/path nil))))
