(ns frontend.handler.db-based.editor-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.db :as db]
            [frontend.handler.db-based.editor :as db-editor-handler]))

(deftest wrap-parse-block-markdown-heading-test
  (testing "normal blocks save markdown heading syntax as heading property"
    (is (= {:block/title "Heading"
            :logseq.property/heading 1}
           (select-keys (db-editor-handler/wrap-parse-block
                         {:block/title "# Heading"})
                        [:block/title :logseq.property/heading]))))

  (testing "raw display-type blocks preserve leading hash text"
    (doseq [display-type [:code :math]]
      (is (= {:block/title "# shell comment"
              :logseq.property.node/display-type display-type}
             (select-keys (db-editor-handler/wrap-parse-block
                           {:block/title "# shell comment"
                            :logseq.property.node/display-type display-type})
                          [:block/title
                           :logseq.property/heading
                           :logseq.property.node/display-type]))
          (str "Preserves content for " display-type)))))

(deftest wrap-parse-block-markdown-hashtag-link-test
  (testing "markdown link targets that resolve to existing hashtag pages are saved as refs"
    (let [tag-uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"
          tag-page {:db/id 12
                    :block/title "Tag1"
                    :block/name "tag1"
                    :block/uuid tag-uuid
                    :block/tags [{:db/ident :logseq.class/Tag}]}]
      (with-redefs [db/get-page (fn [page]
                                  (when (= "Tag1" page)
                                    tag-page))]
        (let [result (db-editor-handler/wrap-parse-block
                      {:block/title "alias [Tag Number One](#Tag1)"})]
          (is (= (str "alias [Tag Number One](#[[" tag-uuid "]])")
                 (:block/title result)))
          (is (= [tag-uuid] (map :block/uuid (:block/refs result)))))))))

(deftest wrap-parse-block-preserves-multiple-block-refs-test
  (testing "multiple block refs are preserved when markdown hashtag refs are merged"
    (let [block-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          ref-uuid-a #uuid "11111111-1111-1111-1111-111111111111"
          ref-uuid-b #uuid "22222222-2222-2222-2222-222222222222"]
      (with-redefs [db/entity (fn [lookup]
                                (when (and (vector? lookup)
                                           (= :block/uuid (first lookup)))
                                  {:block/uuid (second lookup)}))]
        (let [result (db-editor-handler/wrap-parse-block
                      {:block/uuid block-uuid
                       :block/title (str "((" ref-uuid-a ")) ((" ref-uuid-b "))")})]
          (is (= #{[:block/uuid ref-uuid-a]
                   [:block/uuid ref-uuid-b]}
                 (set (:block/refs result))))
          (is (= 2 (count (:block/refs result)))))))))
