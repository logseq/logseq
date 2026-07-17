(ns frontend.handler.dnd-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.block :as block-handler]
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [logseq.melange.bridge.db.core :as ldb]))

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
          entities {1 moved-block
                    3 target-block}
          moves (atom [])]
      (with-redefs [db/entity (fn [id] (get entities id))
                    block-handler/get-top-level-blocks identity
                    ldb/get-left-sibling (fn [block]
                                           (when (= (:db/id block) (:db/id target-block))
                                             before-node))
                    comments-model/move-allowed? (fn [_blocks target opts]
                                                   (and (= target target-block)
                                                        (= opts {:sibling? true})))
                    editor-handler/save-current-block! (constantly nil)
                    outliner-op/move-blocks! (fn [blocks target opts]
                                               (swap! moves conj {:blocks blocks
                                                                  :target target
                                                                  :opts opts}))
                    db-transact/apply-outliner-ops (constantly nil)]
        (dnd/move-blocks nil [moved-block] target-block nil :top)
        (is (empty? @moves)
            "The initial hover target must not approve a different top-drop move target")))))
