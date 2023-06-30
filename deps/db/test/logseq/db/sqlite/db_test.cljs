(ns logseq.db.sqlite.db-test
  (:require [cljs.test :refer [deftest async use-fixtures is testing]]
            ["fs" :as fs]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]))

(use-fixtures
  :each
 ;; Cleaning tmp/ before leaves last tmp/ after a test run for dev and debugging
  {:before
   #(async done
           (if (fs/existsSync "tmp")
             (fs/rm "tmp" #js {:recursive true} (fn [err]
                                                  (when err (js/console.log err))
                                                  (done)))
             (done)))})

(defn- create-graph-dir
  [dir db-name]
  (fs/mkdirSync (node-path/join dir db-name) #js {:recursive true}))

(deftest get-initial-data
  (testing "Fetches file block"
    (create-graph-dir "tmp/graphs" "test-db")
    (sqlite-db/open-db! "tmp/graphs" "test-db")
    (let [blocks (mapv sqlite-util/ds->sqlite-block
                       [{:block/uuid (random-uuid)
                         :file/path "logseq/config.edn"
                         :file/content "{:foo :bar}"}])
          _ (sqlite-db/upsert-blocks! "test-db" (bean/->js blocks))]
      (is (= {:content "{:foo :bar}"
              :name nil
              :type 3}
             (-> (sqlite-db/get-initial-data "test-db")
                 :init-data
                 bean/->clj
                 first
                 (select-keys [:content :name :type])))
          "Correct file with content is found"))))

(deftest upsert-blocks!
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)
        created-at 1688054127299]
    (create-graph-dir "tmp/graphs" "test-db")
    (sqlite-db/open-db! "tmp/graphs" "test-db")

    (testing "Creates a journal block"
      (let [blocks (mapv sqlite-util/ds->sqlite-block
                         [{:block/uuid page-uuid
                           :block/journal-day 20230629
                           :block/name "jun 29th, 2023"
                           :block/created-at created-at
                           :block/updated-at created-at}
                          {:block/content "test"
                           :block/uuid block-uuid
                           :block/page {:db/id 100022}
                           :block/created-at created-at
                           :block/updated-at created-at
                           :page_uuid page-uuid}])
            _ (sqlite-db/upsert-blocks! "test-db" (bean/->js blocks))
            db-data (sqlite-db/get-initial-data "test-db")]
        (is (= {:uuid (str page-uuid) :page_journal_day 20230629
                :name "jun 29th, 2023" :type 2
                :created_at created-at}
               (-> db-data
                   :all-pages
                   first
                   bean/->clj
                   (select-keys [:uuid :page_journal_day :type :name :created_at])))
            "New journal page is saved")

        (is (= {:content "test" :name nil
                :uuid (str block-uuid) :type 1
                :created_at created-at}
               (-> db-data
                   :journal-blocks
                   first
                   bean/->clj
                   (select-keys [:uuid :type :content :name :created_at])))
            "New journal block content is saved")

        (is (= [{:uuid (str block-uuid) :page_uuid (str page-uuid)}]
               (-> db-data :all-blocks bean/->clj))
            "Correct block and page uuid pairs exist")))

    (testing "Updates a block"
      (let [updated-at 1688072416134
            blocks (mapv sqlite-util/ds->sqlite-block
                         [{:block/uuid page-uuid
                           :block/journal-day 20230629
                           :block/name "jun 29th, 2023"
                           :block/created-at created-at
                           :block/updated-at updated-at}
                          {:block/content "test edit"
                           :block/uuid block-uuid
                           :block/page {:db/id 100022}
                           :block/created-at created-at
                           :block/updated-at updated-at
                           :page_uuid page-uuid}])
            _ (sqlite-db/upsert-blocks! "test-db" (bean/->js blocks))
            db-data (sqlite-db/get-initial-data "test-db")]
        (is (= {:uuid (str page-uuid) :updated_at updated-at :created_at created-at}
               (-> db-data
                   :all-pages
                   first
                   bean/->clj
                   (select-keys [:uuid :updated_at :created_at])))
            "Updated page has correct timestamps")

        (is (= {:content "test edit" :created_at created-at :updated_at updated-at}
               (-> db-data
                   :journal-blocks
                   first
                   bean/->clj
                   (select-keys [:content :created_at :updated_at])))
            "Updated block has correct content and timestamps")))))

(deftest get-other-data
  (testing "Retrieves a normal page block"
    (create-graph-dir "tmp/graphs" "test-db")
    (sqlite-db/open-db! "tmp/graphs" "test-db")
    (let [page-uuid (random-uuid)
          block-uuid (random-uuid)
          blocks (mapv sqlite-util/ds->sqlite-block
                       [{:block/uuid page-uuid
                         :block/name "some page"}
                        {:block/content "test"
                         :block/uuid block-uuid
                         :block/page {:db/id 100022}
                         :page_uuid page-uuid}])]
      (sqlite-db/upsert-blocks! "test-db" (bean/->js blocks))
      (is (= {:content "test" :uuid (str block-uuid)
              :page_uuid (str page-uuid) :type 1}
             (-> (sqlite-db/get-other-data "test-db" [])
                 bean/->clj
                 first
                 (select-keys [:content :page_uuid :type :uuid])))
          "New page block is fetched with get-other-data"))))