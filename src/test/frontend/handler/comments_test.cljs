(ns frontend.handler.comments-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db.async :as db-async]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest ensure-comments-area-uses-atomic-worker-command
  (async done
    (let [target-uuid #uuid "11111111-1111-1111-1111-111111111111"
          comments-uuid #uuid "22222222-2222-2222-2222-222222222222"
          comments-area {:db/id 2
                         :block/uuid comments-uuid
                         :block/title "Comments"
                         :block/tags [{:db/ident comments-model/comments-tag-ident}]}
          calls (atom [])]
      (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                          state/<invoke-db-worker
                          (fn [api _repo block-ref]
                            (is (= :thread-api/ensure-comments-area api))
                            (swap! calls conj block-ref)
                            (is (= target-uuid block-ref))
                            (p/resolved comments-area))]
            (comments-handler/ensure-comments-area! target-uuid))
          (p/then
           (fn [result]
             (is (= comments-area result))
             (is (= [target-uuid] @calls))
             (done)))))))

(deftest deleted-comment-thread-expand-is-no-op
  (testing "expand ignores stale comment thread data when the comments block is gone"
    (async done
      (let [expanded (atom [])]
        (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                            db-async/<get-block (fn [& _] (p/resolved nil))
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
        (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                            db-async/<get-block (fn [& _] (p/resolved nil))
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
      (-> (p/with-redefs [state/get-current-repo (constantly "test-repo")
                          db-async/<get-block (fn [& _] (p/resolved comments-area))
                          editor-handler/edit-block! (fn [block pos opts]
                                                       (reset! edited [block pos opts]))]
            (comments-handler/edit-comments-area-title! comments-area :main))
          (p/then (fn []
                    (is (= [comments-area :max {:container-id :main}]
                           @edited))
                    (done)))))))
