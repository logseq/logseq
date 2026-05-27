(ns frontend.components.objects-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.objects :as objects]))

(deftest class-object-columns-include-page
  (let [columns (objects/build-class-object-columns {} {:db/ident :user.class/task} [])]
    (is (some #(= :block/page (:id %)) columns))
    (is (false? (:sortable? (some #(when (= :block/page (:id %)) %) columns))))))

(deftest property-object-columns-include-page
  (let [columns (objects/build-property-object-columns {} {:db/ident :user.property/status} [])]
    (is (some #(= :block/page (:id %)) columns))
    (is (false? (:sortable? (some #(when (= :block/page (:id %)) %) columns))))))
