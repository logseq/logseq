(ns logseq.outliner.indent-outdent-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- outline-child-titles
  [block]
  (->> (ldb/sort-by-order (:block/_parent block))
       (remove :logseq.property/created-from-property)
       (mapv :block/title)))

(defn- two-level-outdent-conn
  "Page: a (a1; a2 (a2x)), b, c, d."
  []
  (db-test/create-conn-with-blocks
   [{:page {:block/title "page"}
     :blocks [{:block/title "a"
               :build/children [{:block/title "a1"}
                                {:block/title "a2"
                                 :build/children [{:block/title "a2x"}]}]}
              {:block/title "b"}
              {:block/title "c"}
              {:block/title "d"}]}]))

(defn- assert-two-level-outdent-result
  [conn]
  (let [db @conn
        page (db-test/find-page-by-title db "page")
        a (db-test/find-block-by-content db "a")
        a2 (db-test/find-block-by-content db "a2")
        b (db-test/find-block-by-content db "b")]
    (is (= ["a" "b" "c" "d"] (outline-child-titles page)))
    (is (= ["a1" "a2" "a2x"] (outline-child-titles a)))
    (is (empty? (outline-child-titles a2)))
    (is (empty? (outline-child-titles b)))))

(deftest outdent-multi-level-selection-does-not-move-blocks-deeper
  (testing "direct outdent of a2x+b leaves top-level b, c, d in place"
    (let [conn (two-level-outdent-conn)
          a2x (db-test/find-block-by-content @conn "a2x")
          b (db-test/find-block-by-content @conn "b")]
      (outliner-core/indent-outdent-blocks! conn [a2x b] false
                                            :logical-outdenting? false)
      (assert-two-level-outdent-result conn)))
  (testing "logical outdent of a2x+b also leaves top-level b, c, d in place"
    (let [conn (two-level-outdent-conn)
          a2x (db-test/find-block-by-content @conn "a2x")
          b (db-test/find-block-by-content @conn "b")]
      (outliner-core/indent-outdent-blocks! conn [a2x b] false
                                            :logical-outdenting? true)
      (assert-two-level-outdent-result conn))))
