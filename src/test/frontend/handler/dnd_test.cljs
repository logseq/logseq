(ns frontend.handler.dnd-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db.transact :as db-transact]
            [frontend.handler.block :as block-handler]
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [logseq.db :as ldb]))

(deftest move-blocks-uses-passed-block-maps-test
  (let [moved-block {:db/id 1
                     :block/uuid (random-uuid)}
        target-block {:db/id 2
                      :block/uuid (random-uuid)}
        moves (atom [])]
    (with-redefs [block-handler/get-top-level-blocks identity
                  comments-model/move-allowed? (constantly true)
                  editor-handler/save-current-block! (constantly nil)
                  db-transact/apply-outliner-ops (fn [_conn ops opts]
                                                   (swap! moves conj {:ops ops
                                                                      :opts opts}))]
      (dnd/move-blocks nil [moved-block] target-block nil :nested)
      (is (= [{:ops [[:move-blocks [[(:block/uuid moved-block)] (:block/uuid target-block) {:sibling? false}]]]
               :opts {:outliner-op :move-blocks}}]
             @moves)))))

(deftest move-blocks-checks-actual-top-drop-target
  (testing "top drops use the actual before-node target for comment move guards"
    (let [moved-block {:db/id 1
                       :block/uuid (random-uuid)}
          parent-block {:db/id 2
                        :block/uuid (random-uuid)}
          target-block {:db/id 3
                        :block/uuid (random-uuid)
                        :block/parent parent-block}
          before-node {:db/id 4
                       :block/uuid (random-uuid)}
          moves (atom [])]
      (with-redefs [block-handler/get-top-level-blocks identity
                    ldb/get-left-sibling (fn [block]
                                           (when (= (:db/id block) (:db/id target-block))
                                             before-node))
                    comments-model/move-allowed? (fn [_blocks target opts]
                                                   (and (= target target-block)
                                                        (= opts {:sibling? true})))
                    editor-handler/save-current-block! (constantly nil)
                    db-transact/apply-outliner-ops (fn [_conn ops opts]
                                                     (swap! moves conj {:ops ops
                                                                        :opts opts}))]
        (dnd/move-blocks nil [moved-block] target-block nil :top)
        (is (empty? @moves)
            "The initial hover target must not approve a different top-drop move target")))))
