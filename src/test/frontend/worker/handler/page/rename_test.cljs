(ns frontend.worker.handler.page.rename-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.worker.handler.page.rename :as worker-page-rename]))

;; FIXME: merge properties from both pages

(def repo test-helper/test-db-name-db-version)

(def init-data (test-helper/initial-test-page-and-blocks))

(def fbid (:block/uuid (second init-data)))

(defn start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(use-fixtures :each start-and-destroy-db)

(defn- page-rename [old-name new-name]
  (worker-page-rename/rename! repo (db/get-db repo false) {} old-name new-name))

(deftest rename-test
  (testing "Case change"
    (let [page (db/get-page "test")]
      (page-rename "test" "Test")
      (let [entity (db/get-page "test")]
        (is (= "Test" (:block/original-name entity)))
        ;; db id not changed
        (is (= (:db/id page) (:db/id entity))))))

  (testing "Name changed"
    (let [page (db/get-page "test")]
      (page-rename "Test" "New name")
      (let [entity (db/get-page "new name")]
        (is (= "New name" (:block/original-name entity)))
        (is (= (:db/id page) (:db/id entity))))))

  ;; (testing "Merge existing page"
  ;;   (page-handler/create! "Existing page" {:redirect? false :create-first-block? true})
  ;;   (page-rename "New name" "Existing page")
  ;;   (let [e1 (db/get-page "new name")
  ;;         e2 (db/get-page "existing page")]
  ;;     ;; Old page deleted
  ;;     (is (nil? e1))
  ;;     ;; Blocks from both pages have been merged
  ;;     (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data)))))
  ;;     ;; Ensure there's no conflicts
  ;;     (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2))))))
  )

;; (deftest merge-with-empty-page
;;   (page-handler/create! "Existing page" {:redirect? false :create-first-block? false})
;;   (page-rename "Test" "Existing page")
;;   (let [e1 (db/get-page "test")
;;         e2 (db/get-page "existing page")]
;;       ;; Old page deleted
;;     (is (nil? e1))
;;       ;; Blocks from both pages have been merged
;;     (is (= (count (:block/_page e2)) (dec (count init-data))))
;;       ;; Ensure there's no conflicts
;;     (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2))))))

;; (deftest merge-existing-pages-should-update-ref-ids
;;   (testing "Merge existing page"
;;     (editor-handler/save-block! repo fbid "Block 1 [[Test]]")
;;     (page-handler/create! "Existing page" {:redirect? false :create-first-block? true})
;;     (page-rename "Test" "Existing page")
;;     (let [e1 (db/get-page "test")
;;           e2 (db/get-page "existing page")]
;;       ;; Old page deleted
;;       (is (nil? e1))
;;       ;; Blocks from both pages have been merged
;;       (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data)))))
;;       ;; Ensure there's no conflicts
;;       (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2))))
;;       ;; Content updated
;;       (is (= "Block 1 [[Existing page]]" (:block/content (db/entity [:block/uuid fbid])))))))
