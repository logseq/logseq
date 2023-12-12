(ns logseq.db.sqlite.db-test
  (:require [cljs.test :refer [deftest async use-fixtures is testing]]
            ["fs" :as fs]
            ["path" :as node-path]
            [datascript.core :as d]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.restore :as sqlite-restore]))

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
    (sqlite-db/open-db! "tmp/graphs" "test-db")
    (let [blocks [{:block/uuid (random-uuid)
                   :file/path "logseq/config.edn"
                   :file/content "{:foo :bar}"}]
          _ (sqlite-db/transact! "test-db" blocks {})]
      (is (= blocks
             (->> (sqlite-db/get-initial-data "test-db")
                  sqlite-restore/restore-initial-data
                  deref
                  (d/q '[:find (pull ?b [:block/uuid :file/path :file/content]) :where [?b :file/content]])
                  (map first)))
          "Correct file with content is found"))))