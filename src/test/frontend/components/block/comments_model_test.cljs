(ns frontend.components.block.comments-model-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]))

(deftest move-allowed-respects-comments-boundaries
  (let [parent {:db/id 1}
        comments-area {:db/id 2
                       :block/parent parent
                       :block/tags [{:db/ident comments-model/comments-tag-ident}]}
        comment-block {:db/id 3
                       :block/parent comments-area}
        ordinary-block {:db/id 4
                        :block/parent parent}]
    (testing "comments areas can only move as siblings"
      (is (true? (comments-model/move-allowed? [comments-area] ordinary-block {:sibling? true})))
      (is (false? (comments-model/move-allowed? [comments-area] ordinary-block {:sibling? false}))))

    (testing "ordinary blocks can move next to comments areas but not into them"
      (is (true? (comments-model/move-allowed? [ordinary-block] comments-area {:sibling? true})))
      (is (false? (comments-model/move-allowed? [ordinary-block] comments-area {:sibling? false}))))

    (testing "comment blocks remain protected"
      (is (false? (comments-model/move-allowed? [comment-block] ordinary-block {:sibling? true})))
      (is (false? (comments-model/move-allowed? [ordinary-block] comment-block {:sibling? true}))))))
