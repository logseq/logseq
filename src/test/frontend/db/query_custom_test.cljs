(ns frontend.db.query-custom-test
  (:require [cljs-time.core :as t]
            [cljs.test :refer [deftest is testing]]
            [frontend.state :as state]
            [frontend.worker.handler.query :as query-handler]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.test.helper :as db-test]))

(defn- journal-default-query
  [title-key]
  (->> (get-in state/db-default-config [:default-queries :journals])
       (some #(when (= title-key (:title-key %)) %))))

(defn- query-titles
  [db query-m today]
  (with-redefs [t/today (constantly today)]
    (->> (query-handler/execute-custom-query
          db
          query-m
          {:today-day (date-time-util/date->int today)})
         (map (comp :block/title first))
         set)))

(deftest journal-doing-query-includes-doing-pages-and-blocks
  (let [today (t/date-time 2026 8 28)
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Doing page"
                        :build/properties {:logseq.property/status :logseq.property/status.doing}
                        :build/tags [:logseq.class/Task]}}
                {:page {:block/title "Todo page"
                        :build/properties {:logseq.property/status :logseq.property/status.todo}
                        :build/tags [:logseq.class/Task]}}
                {:page {:block/title "Regular page"}
                 :blocks [{:block/title "Doing block on regular page"
                           :build/properties {:logseq.property/status :logseq.property/status.doing}
                           :build/tags [:logseq.class/Task]}]}
                {:page {:build/journal 20260820}
                 :blocks [{:block/title "Doing block on recent journal"
                           :build/properties {:logseq.property/status :logseq.property/status.doing}
                           :build/tags [:logseq.class/Task]}
                          {:block/title "Todo block on recent journal"
                           :build/properties {:logseq.property/status :logseq.property/status.todo}
                           :build/tags [:logseq.class/Task]}]}
                {:page {:build/journal 20260101}
                 :blocks [{:block/title "Doing block on old journal"
                           :build/properties {:logseq.property/status :logseq.property/status.doing}
                           :build/tags [:logseq.class/Task]}]}]})
        titles (query-titles @conn (journal-default-query :journal.default-query/doing) today)]
    (testing "Doing pages are included even though they have no :block/page"
      (is (contains? titles "Doing page")))
    (testing "Doing blocks on recent journal pages still match"
      (is (contains? titles "Doing block on recent journal")))
    (is (not (contains? titles "Todo page"))
        "Pages with Todo status are not included")
    (is (not (contains? titles "Todo block on recent journal"))
        "Todo blocks are not included")
    (is (not (contains? titles "Doing block on regular page"))
        "Doing blocks on non-journal pages stay excluded")
    (is (not (contains? titles "Doing block on old journal"))
        "Doing blocks outside the recent journal window stay excluded")))
