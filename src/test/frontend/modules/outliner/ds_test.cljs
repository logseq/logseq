(ns frontend.modules.outliner.ds-test
  (:require [cljs-run-test :refer [run-test]]
            [cljs.test :refer [deftest is use-fixtures] :as test]
            [frontend.fixtures :as fixtures]
            [frontend.modules.outliner.datascript :as ds]))

(use-fixtures :each
  fixtures/load-test-env
  fixtures/reset-db)

(deftest test-with-db-macro
  (let [db-report (ds/auto-transact! [txs-state (ds/new-outliner-txs-state)]
                    nil
                    (let [datom [{:block/uuid #uuid"606c1962-ad7f-424e-b120-0dc7fcb25415",
                                  :block/refs (),
                                  :block/anchor "level_2123123",
                                  :block/repo "logseq_local_test_navtive_fs",
                                  :block/body [],
                                  :block/meta {:timestamps [], :properties [], :start-pos 0, :end-pos 15},
                                  :block/format :markdown,
                                  :block/level 1,
                                  :block/tags [],
                                  :block/title [["Plain" "level 2123123"]],
                                  :block/refs-with-children (),
                                  :block/content "level test",
                                  :db/id 72,
                                  :block/path-refs (),}]]
                      (ds/add-txs txs-state datom)))
        rt [[72 :block/uuid #uuid "606c1962-ad7f-424e-b120-0dc7fcb25415" 536870913 true]
            [72 :block/anchor "level_2123123" 536870913 true]
            [72 :block/repo "logseq_local_test_navtive_fs" 536870913 true]
            [72 :block/body [] 536870913 true]
            [72 :block/meta {:timestamps [], :properties [], :start-pos 0, :end-pos 15} 536870913 true]
            [72 :block/format :markdown 536870913 true]
            [72 :block/level 1 536870913 true]
            [72 :block/title [["Plain" "level 2123123"]] 536870913 true]
            [72 :block/refs-with-children () 536870913 true]
            [72 :block/content "level test" 536870913 true]]]
    (is (= rt (mapv vec (:tx-data db-report))))))

(comment
  (run-test test-with-db-macro))