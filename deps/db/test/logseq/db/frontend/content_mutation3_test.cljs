(ns logseq.db.frontend.content-mutation3-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.test.helper :as db-test]))

(def ^:private uuid-a #uuid "11111111-1111-1111-1111-111111111111")
(def ^:private uuid-b #uuid "22222222-2222-2222-2222-222222222222")

(deftest content-id-ref->page-only-replaces-with-titled-refs-test
  (let [content (str "see " (page-ref/->page-ref uuid-a) " and " (page-ref/->page-ref uuid-b))]
    (is (= (str "see " (page-ref/->page-ref uuid-a) " and Page B")
           (db-content/content-id-ref->page content [{:block/uuid uuid-a}
                                                     {:block/uuid uuid-b :block/title "Page B"}])))))

(deftest get-matched-ids-returns-each-id-once-test
  (is (= [uuid-a uuid-b]
         (db-content/get-matched-ids
          (str (page-ref/->page-ref uuid-a) (page-ref/->page-ref uuid-a) (page-ref/->page-ref uuid-b))))))

(deftest title-has-id-ref?-test
  (is (true? (db-content/title-has-id-ref? (str "x " (page-ref/->page-ref uuid-a)))))
  (is (false? (db-content/title-has-id-ref? "x [[not a uuid]]")))
  (is (false? (db-content/title-has-id-ref? nil))))

(deftest update-block-content-replaces-id-refs-with-titles-of-the-blocks-refs-test
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:db/id -1
                        :block/name "target page"
                        :block/title "Target page"
                        :block/uuid uuid-a
                        :block/tags [:logseq.class/Page]}
                       {:db/id -2
                        :block/title (str "see " (page-ref/->page-ref uuid-a))
                        :block/uuid uuid-b
                        :block/page -1
                        :block/parent -1
                        :block/order "a"
                        :block/refs [-1]}])
    (let [eid (:db/id (d/entity @conn [:block/uuid uuid-b]))
          item {:block/title (str "see " (page-ref/->page-ref uuid-a))}]
      (is (= {:block/title "see [[Target page]]"}
             (db-content/update-block-content @conn item eid)))
      (is (= {:block/uuid uuid-a}
             (db-content/update-block-content @conn {:block/uuid uuid-a} eid))
          "an item without a title is returned as is"))))

(deftest replace-tag-refs-with-page-refs-trims-test
  (is (= (str "see " (page-ref/->page-ref uuid-a))
         (db-content/replace-tag-refs-with-page-refs
          (str "  see #" (page-ref/->page-ref uuid-a) "  ")
          [{:block/title "Tag A" :block/uuid uuid-a}]))))

(deftest replace-tag-refs-with-page-refs-collapses-double-hash-test
  (is (= (str "see " (page-ref/->page-ref uuid-a))
         (db-content/replace-tag-refs-with-page-refs
          (str "see ##" (page-ref/->page-ref uuid-a))
          [{:block/uuid uuid-a}]))))

(deftest recur-replace-uuid-in-block-title-follows-refs-up-to-max-depth-test
  ;; a map block: its own title refs are not followed, only its :block/refs,
  ;; so B's title is 2 levels away
  (let [block {:block/title (str "see " (page-ref/->page-ref uuid-b))
               :block/refs [{:block/uuid uuid-a
                             :block/title "A"
                             :block/refs [{:block/uuid uuid-b :block/title "B"}]}]}]
    (is (= (str "see " (page-ref/->page-ref uuid-b))
           (db-content/recur-replace-uuid-in-block-title block 1)))
    (is (= "see [[B]]"
           (db-content/recur-replace-uuid-in-block-title block 2)))))

(deftest recur-replace-uuid-in-block-title-without-id-refs-returns-title-test
  ;; the block's refs are not walked when its title has no id ref, so a ref
  ;; without a title (which the walk cannot read) does not matter
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:db/id -1 :block/uuid uuid-b}
                       {:db/id -2
                        :block/uuid uuid-a
                        :block/title "plain title"
                        :block/refs [-1]}])
    (is (= "plain title"
           (db-content/recur-replace-uuid-in-block-title (d/entity @conn [:block/uuid uuid-a]))))))

(deftest replace-tags-with-id-refs-replaces-both-tag-forms-and-trims-test
  (let [tags [{:block/title "favorite book" :block/uuid uuid-a}
              {:block/title "book" :block/uuid uuid-b}]]
    (is (= (str (page-ref/->page-ref uuid-a) " " (page-ref/->page-ref uuid-b))
           (db-content/replace-tags-with-id-refs "  #[[favorite book]] #book  " tags)))))
