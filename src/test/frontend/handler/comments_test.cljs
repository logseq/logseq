(ns frontend.handler.comments-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db.async :as db-async]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest ensure-comments-area-adds-target-property-for-single-block-comments
  (async done
    (let [target-uuid #uuid "11111111-1111-1111-1111-111111111111"
          comments-uuid #uuid "22222222-2222-2222-2222-222222222222"
          target {:db/id 1
                  :block/uuid target-uuid
                  :block/title "target"}
          comments-area {:db/id 2
                         :block/uuid comments-uuid
                         :block/title "Comments"
                         :block/tags [{:db/ident comments-model/comments-tag-ident}]}
          inserted (atom nil)
          property-updates (atom [])]
      (-> (p/with-redefs [db-async/<get-block (fn [_repo block-id _opts]
                                                (p/resolved (when (= target-uuid block-id)
                                                              target)))
                          editor-handler/api-insert-new-block!
                          (fn [title opts]
                            (reset! inserted {:title title :opts opts})
                            (p/resolved comments-area))
                          db-property-handler/set-block-property!
                          (fn [block-id property value]
                            (swap! property-updates conj [block-id property value])
                            (p/resolved nil))
                          editor-handler/expand-block! (fn [_] (p/resolved nil))]
            (comments-handler/ensure-comments-area! target-uuid))
          (p/then
           (fn [result]
             (is (= comments-area result))
             (is (contains? (get-in @inserted [:opts :other-attrs])
                            comments-model/comments-blocks-property))
             (is (= #{[:block/uuid target-uuid]}
                    (get-in @inserted [:opts :other-attrs comments-model/comments-blocks-property])))
             (is (empty? @property-updates)
                 "New single-block comment areas should be created with the target property")
             (done)))))))

(deftest ensure-comments-area-backfills-existing-single-block-comments
  (async done
    (let [target-uuid #uuid "11111111-1111-1111-1111-111111111111"
          comments-uuid #uuid "22222222-2222-2222-2222-222222222222"
          comments-area {:db/id 2
                         :block/uuid comments-uuid
                         :block/title "Comments"
                         :block/tags [{:db/ident comments-model/comments-tag-ident}]}
          target {:db/id 1
                  :block/uuid target-uuid
                  :block/title "target"
                  :block/_parent [comments-area]}
          property-updates (atom [])]
      (-> (p/with-redefs [db-async/<get-block (fn [_repo block-id _opts]
                                                (p/resolved (when (= target-uuid block-id)
                                                              target)))
                          ldb/sort-by-order identity
                          db-property-handler/set-block-property!
                          (fn [block-id property value]
                            (swap! property-updates conj [block-id property value])
                            (p/resolved nil))
                          editor-handler/api-insert-new-block!
                          (fn [& _]
                            (throw (js/Error. "should not insert a duplicate comments area")))]
            (comments-handler/ensure-comments-area! target-uuid))
          (p/then
           (fn [result]
             (is (= comments-area result))
             (is (= [[(:db/id comments-area)
                      comments-model/comments-blocks-property
                      #{[:block/uuid target-uuid]}]]
                    @property-updates))
             (done)))))))

(deftest deleted-comment-thread-expand-is-no-op
  (testing "expand ignores stale comment thread data when the comments block is gone"
    (async done
      (let [expanded (atom [])]
        (-> (p/with-redefs [db-async/<get-block (fn [& _] (p/resolved nil))
                            editor-handler/expand-block! (fn [block-id] (swap! expanded conj block-id))]
              (comments-handler/expand-comments-area!
               {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}))
            (p/then (fn []
                      (is (empty? @expanded))
                      (done))))))))

(deftest deleted-comment-thread-reveal-is-no-op
  (testing "reveal ignores stale comment thread data when the comments block is gone"
    (async done
      (let [expanded (atom [])]
        (-> (p/with-redefs [db-async/<get-block (fn [& _] (p/resolved nil))
                            editor-handler/expand-block! (fn [block-id] (swap! expanded conj block-id))]
              (comments-handler/reveal-comments-area!
               {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}))
            (p/then (fn []
                      (is (empty? @expanded))
                      (done))))))))

(deftest edit-comments-area-title-edits-comments-block
  (let [comments-uuid #uuid "22222222-2222-2222-2222-222222222222"
        comments-area {:db/id 2
                       :block/uuid comments-uuid
                       :block/title "Comments"
                       :block/tags [{:db/ident comments-model/comments-tag-ident}]}
        edited (atom nil)]
    (async done
      (-> (p/with-redefs [db-async/<get-block (fn [& _] (p/resolved comments-area))
                          editor-handler/edit-block! (fn [block pos opts]
                                                       (reset! edited [block pos opts]))]
            (comments-handler/edit-comments-area-title! comments-area :main))
          (p/then (fn []
                    (is (= [comments-area :max {:container-id :main}]
                           @edited))
                    (done)))))))
