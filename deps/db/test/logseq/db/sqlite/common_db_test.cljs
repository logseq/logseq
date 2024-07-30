(ns logseq.db.sqlite.common-db-test
  (:require [cljs.test :refer [deftest async use-fixtures is testing]]
            ["fs" :as fs]
            ["path" :as node-path]
            [datascript.core :as d]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.sqlite.cli :as sqlite-cli]
            [clojure.string :as string]))

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

    (let [conn* (sqlite-cli/open-db! "tmp/graphs" "test-db")
          blocks [{:file/path "logseq/config.edn"
                   :file/content "{:foo :bar}"}]
          _ (d/transact! conn* blocks)
          ;; Simulate getting data from sqlite and restoring it for frontend
          {:keys [schema initial-data]} (sqlite-common-db/get-initial-data @conn*)
          conn (sqlite-common-db/restore-initial-data initial-data schema)]
      (is (= blocks
             (->> @conn
                  (d/q '[:find (pull ?b [:block/uuid :file/path :file/content]) :where [?b :file/content]])
                  (map first)))
          "Correct file with content is found"))))

(deftest restore-initial-data
  (testing "Restore a journal page"
    (create-graph-dir "tmp/graphs" "test-db")
    (let [conn* (sqlite-cli/open-db! "tmp/graphs" "test-db")
          page-uuid (random-uuid)
          block-uuid (random-uuid)
          created-at (js/Date.now)
          date-int (date-time-util/date->int (js/Date.))
          date-title (date-time-util/int->journal-title date-int "MMM do, yyyy")
          blocks [{:db/id 100001
                   :block/uuid page-uuid
                   :block/journal-day date-int
                   :block/name (string/lower-case date-title)
                   :block/title date-title
                   :block/created-at created-at
                   :block/updated-at created-at}
                  {:db/id 100002
                   :block/title "test"
                   :block/uuid block-uuid
                   :block/page {:db/id 100001}
                   :block/created-at created-at
                   :block/updated-at created-at}]
          _ (d/transact! conn* blocks)
          ;; Simulate getting data from sqlite and restoring it for frontend
          {:keys [schema initial-data]} (sqlite-common-db/get-initial-data @conn*)
          conn (sqlite-common-db/restore-initial-data initial-data schema)]
      (is (= (take 1 blocks)
             (->> (d/q '[:find (pull ?b [*])
                         :where [?b :block/created-at]]
                       @conn)
                  (map first)))
          "Journal page is included in initial restore while its block is not"))))
