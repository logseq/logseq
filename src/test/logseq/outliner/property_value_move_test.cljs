(ns logseq.outliner.property-value-move-test
  "Moving the values of a many-valued property up and down with
   move-blocks-up-down!. A value's siblings come from the entity's
   :block/_raw-parent, which only the compiled app computes, so this is in the
   app's test build."
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- conn-with-values
  [value-titles]
  (db-test/create-conn-with-blocks
   {:properties {:many {:logseq.property/type :default :db/cardinality :many}}
    :pages-and-blocks [{:page {:block/title "page1"}
                        :blocks [{:block/title "b" :build/properties {:many (set value-titles)}
                                  :build/children [{:block/title "child"}]}]}]}))

(defn- values
  [conn]
  (map :block/title (sort-by :block/order (:user.property/many (db-test/find-block-by-content @conn "b")))))

(defn- move!
  [conn title up?]
  (outliner-core/move-blocks-up-down! conn [(db-test/find-block-by-content @conn title)] up?))

(deftest moving-the-second-value-up-keeps-it-a-value
  (let [conn (conn-with-values ["v1" "v2"])]
    (is (= ["v1" "v2"] (values conn)))
    (move! conn "v2" true)
    (testing "the two values swap, and both stay values of the property"
      (is (= ["v2" "v1"] (values conn))))
    (testing "the block's ordinary children are untouched"
      (is (= ["child"] (map :block/title (:block/_parent (db-test/find-block-by-content @conn "b"))))))))

(deftest moving-a-value-up-past-another-keeps-every-value
  (let [conn (conn-with-values ["v1" "v2" "v3"])]
    (move! conn "v3" true)
    (is (= ["v1" "v3" "v2"] (values conn)))
    (move! conn "v3" true)
    (is (= ["v3" "v1" "v2"] (values conn)))))

(deftest values-at-the-edges-stay-where-they-are
  (let [conn (conn-with-values ["v1" "v2"])]
    (testing "the first value moved up stays first and a value"
      (move! conn "v1" true)
      (is (= ["v1" "v2"] (values conn))))
    (testing "the last value moved down stays last and a value"
      (move! conn "v2" false)
      (is (= ["v1" "v2"] (values conn))))
    (is (= ["child"] (map :block/title (:block/_parent (db-test/find-block-by-content @conn "b")))))))

(deftest moving-the-first-value-down-keeps-it-a-value
  (let [conn (conn-with-values ["v1" "v2"])]
    (move! conn "v1" false)
    (is (= ["v2" "v1"] (values conn)))))
