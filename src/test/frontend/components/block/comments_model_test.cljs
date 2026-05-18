(ns frontend.components.block.comments-model-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.comments-model :as comments-model]))

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
        ordinary-block {:block/title "ordinary"}
        ordinary-target {:block/title "target"}]
    (testing "comment area and its children are protected comment blocks"
      (is (true? (comments-model/protected-comment-block? comments-area)))
      (is (true? (comments-model/protected-comment-block? comment-block)))
      (is (false? (comments-model/protected-comment-block? ordinary-block))))
    (testing "comment blocks cannot be moved"
      (is (false? (comments-model/move-allowed? [comments-area] ordinary-target)))
      (is (false? (comments-model/move-allowed? [comment-block] ordinary-target))))
    (testing "ordinary blocks cannot be moved into comments"
      (is (false? (comments-model/move-allowed? [ordinary-block] comments-area)))
      (is (false? (comments-model/move-allowed? [ordinary-block] comment-block))))
    (testing "ordinary blocks can still move next to the comments area"
      (is (true? (comments-model/move-allowed? [ordinary-block] comments-area {:sibling? true}))))
    (testing "ordinary moves outside comments stay allowed"
      (is (true? (comments-model/move-allowed? [ordinary-block] ordinary-target))))))

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
        (is (false? (owned? {:logseq.property/created-by-ref {:block/uuid user-id}}
                            nil)))))))

(deftest comment-actions
  (let [actions (resolve 'frontend.components.block.comments-model/comment-actions)
        user-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        other-id #uuid "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154"]
    (testing "always exposes reaction and edit actions"
      (is (fn? actions))
      (when (fn? actions)
        (is (= [:reaction :edit]
               (actions {:logseq.property/created-by-ref {:block/uuid other-id}}
                        (str user-id))))))

    (testing "exposes delete only for comments created by current user"
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
