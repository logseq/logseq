(ns frontend.modules.outliner.ds-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests] :as test]
            [frontend.fixtures :as fixtures]
            [cljs-run-test :refer [run-test]]
            [frontend.modules.outliner.datascript :as ds]))

(use-fixtures :each fixtures/reset-db)

(deftest test-with-db-macro
  (let [db-report (ds/auto-transact! [txs-state (ds/new-outliner-txs-state)]
                    (let [datom [{:block/uuid #uuid"606c1962-ad7f-424e-b120-0dc7fcb25415",
                                  :block/left #:txs-state{:id 46},
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
                                  :block/path-refs (),
                                  :block/parent #:txs-state{:id 26},
                                  :block/page #:txs-state{:id 26},
                                  :block/file #:txs-state{:id 20}}]]
                      (ds/add-txs txs-state datom)))
        rt [[72
             :block/uuid
             #uuid "606c1962-ad7f-424e-b120-0dc7fcb25415"
             536870913
             true]
            [72 :block/left 46 536870913 true]
            [72 :block/anchor "level_2123123" 536870913 true]
            [72 :block/repo "logseq_local_test_navtive_fs" 536870913 true]
            [72 :block/body [] 536870913 true]
            [72
             :block/meta
             {:timestamps [], :properties [], :start-pos 0, :end-pos 15}
             536870913
             true]
            [72 :block/format :markdown 536870913 true]
            [72 :block/level 1 536870913 true]
            [72 :block/title [["Plain" "level 2123123"]] 536870913 true]
            [72 :block/refs-with-children () 536870913 true]
            [72 :block/content "level test" 536870913 true]
            [72 :block/parent 26 536870913 true]
            [72 :block/page 26 536870913 true]
            [72 :block/file 20 536870913 true]]]
    (is (= rt (mapv vec (:tx-data db-report))))))

(comment
  (run-test test-with-db-macro))