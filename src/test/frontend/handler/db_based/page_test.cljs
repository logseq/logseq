(ns frontend.handler.db-based.page-test
  (:require [frontend.handler.db-based.page :as db-page-handler]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.handler.page :as page-handler]
            [frontend.db :as db]
            [frontend.db.fix :as db-fix]
            [frontend.handler.editor :as editor-handler]))

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

(deftest rename-test
  (testing "Case change"
    (let [page (db/entity [:block/name "test"])]
      (db-page-handler/rename! "test" "Test")
      (let [entity (db/entity [:block/name "test"])]
        (is (= "Test" (:block/original-name entity)))
        ;; db id not changed
        (is (= (:db/id page) (:db/id entity))))))

  (testing "Name changed"
    (let [page (db/entity [:block/name "test"])]
      (db-page-handler/rename! "Test" "New name")
      (let [entity (db/entity [:block/name "new name"])]
        (is (= "New name" (:block/original-name entity)))
        (is (= (:db/id page) (:db/id entity))))))

  (testing "Merge existing page"
    (page-handler/create! "Existing page" {:redirect? false :create-first-block? true})
    (db-page-handler/rename! "New name" "Existing page")
    (let [e1 (db/entity [:block/name "new name"])
          e2 (db/entity [:block/name "existing page"])]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data)))))
      ;; Ensure there's no conflicts
      (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2)))))))

(deftest merge-with-empty-page
  (page-handler/create! "Existing page" {:redirect? false :create-first-block? false})
  (db-page-handler/rename! "Test" "Existing page")
  (let [e1 (db/entity [:block/name "test"])
        e2 (db/entity [:block/name "existing page"])]
      ;; Old page deleted
    (is (nil? e1))
      ;; Blocks from both pages have been merged
    (is (= (count (:block/_page e2)) (dec (count init-data))))
      ;; Ensure there's no conflicts
    (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2))))))

(deftest rename-a-page-to-existing-whiteboard
  (testing "Renaming a page to an existing whiteboard page"
    (page-handler/create! "Whiteboard page" {:redirect? false
                                             :whiteboard? true})
    (is (= :merge-whiteboard-pages (db-page-handler/rename! "Test" "Whiteboard page")))
    (is (= :merge-whiteboard-pages (db-page-handler/rename! "Whiteboard page" "Test")))))

(deftest merge-existing-pages-should-update-ref-ids
  (testing "Merge existing page"
    (editor-handler/save-block! repo fbid "Block 1 [[Test]]")
    (page-handler/create! "Existing page" {:redirect? false :create-first-block? true})
    (db-page-handler/rename! "Test" "Existing page")
    (let [e1 (db/entity [:block/name "test"])
          e2 (db/entity [:block/name "existing page"])]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data)))))
      ;; Ensure there's no conflicts
      (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2))))
      ;; Content updated
      (is (= "Block 1 [[Existing page]]" (:block/content (db/entity [:block/uuid fbid])))))))

;; TODO: full coverage
(deftest rename-namespace-pages
  (testing "Rename a page to a namespaced one"
    (db-page-handler/rename! "Test" "Abc/Def Ghi/Jk")
    (let [e1 (db/entity [:block/name "test"])
          e2 (db/entity [:block/name "abc/def ghi/jk"])
          e3 (db/entity [:block/name "abc/def ghi"])
          e4 (db/entity [:block/name "abc"])]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (dec (count init-data))))
      ;; Ensure there's no conflicts
      (is (empty? (db-fix/get-conflicts (db/get-db) (:db/id e2))))
      (is (= (:db/id e3) (:db/id (:block/namespace e2))))
      (is (= (:db/id e4) (:db/id (:block/namespace e3)))))))
