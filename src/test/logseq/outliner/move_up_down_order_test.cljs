(ns logseq.outliner.move-up-down-order-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- page-outline
  [conn page-title]
  (letfn [(node [e]
            (let [children (->> (:block/_parent e)
                                ldb/sort-by-order)]
              (if (seq children)
                [(:block/title e) (mapv node children)]
                (:block/title e))))]
    (node (db-test/find-page-by-title @conn page-title))))

(deftest move-blocks-up-down-ignores-selection-order
  (testing "bottom-first sibling selection moves the same as page-order selection"
    (let [make-conn (fn []
                      (db-test/create-conn-with-blocks
                       [{:page {:block/title "page1"}
                         :blocks [{:block/title "a"}
                                  {:block/title "b"}
                                  {:block/title "c"}]}]))
          conn-fwd (make-conn)
          conn-rev (make-conn)
          b-fwd (db-test/find-block-by-content @conn-fwd "b")
          c-fwd (db-test/find-block-by-content @conn-fwd "c")
          c-rev (db-test/find-block-by-content @conn-rev "c")
          b-rev (db-test/find-block-by-content @conn-rev "b")]
      (outliner-core/move-blocks-up-down! conn-fwd [b-fwd c-fwd] true)
      (outliner-core/move-blocks-up-down! conn-rev [c-rev b-rev] true)
      (is (= ["page1" ["b" "c" "a"]] (page-outline conn-fwd "page1")))
      (is (= (page-outline conn-fwd "page1") (page-outline conn-rev "page1")))))

  (testing "bottom-first selection on a,b,c,d matches page-order for up and down"
    (doseq [up? [true false]]
      (let [make-conn (fn []
                        (db-test/create-conn-with-blocks
                         [{:page {:block/title "page1"}
                           :blocks [{:block/title "a"}
                                    {:block/title "b"}
                                    {:block/title "c"}
                                    {:block/title "d"}]}]))
            conn-fwd (make-conn)
            conn-rev (make-conn)
            blocks (fn [conn]
                     (mapv #(db-test/find-block-by-content @conn %) ["b" "c"]))]
        (outliner-core/move-blocks-up-down! conn-fwd (blocks conn-fwd) up?)
        (outliner-core/move-blocks-up-down! conn-rev (reverse (blocks conn-rev)) up?)
        (is (= (page-outline conn-fwd "page1") (page-outline conn-rev "page1"))
            (str "up? " up?))
        (is (= (if up?
                 ["page1" ["b" "c" "a" "d"]]
                 ["page1" ["a" "d" "b" "c"]])
               (page-outline conn-fwd "page1")
               (page-outline conn-rev "page1"))))))

  (testing "non-sibling Ctrl+click order does not change the move target"
    (let [tree [{:page {:block/title "page1"}
                 :blocks [{:block/title "a"
                           :build/children [{:block/title "a1"}
                                            {:block/title "a2"
                                             :build/children [{:block/title "a2x"}]}]}
                          {:block/title "b"}
                          {:block/title "c"
                           :build/children [{:block/title "c1"}]}
                          {:block/title "d"}]}]
          make-conn #(db-test/create-conn-with-blocks tree)]
      (doseq [up? [true false]]
        (let [conn-fwd (make-conn)
              conn-rev (make-conn)
              blocks (fn [conn]
                       (mapv #(db-test/find-block-by-content @conn %) ["a2x" "c"]))]
          (outliner-core/move-blocks-up-down! conn-fwd (blocks conn-fwd) up?)
          (outliner-core/move-blocks-up-down! conn-rev (reverse (blocks conn-rev)) up?)
          (is (= (page-outline conn-fwd "page1") (page-outline conn-rev "page1"))
              (str "up? " up?)))))))
