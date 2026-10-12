(ns logseq.db.frontend.content-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.content :as db-content]))

(def ^:private uuid-a #uuid "11111111-1111-1111-1111-111111111111")
(def ^:private uuid-b #uuid "22222222-2222-2222-2222-222222222222")
(def ^:private uuid-p #uuid "33333333-3333-3333-3333-333333333333")

;; Fails if, in `ref->title-entry`, `and` becomes `or`.
(deftest recur-replace-uuid-in-block-title-without-block-refs-test
  (let [block-a {:block/uuid uuid-a :block/title "Block A"}
        page-p {:block/uuid uuid-p :block/title "Page P"
                :block/tags [{:db/ident :logseq.class/Page}]}
        ent {:block/title (str "see " (page-ref/->page-ref uuid-a) " and " (page-ref/->page-ref uuid-p))
             :block/refs [block-a page-p]}]
    (testing ":replace-block-refs? false replaces page refs only"
      (is (= (str "see " (page-ref/->page-ref uuid-a) " and [[Page P]]")
             (db-content/recur-replace-uuid-in-block-title ent 10 {:replace-block-refs? false}))))
    (testing "by default block refs are replaced too"
      (is (= "see [[Block A]] and [[Page P]]"
             (db-content/recur-replace-uuid-in-block-title ent))))))

;; Fails if, in `recur-replace-uuid-in-block-title`, `or` becomes `and`, `>=` becomes `>` or `inc` becomes `dec`.
(deftest recur-replace-uuid-in-block-title-stops-replacing-at-max-depth-test
  ;; The title refs A and P; A's title refs P again. P is a direct ref, so its
  ;; title is known, but its 2nd occurrence only appears after the 1st
  ;; replacement round, which max-depth 1 does not go past.
  (let [page-p {:block/uuid uuid-p :block/title "Page P"
                :block/tags [{:db/ident :logseq.class/Page}]}
        block-a {:block/uuid uuid-a :block/title (str "A of " (page-ref/->page-ref uuid-p))}
        ent {:block/title (str (page-ref/->page-ref uuid-a) " " (page-ref/->page-ref uuid-p))
             :block/refs [block-a page-p]}]
    (is (= (str "[[A of " (page-ref/->page-ref uuid-p) "]] [[Page P]]")
           (db-content/recur-replace-uuid-in-block-title ent 1)))
    (is (= "[[A of [[Page P]]]] [[Page P]]"
           (db-content/recur-replace-uuid-in-block-title ent 2)))
    (testing "an unknown ref stays as is"
      (is (= (str "see " (page-ref/->page-ref uuid-b))
             (db-content/recur-replace-uuid-in-block-title
              {:block/title (str "see " (page-ref/->page-ref uuid-b))
               :block/refs []}))))))
