(ns frontend.handler.query.builder-test
  (:require [frontend.handler.query.builder :as query-builder]
            [clojure.test :refer [deftest is]]))

(deftest builder
  (let [q []]
    (is (= (query-builder/wrap-operator [:page-ref "foo"] [0] :and)
           [:and [:page-ref "foo"]]))
    (is (= (query-builder/unwrap-operator [:and [:page-ref "foo"]] [0])
           [:page-ref "foo"]))
    (is (= (-> (query-builder/add-element q [0] :and)
               (query-builder/add-element [1] [:page-ref "foo"])
               (query-builder/add-element [2] [:page-ref "bar"])
               (query-builder/wrap-operator [1] :or)
               (query-builder/unwrap-operator [1]))
           [:and [:page-ref "foo"] [:page-ref "bar"]]))
    (is (= (-> (query-builder/add-element q [0] :or)
               (query-builder/add-element [1] [:page-ref "foo"])
               (query-builder/add-element [2] [:page-ref "bar"])
               (query-builder/wrap-operator [2] :and)
               (query-builder/unwrap-operator [2]))
           [:or [:page-ref "foo"] [:page-ref "bar"]]))))

(deftest to-dsl
  (is (= (str (query-builder/->dsl [:and [:page-ref "foo"] [:page-ref "bar"]]))
         (str '(and [[foo]] [[bar]]))))
  (is (= (str (query-builder/->dsl [:and [:page-ref "foo"] [:or [:page-ref "bar"] [:property :key :value]]]))
         (str '(and [[foo]] (or [[bar]] (property :key :value))))))
  (is (= (str (query-builder/->dsl [:and [:priority "A"] [:task "NOW"]]))
         (str '(and (priority A) (task NOW))))))

(deftest from-dsl
  (is (= (query-builder/from-dsl '(and [[foo]] [[bar]]))
         [:and [:page-ref "foo"] [:page-ref "bar"]]))
  (is (= (query-builder/from-dsl '(and [[foo]] (or [[bar]] (:property :key :value))))
         [:and [:page-ref "foo"] [:or [:page-ref "bar"] [:property :key :value]]]))
  (is (= (query-builder/from-dsl '(and (priority A) (task NOW)))
         [:and ['priority 'A] ['task 'NOW]])))
