(ns frontend.db.outliner-test
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.outliner :as outliner]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

(deftest test-get-by-id
  (let [conn (conn/create-outliner-db)
        block-id "1"
        data [{:block/id block-id}]
        _ (d/transact! conn data)
        result (outliner/get-by-id conn [:block/id block-id])]
    (is (= block-id (:block/id result)))))

(deftest test-get-by-parent-&-left
  (let [conn (conn/create-outliner-db)
        data [{:block/id "1"}
              {:block/id "2"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "1"]}
              {:block/id "3"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "2"]}]
        _ (d/transact! conn data)
        result (outliner/get-by-parent-&-left
                 conn [:block/id "1"] [:block/id "2"])]
    (is (= "3" (:block/id result)))))

(deftest test-get-by-parent-id
  (let [conn (conn/create-outliner-db)
        data [{:block/id "1"}
              {:block/id "2"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "1"]}
              {:block/id "3"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "2"]}]
        _ (d/transact! conn data)
        result (outliner/get-by-parent-id conn [:block/id "1"])]
    (is (= ["2" "3"] (mapv :block/id result)))))

(deftest test-retract
  (let [conn (conn/create-outliner-db)
        data [{:block/id "1"}
              {:block/id "2"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "1"]}]
        _ (d/transact! conn data)
        _ (outliner/del-block conn [:block/id "2"])
        result (d/entity @conn [:block/id "2"])]
    (is (nil? result))))

(deftest test-get-journals
  (let [conn (conn/create-outliner-db)
        data [{:block/id "1"}
              {:block/id "2"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "1"]
               :block/journal? true}
              {:block/id "3"
               :block/parent-id [:block/id "1"]
               :block/left-id [:block/id "2"]
               :block/journal? true}]
        _ (d/transact! conn data)
        result (outliner/get-journals conn)]
    (is (= ["2" "3"] (mapv :block/id result)))))
