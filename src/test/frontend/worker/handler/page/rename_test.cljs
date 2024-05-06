(ns frontend.worker.handler.page.rename-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.handler.page :as page-handler]
            [frontend.db :as db]
            [frontend.worker.handler.page.file-based.rename :as worker-page-rename]
            [frontend.handler.editor :as editor-handler]))

;; FIXME: merge properties from both pages

(def repo test-helper/test-db-name)

(def init-data (test-helper/initial-test-page-and-blocks))

(def fbid (:block/uuid (second init-data)))

(defn start-and-destroy-db
  [f]
  (test-helper/start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(use-fixtures :each start-and-destroy-db)

(defn- page-rename [page-uuid new-name]
  (worker-page-rename/rename! repo (db/get-db repo false) {} page-uuid new-name))

(deftest rename-test
  (testing "Case change"
    (let [page (db/get-page "test")]
      (page-rename (:block/uuid page) "Test")
      (is (= "Test" (:block/original-name (db/entity (:db/id page)))))))

  (testing "Name changed"
    (let [page (db/get-page "Test")]
      (page-rename (:block/uuid page) "New name")
      (is (= "New name" (:block/original-name (db/entity (:db/id page)))))))

  (testing "Merge existing page"
    (page-handler/create! "Existing page" {:redirect? false :create-first-block? true})
    (let [page (db/get-page "new name")]
      (page-rename (:block/uuid page) "Existing page"))
    (let [e1 (db/get-page "new name")
          e2 (db/get-page "existing page")]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data))))))))

(deftest merge-with-empty-page
  (page-handler/create! "Existing page" {:redirect? false :create-first-block? false})
  (let [page (db/get-page "test")]
    (page-rename (:block/uuid page) "Existing page"))
  (let [e1 (db/get-page "test")
        e2 (db/get-page "existing page")]
      ;; Old page deleted
    (is (nil? e1))
      ;; Blocks from both pages have been merged
    (is (= (count (:block/_page e2)) (dec (count init-data))))))

(deftest merge-existing-pages-should-update-ref-ids
  (testing "Merge existing page"
    (editor-handler/save-block! repo fbid "Block 1 [[Test]]")
    (page-handler/create! "Existing page" {:redirect? false :create-first-block? true})
    (let [page (db/get-page "test")]
      (page-rename (:block/uuid page) "Existing page"))
    (let [e1 (db/get-page "test")
          e2 (db/get-page "existing page")]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data)))))
      ;; Content updated
      (is (= "Block 1 [[Existing page]]" (:block/content (db/entity [:block/uuid fbid])))))))
