(ns frontend.db.outliner-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.core-test :as core-test]
            [frontend.db.outliner :as outliner]
            [frontend.test.fixtures :as fixtures]))

(use-fixtures :each fixtures/reset-db)

(deftest test-get-by-id
  (let [conn (core-test/get-current-conn)
        block-id "1"
        data [{:block/uuid block-id}]
        _ (d/transact! conn data)
        result (outliner/get-by-id conn [:block/uuid block-id])]
    (is (= block-id (:block/uuid result)))))

;; (deftest test-get-by-parent-&-left
;;   (let [conn (core-test/get-current-conn)
;;         data [{:block/uuid "1"}
;;               {:block/uuid "2"
;;                :block/parent [:block/uuid "1"]
;;                :block/left [:block/uuid "1"]}
;;               {:block/uuid "3"
;;                :block/parent [:block/uuid "1"]
;;                :block/left [:block/uuid "2"]}]
;;         _ (d/transact! conn data)
;;         result (outliner/get-by-parent-&-left
;;                  @conn [:block/uuid "1"] [:block/uuid "2"])]
;;     (is (= "3" (:block/uuid result)))))

(deftest test-get-by-parent-id
  (let [conn (core-test/get-current-conn)
        data [{:block/uuid "1"}
              {:block/uuid "2"
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "1"]}
              {:block/uuid "3"
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "2"]}]
        _ (d/transact! conn data)
        r (d/q outliner/get-by-parent-id @conn [:block/uuid "1"])
        result (flatten r)]
    (is (= ["2" "3"] (mapv :block/uuid result)))))

(deftest test-retract
  (let [conn (core-test/get-current-conn)
        data [{:block/uuid "1"}
              {:block/uuid "2"
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "1"]}]
        _ (d/transact! conn data)
        _ (outliner/del-block conn [:block/uuid "2"])
        result (d/entity @conn [:block/uuid "2"])]
    (is (nil? result))))
