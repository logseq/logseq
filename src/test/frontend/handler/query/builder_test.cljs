(ns frontend.handler.query.builder-test
  (:require [frontend.handler.query.builder :as b]
            [clojure.test :refer [deftest is]]))

(deftest builder
  (let [q []]
    (is (= (b/wrap-operator [:page-ref "foo"] [0] :and)
           [:and [:page-ref "foo"]]))
    (is (= (b/unwrap-operator [:and [:page-ref "foo"]] [0])
           [:page-ref "foo"]))
    (is (= (-> (b/add-element q [0] :and)
               (b/add-element [1] [:page-ref "foo"])
               (b/add-element [2] [:page-ref "bar"])
               (b/wrap-operator [1] :or)
               (b/unwrap-operator [1]))
           [:and [:page-ref "foo"] [:page-ref "bar"]]))
    (is (= (-> (b/add-element q [0] :or)
               (b/add-element [1] [:page-ref "foo"])
               (b/add-element [2] [:page-ref "bar"])
               (b/wrap-operator [2] :and)
               (b/unwrap-operator [2]))
           [:or [:page-ref "foo"] [:page-ref "bar"]]))))

(deftest to-dsl
  (is (= (str (b/->dsl [:and [:page-ref "foo"] [:page-ref "bar"]]))
         (str '(and [[foo]] [[bar]]))))
  (is (= (str (b/->dsl [:and [:page-ref "foo"] [:or [:page-ref "bar"] [:property :key :value]]]))
         (str '(and [[foo]] (or [[bar]] (property :key :value))))))
  (is (= (str (b/->dsl [:and [:priority "A"] [:task "NOW"]]))
         (str '(and (priority A) (task NOW))))))

(deftest from-dsl
  (is (= (b/from-dsl '(and [[foo]] [[bar]]))
         [:and [:page-ref "foo"] [:page-ref "bar"]]))
  (is (= (b/from-dsl '(and [[foo]] (or [[bar]] (:property :key :value))))
         [:and [:page-ref "foo"] [:or [:page-ref "bar"] [:property :key :value]]]))
  (is (= (b/from-dsl '(and (priority A) (task NOW)))
         [:and ['priority 'A] ['task 'NOW]])))
