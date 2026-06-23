(ns frontend.handler.db-based.recent-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.handler.db-based.recent :as db-recent-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(use-fixtures :each
  {:before test-helper/start-test-db!
   :after (fn []
            (state/set-current-repo! nil)
            (test-helper/destroy-test-db!))})

(defn- mark-page-recycled!
  [page-title]
  (let [conn (db/get-db test-helper/test-db false)]
    (d/transact! conn [[:db/add (:db/id (db/get-page page-title)) :logseq.property/deleted-at 1]])))

(deftest recents-test
  (testing "Add some pages to recent"
    (let [pages (map (fn [i] (str "Page " i)) (range 15))]
      ;; create pages
      (doseq [page pages]
        (test-helper/create-page! page {:redirect? false})
        (db-recent-handler/add-page-to-recent! (:db/id (db/get-page page)) false))
      (is (= (map :block/title (db-recent-handler/get-recent-pages)) (reverse pages)))
      (testing "Click existing recent item shouldn't update its position"
        (db-recent-handler/add-page-to-recent! (:db/id (db/get-page "Page 10")) true)
        (is (= (map :block/title (db-recent-handler/get-recent-pages)) (reverse pages)))))))

(deftest recents-hide-recycled-pages-without-removing-history-test
  (testing "Recycled recent pages are hidden from display without mutating recents"
    (let [active-page "Active page"
          recycled-page "Recycled page"]
      (doseq [page [active-page recycled-page]]
        (test-helper/create-page! page {:redirect? false})
        (db-recent-handler/add-page-to-recent! (:db/id (db/get-page page)) false))
      (let [recycled-page-id (:db/id (db/get-page recycled-page))]
        (mark-page-recycled! recycled-page)
        (is (= [active-page]
               (map :block/title (db-recent-handler/get-recent-pages))))
        (is (contains? (set (state/get-recent-pages)) recycled-page-id))))))

(deftest-async favorites-hide-recycled-pages-without-unfavoriting-test
  (let [active-page "Active favorite"
        recycled-page "Recycled favorite"]
    (test-helper/create-page! active-page {:redirect? false})
    (test-helper/create-page! recycled-page {:redirect? false})
    (p/let [_ (page-handler/<favorite-page! active-page)
            _ (page-handler/<favorite-page! recycled-page)
            recycled-page-uuid (:block/uuid (db/get-page recycled-page))
            _ (mark-page-recycled! recycled-page)]
      (is (= [active-page]
             (map :block/title (page-handler/get-favorites))))
      (is (true? (page-handler/favorited? (str recycled-page-uuid)))))))
