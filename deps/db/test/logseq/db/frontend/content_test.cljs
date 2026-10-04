(ns logseq.db.frontend.content-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.test.helper :as db-test]
            [logseq.common.util.page-ref :as page-ref]))

(deftest replace-tags-with-page-refs
  (testing "tags with overlapping names get replaced correctly"
    (is (= "string [[foo]] string2 [[foo-bar]]"
           (db-content/replace-tags-with-id-refs
            "string #foo string2 #foo-bar"
            [{:block/title "foo" :block/uuid "foo"}
             {:block/title "foo-bar" :block/uuid "foo-bar"}])))))

(deftest title-ref->id-ref
  (let [page-uuid (random-uuid)]
    (is (= (str "some page ref " (page-ref/->page-ref page-uuid))
           (db-content/title-ref->id-ref "some page ref [[page1]]" [{:block/title "page1" :block/uuid page-uuid}]))
        "Replaces page ref name with uuid"))

  (testing "uses original page name when journal title is normalized"
    (let [journal-uuid #uuid "00000001-2026-0615-0000-000000000000"]
      (is (= (str "some page ref " (page-ref/->page-ref journal-uuid))
             (db-content/title-ref->id-ref
              "some page ref [[2026-06-15]]"
              [{:block/title "Jun 15th, 2026"
                :block.temp/original-page-name "2026-06-15"
                :block/uuid journal-uuid}])))))

  (testing "ignores refs without uuid"
    (is (= "some page ref [[2026-06-15]]"
           (db-content/title-ref->id-ref
            "some page ref [[2026-06-15]]"
            [{:block/title "2026-06-15"}]))))

  (testing "does replace tag with :replace-tag? true"
    (is (= "some #[[5c6cd067-c602-4955-96b8-74b62e08113c]] tag"
           (db-content/title-ref->id-ref "some #test tag"
                                         [{:block/title "test" :block/uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"}]
                                         {:replace-tag? true})))
    (is (= "some #[[5c6cd067-c602-4955-96b8-74b62e08113c]] tag"
           (db-content/title-ref->id-ref "some #[[another test]] tag"
                                         [{:block/title "another test" :block/uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"}]
                                         {:replace-tag? true}))))

  (testing "does not replace tag with :replace-tag? false"
    (is (= "some #test tag"
           (db-content/title-ref->id-ref "some #test tag"
                                         [{:block/title "test" :block/uuid (random-uuid)}]
                                         {:replace-tag? false})))
    (is (= "some #[[another test]] tag"
           (db-content/title-ref->id-ref "some #[[another test]] tag"
                                         [{:block/title "another test" :block/uuid (random-uuid)}]
                                         {:replace-tag? false})))))

(deftest recur-replace-uuid-in-block-title-test
  (let [uuid-a #uuid "11111111-1111-1111-1111-111111111111"
        uuid-b #uuid "22222222-2222-2222-2222-222222222222"
        uuid-c #uuid "33333333-3333-3333-3333-333333333333"
        id-ref-a (page-ref/->page-ref uuid-a)
        id-ref-b (page-ref/->page-ref uuid-b)
        id-ref-c (page-ref/->page-ref uuid-c)]
    (testing "replaces direct id-ref title"
      (is (= "[[Direct Page]]"
             (db-content/recur-replace-uuid-in-block-title
              {:block/title id-ref-a
               :block/refs [{:block/uuid uuid-a
                             :block/title "Direct Page"}]}))))

    (testing "replaces recursively through nested refs"
      (is (= "[[[[Leaf Page]]]]"
             (db-content/recur-replace-uuid-in-block-title
              {:block/title id-ref-a
               :block/refs [{:block/uuid uuid-a
                             :block/title id-ref-b
                             :block/refs [{:block/uuid uuid-b
                                           :block/title "Leaf Page"}]}]}))))

    (testing "keeps hashtag style for simple page title"
      (is (= "#simple-tag"
             (db-content/recur-replace-uuid-in-block-title
              {:block/title (str "#" id-ref-a)
               :block/refs [{:block/uuid uuid-a
                             :block/title "simple-tag"}]}))))

    (testing "keeps page-ref style hashtag when title contains spaces"
      (is (= "#[[tag with space]]"
             (db-content/recur-replace-uuid-in-block-title
              {:block/title (str "#" id-ref-a)
               :block/refs [{:block/uuid uuid-a
                             :block/title "tag with space"}]}))))

    (testing "stops recursion when max-depth reached"
      (let [result (db-content/recur-replace-uuid-in-block-title
                    {:block/title id-ref-a
                     :block/refs [{:block/uuid uuid-a
                                   :block/title id-ref-b
                                   :block/refs [{:block/uuid uuid-b
                                                 :block/title id-ref-c
                                                 :block/refs [{:block/uuid uuid-c
                                                               :block/title "Too Deep"}]}]}]}
                    1)]
        (is (re-find db-content/id-ref-pattern result))
        (is (not (string/includes? result "Too Deep")))))

    (testing "leaves ((uuid)) alone (block refs unsupported, node refs use [[]])"
      (is (= (str "see ((" uuid-a "))")
             (db-content/recur-replace-uuid-in-block-title
              {:block/title (str "see ((" uuid-a "))")
               :block/refs [{:block/uuid uuid-a
                             :block/title "Target block"}]}))))))

(deftest recur-replace-uuid-in-block-title-db-test
  (testing "resolves [[uuid]] from db when :block/refs is missing"
    (let [conn (db-test/create-conn)
          target-uuid #uuid "44444444-4444-4444-4444-444444444444"
          ref-uuid #uuid "55555555-5555-5555-5555-555555555555"
          page-uuid #uuid "66666666-6666-6666-6666-666666666666"]
      (d/transact! conn [{:db/id -1
                          :block/name "p1"
                          :block/title "p1"
                          :block/uuid page-uuid}
                         {:db/id -2
                          :block/title "Target block"
                          :block/uuid target-uuid
                          :block/page -1
                          :block/parent -1
                          :block/order "a"}
                         {:db/id -3
                          :block/title (str "see [[" target-uuid "]]")
                          :block/uuid ref-uuid
                          :block/page -1
                          :block/parent -1
                          :block/order "b"}])
      (is (= "see [[Target block]]"
             (db-content/recur-replace-uuid-in-block-title
              (db-test/find-block-by-content @conn #"^see")))))))

(deftest get-matched-ids-test
  (let [uuid-a #uuid "11111111-1111-1111-1111-111111111111"
        uuid-b #uuid "22222222-2222-2222-2222-222222222222"]
    (is (= #{uuid-b}
           (set (db-content/get-matched-ids
                 (str "a ((" uuid-a ")) b [[" uuid-b "]]"))))
        "extracts [[uuid]] node refs only; ((uuid)) is unsupported")))
