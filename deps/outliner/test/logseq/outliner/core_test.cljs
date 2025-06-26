(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest test-delete-block-with-default-property
  (testing "Delete block with default property"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "test block"}}]}])
          property-value (:user.property/default (db-test/find-block-by-content @conn "b1"))
          _ (assert (:db/id property-value))
          block (db-test/find-block-by-content @conn "b1")]
      (outliner-core/delete-blocks! nil conn nil [block] {})
      (is (nil? (db-test/find-block-by-content @conn "b1")))
      (is (nil? (db-test/find-block-by-content @conn "test block"))))))
