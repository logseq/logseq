(ns frontend.handler.db-based.recent-test
  (:require [frontend.handler.db-based.recent :as db-recent-handler]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.handler.page :as page-handler]))

(def init-data (test-helper/initial-test-page-and-blocks))
(defn start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(use-fixtures :each start-and-destroy-db)

(deftest recents-test
  (testing "Add some pages to recent"
    (let [pages (map (fn [i] (str "Page " i)) (range 15))]
      ;; create pages
      (doseq [page pages]
        (page-handler/create! page {:redirect? false :create-first-block? false :class? true})
        (db-recent-handler/add-page-to-recent! page false))
      (is (= (db-recent-handler/get-recent-pages) (reverse pages)))
      (testing "Click existing recent item shouldn't update its position"
        (db-recent-handler/add-page-to-recent! "Page 10" true)
        (is (= (db-recent-handler/get-recent-pages) (reverse pages)))))))
