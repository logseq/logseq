(ns frontend.components.block.macros-test
  (:require [frontend.components.block.macros :as block-macros]
            [clojure.test :refer [deftest are testing is]]))

(deftest macro-function
  (testing "Default table functions with property argument"
    (are [user-input result]
         (= result
            (block-macros/function-macro
             (mapv #(hash-map :block/properties %) [{:total 10} {:total 20} {:total 30}])
             [user-input]))
      "(sum :total)" 60
      "(average :total)" 20
      "(max :total)" 30
      "(min :total)" 10
      "(count :total)" 3))

  (testing "Table function with clojure function argument"
    (is (= 130
           (block-macros/function-macro
            (mapv #(hash-map :block/properties %)
                  [{:total 10 :qty 3} {:total 20 :qty 5}])
            ["(sum (map (fn [x] (* (:total x) (:qty x))) result))"]))))

  (testing "Edge cases"
    (is (= 40
           (block-macros/function-macro
            (mapv #(hash-map :block/properties %) [{:total 10} {} {:total 30}])
            ["(sum :total)"]))
        "Function still works when some results are missing property")
    (is (= 0
           (block-macros/function-macro
            (mapv #(hash-map :block/properties %) [{:total 10} {} {:total 30}])
            ["(sum :totally)"]))
        "Function gives back 0 when given wrong property")))
