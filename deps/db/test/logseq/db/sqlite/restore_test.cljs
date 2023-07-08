(ns logseq.db.sqlite.restore-test
  (:require [cljs.test :refer [deftest async use-fixtures is testing]]
            ["fs" :as fs]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [cognitect.transit :as t]
            [datascript.core :as d]
            [logseq.db.schema :as db-schema]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.restore :as sqlite-restore]
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

(defn- block-map->datoms-str
  [blocks m]
  (let [t-writer (t/writer :json)]
    (->> (dissoc m :db/id)
         ;; This fn should match pipeline/datom->av-vector
         (map (fn m->av-vector [[a v]]
                [a v]
                (if (contains? db-schema/ref-type-attributes a)
                  [a
                   [:block/uuid (str (some #(when (= (:db/id %) (:db/id v)) (:block/uuid %)) blocks))]]
                  [a v])))
         (t/write t-writer))))

(deftest restore-initial-data
  (testing "Restore a journal page with its block"
    (create-graph-dir "tmp/graphs" "test-db")
    (sqlite-db/open-db! "tmp/graphs" "test-db")
    (let [page-uuid (random-uuid)
          block-uuid (random-uuid)
          created-at (js/Date.now)
          ds-blocks [{:db/id 100001
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
                      :block/updated-at created-at
                      :page_uuid page-uuid}]
          blocks (mapv #(sqlite-util/ds->sqlite-block
                         (assoc % :datoms (block-map->datoms-str ds-blocks %)))
                       ds-blocks)
          _ (sqlite-db/upsert-blocks! "test-db" (bean/->js blocks))
          {:keys [conn]} (sqlite-restore/restore-initial-data (bean/->js (sqlite-db/get-initial-data "test-db")))]
      (is (= ds-blocks
             (->> (d/q '[:find (pull ?b [*])
                         :where [?b :block/created-at]]
                       @conn)
                  (map first)))
          "Datascript db matches data inserted into sqlite from simulated frontend"))))

(deftest restore-other-data
  (testing "Restore a page with its block"
    (create-graph-dir "tmp/graphs" "test-db")
    (sqlite-db/open-db! "tmp/graphs" "test-db")
    (let [page-uuid (random-uuid)
          block-uuid (random-uuid)
          created-at (js/Date.now)
          ds-blocks [{:db/id 100001
                      :block/uuid page-uuid
                      :block/name "some page"
                      :block/created-at created-at}
                     {:db/id 100002
                      :block/content "test"
                      :block/uuid block-uuid
                      :block/page {:db/id 100001}
                      :page_uuid page-uuid
                      :block/created-at created-at}]
          blocks (mapv #(sqlite-util/ds->sqlite-block
                         (assoc % :datoms (block-map->datoms-str ds-blocks %)))
                       ds-blocks)
          _ (sqlite-db/upsert-blocks! "test-db" (bean/->js blocks))
          {:keys [uuid->db-id-map conn]}
          (sqlite-restore/restore-initial-data (bean/->js (sqlite-db/get-initial-data "test-db")))
          new-db (sqlite-restore/restore-other-data
                  conn
                  (sqlite-db/get-other-data "test-db" [])
                  uuid->db-id-map)]
      (is (= ds-blocks
             (->> (d/q '[:find (pull ?b [*])
                         :where [?b :block/created-at]]
                       new-db)
                  (map first)))
          "Datascript db matches data inserted into sqlite from simulated frontend"))))