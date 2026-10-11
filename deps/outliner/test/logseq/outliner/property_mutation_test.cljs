(ns logseq.outliner.property-mutation-test
  "Tests for logseq.outliner.property found by mutation testing"
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(defn- extends-idents
  [conn class-ident]
  (set (:logseq.property.class/extends
        (db-test/readable-properties (d/entity @conn class-ident)))))

(deftest extends-with-two-unrelated-parents-keeps-both
  (testing "batch-set-property! with a vector of two unrelated parents"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:A {} :B {} :C {}}})]
      (outliner-property/batch-set-property! conn
                                             [(:db/id (d/entity @conn :user.class/C))]
                                             :logseq.property.class/extends
                                             [:user.class/A :user.class/B])
      (is (= #{:user.class/A :user.class/B} (extends-idents conn :user.class/C))
          "C extends both A and B")))
  (testing "set-block-property! with a vector of two unrelated parents"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:A {} :B {} :C {}}})]
      (outliner-property/set-block-property! conn
                                             (:db/id (d/entity @conn :user.class/C))
                                             :logseq.property.class/extends
                                             [:user.class/A :user.class/B])
      (is (= #{:user.class/A :user.class/B} (extends-idents conn :user.class/C))
          "C extends both A and B"))))
