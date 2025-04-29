(ns logseq.db.common.initial-data-test
  "This ns is the only one to test against file based datascript connections.
   These are useful integration tests"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest async use-fixtures is testing]]
            [datascript.core :as d]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]))

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
          {:keys [schema initial-data]} (common-initial-data/get-initial-data @conn*)
          conn (d/conn-from-datoms initial-data schema)]
      (is (= blocks
             (->> @conn
                  (d/q '[:find (pull ?b [:block/uuid :file/path :file/content]) :where [?b :file/content]])
                  (map first)))
          "Correct file with content is found"))))

(deftest restore-initial-data
  (create-graph-dir "tmp/graphs" "test-db")
  (let [conn* (sqlite-cli/open-db! "tmp/graphs" "test-db")
        _ (d/transact! conn* (sqlite-create-graph/build-db-initial-data "{}"))
        {:keys [init-tx]}
        (sqlite-build/build-blocks-tx
         {:pages-and-blocks
          [{:page {:block/title "page1"}
            :blocks [{:block/title "b1"}]}]})
        _ (d/transact! conn* init-tx)
          ;; Simulate getting data from sqlite and restoring it for frontend
        {:keys [schema initial-data]} (common-initial-data/get-initial-data @conn*)
        conn (d/conn-from-datoms initial-data schema)]
    (is (some? (db-test/find-page-by-title @conn "page1"))
        "Restores recently updated page")))
