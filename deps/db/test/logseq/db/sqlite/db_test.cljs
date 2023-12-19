(ns logseq.db.sqlite.db-test
  (:require [cljs.test :refer [deftest async use-fixtures is testing]]
            ["fs" :as fs]
            ["path" :as node-path]
            [datascript.core :as d]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [logseq.db.sqlite.db :as sqlite-db]))

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
  (testing "Fetches a defined block"
    (create-graph-dir "tmp/graphs" "test-db")
    
    (let [conn* (sqlite-db/open-db! "tmp/graphs" "test-db")
          blocks [{:block/uuid (random-uuid)
                   :file/path "logseq/config.edn"
                   :file/content "{:foo :bar}"}]
          _ (d/transact! conn* blocks)
          ;; Simulate getting data from sqlite and restoring it for frontend
          conn (-> (sqlite-common-db/get-initial-data @conn*)
                   sqlite-common-db/restore-initial-data)]
      (is (= blocks
             (->> @conn
                  (d/q '[:find (pull ?b [:block/uuid :file/path :file/content]) :where [?b :file/content]])
                  (map first)))
          "Correct file with content is found"))))

(deftest restore-initial-data
  (testing "Restore a journal page with its block"
    (create-graph-dir "tmp/graphs" "test-db")
    (let [conn* (sqlite-db/open-db! "tmp/graphs" "test-db")
          page-uuid (random-uuid)
          block-uuid (random-uuid)
          created-at (js/Date.now)
          blocks [{:db/id 100001
                   :block/uuid page-uuid
                   :block/journal-day 20230629
                   :block/name "jun 29th, 2023"
                   :block/created-at created-at
                   :block/updated-at created-at}
                  {:db/id 100002
                   :block/content "test"
                   :block/uuid block-uuid
                   :block/page {:db/id 100001}
                   :block/created-at created-at
                   :block/updated-at created-at}]
          _ (d/transact! conn* blocks)
          ;; Simulate getting data from sqlite and restoring it for frontend
          conn (-> (sqlite-common-db/get-initial-data @conn*)
                   sqlite-common-db/restore-initial-data)]
      (is (= blocks
             (->> (d/q '[:find (pull ?b [*])
                         :where [?b :block/created-at]]
                       @conn)
                  (map first)))
          "Datascript db matches data inserted into sqlite"))))