(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.pipeline :as worker-pipeline]))

(deftest remove-conflict-datoms-test
  (testing "remove-conflict-datoms (1)"
    (let [datoms [[1 :a 1 1]
                  [1 :a 1 1]
                  [1 :a 2 1]
                  [2 :a 1 1]]]
      (is (= (set [[1 :a 1 1]
                   [1 :a 2 1]
                   [2 :a 1 1]])
             (set (#'worker-pipeline/remove-conflict-datoms datoms))))))
  (testing "check block/tags"
    (let [datoms [[163 :block/tags 2 536870930 true]
                  [163 :block/tags 136 536870930 true]
                  [163 :block/tags 136 536870930 false]]]
      (is (= (set [[163 :block/tags 2 536870930 true]
                   [163 :block/tags 136 536870930 false]])
             (set (#'worker-pipeline/remove-conflict-datoms datoms))))))
  (testing "check block/refs"
    (let [datoms [[176 :block/refs 177 536871080 true]
                  [158 :block/refs 21 536871082 false]
                  [158 :block/refs 137 536871082 false]
                  [158 :block/refs 137 536871082 true]
                  [158 :block/refs 21 536871082 true]
                  [176 :block/refs 177 536871082 false]
                  [176 :block/refs 177 536871082 true]
                  [177 :block/refs 136 536871082 true]
                  [177 :block/refs 21 536871082 true]]]
      (is (= (set [[176 :block/refs 177 536871080 true]
                   [158 :block/refs 137 536871082 true]
                   [158 :block/refs 21 536871082 true]
                   [176 :block/refs 177 536871082 true]
                   [177 :block/refs 136 536871082 true]
                   [177 :block/refs 21 536871082 true]])
             (set (#'worker-pipeline/remove-conflict-datoms datoms)))))))
