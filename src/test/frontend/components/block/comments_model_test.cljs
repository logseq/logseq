(ns frontend.components.block.comments-model-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.context.i18n :refer [t]]
            [goog.object :as gobj]))

(deftest comments-area-detection
  (testing "detects blocks tagged with the built-in Comments tag"
    (is (true? (comments-model/comments-area?
                {:block/tags [{:db/ident :logseq.class/Comments}]}))))

  (testing "does not treat ordinary blocks as comment areas"
    (is (false? (comments-model/comments-area?
                 {:block/title "Comments"})))
    (is (false? (comments-model/comments-area?
                 {:block/tags [{:db/ident :logseq.class/Task}]})))))

(deftest comment-move-guards
  (let [comments-area {:block/tags [{:db/ident :logseq.class/Comments}]}
        comment-block {:block/title "comment"
                       :block/parent comments-area}
        tagged-comment-block {:block/title "tagged comment"
                              :block/tags [{:db/ident :logseq.class/Comment}]}
        ordinary-block {:block/title "ordinary"}
        ordinary-target {:block/title "target"}]
    (testing "comment area and its children are protected comment blocks"
      (is (true? (comments-model/protected-comment-block? comments-area)))
      (is (true? (comments-model/protected-comment-block? comment-block)))
      (is (true? (comments-model/protected-comment-block? tagged-comment-block)))
      (is (false? (comments-model/protected-comment-block? ordinary-block))))
    (testing "comment blocks cannot be moved"
      (is (false? (comments-model/move-allowed? [comments-area] ordinary-target)))
      (is (false? (comments-model/move-allowed? [comment-block] ordinary-target)))
      (is (false? (comments-model/move-allowed? [tagged-comment-block] ordinary-target))))
    (testing "ordinary blocks cannot be moved to comment blocks"
      (is (false? (comments-model/move-allowed? [ordinary-block] comments-area)))
      (is (false? (comments-model/move-allowed? [ordinary-block] comment-block)))
      (is (false? (comments-model/move-allowed? [ordinary-block] tagged-comment-block)))
      (is (false? (comments-model/move-allowed? [ordinary-block] comments-area {:sibling? true})))
      (is (false? (comments-model/move-allowed? [ordinary-block] tagged-comment-block {:sibling? true}))))
    (testing "ordinary moves outside comments stay allowed"
      (is (true? (comments-model/move-allowed? [ordinary-block] ordinary-target))))))

(deftest comment-target-blocks
  (let [comments-area {:block/title "Comments"
                       :block/tags [{:db/ident :logseq.class/Comments}]}
        comment-block {:block/title "comment"
                       :block/parent comments-area}
        first-block {:block/title "first"}
        second-block {:block/title "second"}]
    (is (= [first-block second-block]
           (comments-model/comment-target-blocks
            [first-block comments-area comment-block first-block second-block]))
        "Selected-block comment actions should target normal blocks only once")))

(deftest range-comment-threads
  (let [target-a {:block/title "a"}
        target-b {:block/title "b"}
        deleted-target {:block/title "deleted"
                        :logseq.property/deleted-at 1}
        comments-area {:block/title "Comments"
                       :block/tags [{:db/ident :logseq.class/Comments}]
                       comments-model/comments-blocks-property [target-a deleted-target target-b]}
        deleted-comments-area (assoc comments-area :logseq.property/deleted-at 1)
        ordinary-block {:block/title "ordinary"
                        :logseq.property.comments/_blocks [comments-area deleted-comments-area]}]
    (testing "range comment areas are comments blocks that point at target blocks"
      (is (true? (comments-model/range-comments-area? comments-area)))
      (is (false? (comments-model/range-comments-area?
                   {:block/tags [{:db/ident :logseq.class/Comments}]}))))
    (testing "deleted targets do not participate in the rendered target set"
      (is (= [target-a target-b]
             (comments-model/comment-thread-target-blocks comments-area))))
    (testing "blocks expose live comment threads through the reverse property"
      (is (= [comments-area]
             (comments-model/comment-threads-for-block ordinary-block))))))

(deftest comment-row-derivation
  (testing "uses the created-by ref as the comment author"
    (is (= {:author "tienson"
            :avatar "T"
            :body "tienson: push PR"
            :created-at 1710000000000
            :updated-at 1710000000000
            :edited? false}
           (comments-model/comment-row
            {:block/title "tienson: push PR"
             :logseq.property/created-by-ref {:block/title "tienson"}
             :block/created-at 1710000000000
             :block/updated-at 1710000000000}))))

  (testing "does not invent an author when created-by ref is absent"
    (is (= {:author nil
            :avatar ""
            :body "review again"
            :created-at nil
            :updated-at nil
            :edited? false}
           (comments-model/comment-row {:block/title "review again"}))))

  (testing "marks comments edited only when updated later than created"
    (is (true? (:edited? (comments-model/comment-row
                          {:block/title "me: updated"
                           :logseq.property/created-by-ref {:block/title "me"}
                           :block/created-at 10
                           :block/updated-at 20}))))))

(deftest comment-author-visibility
  (let [visible? (resolve 'frontend.components.block.comments-model/comment-author-visible?)]
    (is (fn? visible?))

    (testing "hides comment avatar and username when there is no logged-in user"
      (when (fn? visible?)
        (is (false? (visible? nil)))
        (is (false? (visible? "")))))

    (testing "shows comment avatar and username when a user is logged in"
      (when (fn? visible?)
        (is (true? (visible? #uuid "6a073572-fefe-44c5-8b43-267ccc715077")))
        (is (true? (visible? "6a073572-fefe-44c5-8b43-267ccc715077")))))))

(deftest comments-summary
  (testing "summarizes count and latest author by timestamp"
    (is (= {:count 2
            :latest-author "tienson"
            :latest-created-at 30}
           (comments-model/comments-summary
            [{:block/title "review again"
              :logseq.property/created-by-ref {:block/title "zhiyuan"}
              :block/created-at 10}
             {:block/title "push PR"
              :logseq.property/created-by-ref {:block/title "tienson"}
              :block/created-at 30}]))))

  (testing "returns no summary for empty comment areas"
    (is (nil? (comments-model/comments-summary [])))))

(deftest comment-count-labels
  (testing "uses singular English labels for one comment"
    (is (= "1 comment" (t :block.comments/count 1)))
    (is (= "1 comment · latest from tienson"
           (t :block.comments/collapsed-summary 1 "tienson"))))

  (testing "uses plural English labels for other counts"
    (is (= "0 comments" (t :block.comments/count 0)))
    (is (= "2 comments" (t :block.comments/count 2)))))

(deftest comment-time-label
  (let [time-label (resolve 'frontend.components.block.comments-model/comment-time-label)
        now (js/Date. 2026 4 18 9 0)
        today (.getTime (js/Date. 2026 4 18 17 5))
        yesterday (.getTime (js/Date. 2026 4 17 17 5))
        older (.getTime (js/Date. 2026 3 5 17 5))]
    (is (fn? time-label))
    (when (fn? time-label)
      (is (= "5:05 PM" (time-label today now))
          "Today's comments should display only the time")
      (is (= "Yesterday at 5:05 PM" (time-label yesterday now))
          "Yesterday's comments should include the relative day")
      (is (= "Apr 5, 2026 at 5:05 PM" (time-label older now))
          "Older comments should include the date and time")
      (is (nil? (time-label nil now))))))

(deftest comment-submit-content
  (let [submit-content (resolve 'frontend.components.block.comments-model/submittable-comment-content)]
    (testing "keeps comment drafts local until an explicit submit asks for content"
      (is (fn? submit-content)))

    (testing "returns trimmed content for submitted create and edit drafts"
      (when (fn? submit-content)
        (is (= "ship comment box" (submit-content "  ship comment box  ")))))

    (testing "does not submit blank drafts"
      (when (fn? submit-content)
        (is (nil? (submit-content "  \n\t  ")))
        (is (nil? (submit-content nil)))))))

(deftest comment-ownership
  (let [owned? (resolve 'frontend.components.block.comments-model/comment-owned-by?)
        user-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        other-id #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154"]
    (testing "detects comments created by the current user"
      (is (fn? owned?))
      (when (fn? owned?)
        (is (true? (owned? {:logseq.property/created-by-ref {:block/uuid user-id}}
                           (str user-id))))
        (is (true? (owned? {:logseq.property/created-by-ref {:block/uuid (str user-id)}}
                           user-id)))))

    (testing "does not allow ownership without matching created-by ref"
      (when (fn? owned?)
        (is (false? (owned? {:logseq.property/created-by-ref {:block/uuid other-id}}
                            (str user-id))))
        (is (false? (owned? {} (str user-id))))
        (is (true? (owned? {} nil)))
        (is (false? (owned? {:logseq.property/created-by-ref {:block/uuid user-id}}
                            nil)))))))

(deftest comment-actions
  (let [actions (resolve 'frontend.components.block.comments-model/comment-actions)
        user-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        other-id #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154"]
    (testing "exposes reaction for comments created by other users"
      (is (fn? actions))
      (when (fn? actions)
        (is (= [:reaction]
               (actions {:logseq.property/created-by-ref {:block/uuid other-id}}
                        (str user-id))))))

    (testing "exposes edit and delete when logged out and created-by ref is absent"
      (when (fn? actions)
        (is (= [:reaction :edit :delete]
               (actions {} nil)))))

    (testing "exposes edit and delete only for comments created by current user"
      (when (fn? actions)
        (is (= [:reaction :edit :delete]
               (actions {:logseq.property/created-by-ref {:block/uuid user-id}}
                        (str user-id))))))))

(deftest comment-edit-cursor-position
  (let [cursor-position (resolve 'frontend.components.block.comments-model/comment-edit-cursor-position)]
    (testing "places the edit cursor at the end of the current comment"
      (is (fn? cursor-position))
      (when (fn? cursor-position)
        (is (= 11 (cursor-position "hello world")))
        (is (= 3 (cursor-position "a\nb")))
        (is (= 0 (cursor-position nil)))))))

(deftest comment-submit-shortcut
  (let [shortcut? (resolve 'frontend.components.block.comments-model/comment-submit-shortcut?)]
    (testing "accepts enter without requiring a modifier"
      (is (fn? shortcut?))
      (when (fn? shortcut?)
        (is (true? (shortcut? #js {:key "Enter"})))
        (is (true? (shortcut? #js {:key "Enter" :metaKey true})))))

    (testing "keeps shift-enter and non-enter keys available for editing"
      (when (fn? shortcut?)
        (is (false? (shortcut? #js {:key "Enter" :metaKey true :shiftKey true})))
        (is (false? (shortcut? #js {:key "a" :metaKey true})))))

    (testing "does not submit while editor commands or autocomplete are active"
      (when (fn? shortcut?)
        (is (false? (shortcut? #js {:key "Enter"} :commands)))
        (is (false? (shortcut? #js {:key "Enter"} :block-search)))
        (is (false? (shortcut? #js {:key "Enter"} :page-search)))))))

(deftest comments-render-token
  (let [render-token (resolve 'frontend.components.block.comments-model/comments-render-token)]
    (testing "tracks comment identity and content changes for scroll effects"
      (is (fn? render-token))
      (when (fn? render-token)
        (is (= [[#uuid "6a073572-fefe-44c5-8b43-267ccc715077" "first" 10]
                [#uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154" "second" 20]]
               (render-token
                [{:block/uuid #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
                  :block/title "first"
                  :block/updated-at 10}
                 {:block/uuid #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154"
                  :block/title "second"
                  :block/updated-at 20}])))))))

(deftest comment-draft-block
  (let [draft-block (resolve 'frontend.components.block.comments-model/comment-draft-block)
        draft-id #uuid "a477a8fe-10fb-443b-9d59-45ee476931e8"
        comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        page-id #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154"
        comments-block {:block/uuid comments-id
                        :block/page {:block/uuid page-id}}]
    (testing "builds a temporary block shaped for the normal editor"
      (is (fn? draft-block))
      (when (fn? draft-block)
        (is (= {:block/uuid draft-id
                :block/title "draft"
                :block/format :markdown
                :block/page {:block/uuid page-id}
                :block/parent comments-block}
               (draft-block comments-block draft-id "draft")))))))

(deftest comment-draft-storage
  (let [draft-key (resolve 'frontend.components.block.comments-model/comment-draft-storage-key)
        load-draft (resolve 'frontend.components.block.comments-model/saved-comment-draft)
        save-draft! (resolve 'frontend.components.block.comments-model/save-comment-draft!)
        clear-draft! (resolve 'frontend.components.block.comments-model/clear-comment-draft!)
        comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        comments-block {:block/uuid comments-id}]
    (is (fn? draft-key))
    (is (fn? load-draft))
    (is (fn? save-draft!))
    (is (fn? clear-draft!))
    (when (every? fn? [draft-key load-draft save-draft! clear-draft!])
      (is (= (str "comments-" comments-id "-draft")
             (draft-key comments-block)))
      (let [items (atom {})
            old-storage (gobj/get js/globalThis "localStorage")
            storage (js-obj
                     "getItem" (fn [key] (get @items key))
                     "setItem" (fn [key value] (swap! items assoc key value))
                     "removeItem" (fn [key] (swap! items dissoc key)))]
        (try
          (gobj/set js/globalThis "localStorage" storage)
          (save-draft! comments-block "  draft body\n")
          (is (= "  draft body\n" (load-draft comments-block))
              "Non-blank drafts should be restored exactly")
          (save-draft! comments-block "  ")
          (is (nil? (load-draft comments-block))
              "Blank drafts should not leave stale local storage entries")
          (save-draft! comments-block "another draft")
          (clear-draft! comments-block)
          (is (nil? (load-draft comments-block))
              "Submitted comments should clear the stored draft")
          (finally
            (if old-storage
              (gobj/set js/globalThis "localStorage" old-storage)
              (gobj/remove js/globalThis "localStorage"))))))))

(deftest comments-block-current-page
  (let [current-page? (resolve 'frontend.components.block.comments-model/comments-block-current-page?)
        comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"]
    (is (fn? current-page?))
    (when (fn? current-page?)
      (is (true? (current-page? {:block/uuid comments-id}
                                (str comments-id))))
      (is (false? (current-page? {:block/uuid comments-id}
                                 "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154")))
      (is (false? (current-page? {:block/uuid comments-id} nil)))
      (is (false? (current-page? {} (str comments-id)))))))
