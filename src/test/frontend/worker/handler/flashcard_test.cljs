(ns frontend.worker.handler.flashcard-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.flashcard :as flashcard]
            [logseq.db.test.helper :as db-test]))

(defn- card-titles
  [db ids]
  (->> ids
       (map #(d/entity db %))
       (map :block/title)
       set))

(defn- all-card-ids
  [db]
  (d/q '[:find [?b ...]
         :where
         [?b :block/tags :logseq.class/Card]
         [?b :block/uuid]]
       db))

(defn- cards-db
  [{:keys [due-ms future-ms]}]
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "Flashcards"}
      :blocks [{:block/title "new card"
                :build/tags [:logseq.class/Card]}
               {:block/title "due card"
                :build/tags [:logseq.class/Card]
                :build/properties {:logseq.property.fsrs/due due-ms}}
               {:block/title "future card"
                :build/tags [:logseq.class/Card]
                :build/properties {:logseq.property.fsrs/due future-ms}}]}]}))

(deftest fsrs-due-card-block-ids-skips-not-due-cards
  (testing "Flashcards view query is due-only, so due=0 hides existing cards"
    (let [now (js/Date.now)
          conn (cards-db {:due-ms (- now 1000)
                          :future-ms (+ now 86400000)})
          db @conn
          all-ids (all-card-ids db)
          due-ids (#'flashcard/fsrs-card-block-ids db nil {:due-only? true})]
      (is (= #{"new card" "due card" "future card"}
             (card-titles db all-ids))
          "#Card page still lists every card")
      (is (= #{"new card" "due card"}
             (card-titles db due-ids))
          "Due query keeps new and overdue cards")
      (is (not (contains? (card-titles db due-ids) "future card"))
          "Due query hides cards whose due date is in the future"))))

(deftest fsrs-due-card-block-ids-empty-when-all-cards-are-not-due
  (testing "Issue 1271: cards exist, but the due-only Flashcards query returns nothing"
    (let [future-ms (+ (js/Date.now) 86400000)
          conn (cards-db {:due-ms future-ms
                          :future-ms (+ future-ms 1000)})]
      (d/transact! conn [[:db/add (:db/id (db-test/find-block-by-content @conn "new card"))
                          :logseq.property.fsrs/due future-ms]])
      (let [db @conn
            all-ids (all-card-ids db)
            due-ids (#'flashcard/fsrs-card-block-ids db nil {:due-only? true})]
        (is (= 3 (count all-ids))
            "All three #Card blocks are still in the graph")
        (is (empty? due-ids)
            "Due counter / Flashcards view query is empty when no cards are due")
        (is (= #{"new card" "due card" "future card"}
               (card-titles db all-ids))
            "Empty Flashcards view is a due-only filter bug, not missing card data")
        (is (= #{"new card" "due card" "future card"}
               (card-titles db (#'flashcard/fsrs-card-block-ids db nil {:due-only? false})))
            "All-cards query still returns existing cards when due=0")))))

(deftest fsrs-card-block-ids-includes-not-due-cards
  (testing "browse query returns every #Card, including future-due cards"
    (let [now (js/Date.now)
          conn (cards-db {:due-ms (- now 1000)
                          :future-ms (+ now 86400000)})
          db @conn]
      (is (= #{"new card" "due card" "future card"}
             (card-titles db (#'flashcard/fsrs-card-block-ids db nil {:due-only? false}))))
      (is (= #{"new card" "due card"}
             (card-titles db (#'flashcard/fsrs-card-block-ids db nil {:due-only? true})))
          "due-only review is unchanged when due>0"))))
