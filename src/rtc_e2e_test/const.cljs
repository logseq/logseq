(ns const
  "Consts for rtc e2e tests"
  (:require [logseq.db.frontend.order :as db-order]))

(assert (exists? js/__karma__))
(def seed js/__karma__.config.seed)
(def testvar js/__karma__.config.testvar)
(prn :karma-config :seed seed :testvar testvar)

(def is-client1? (= "client1" testvar))

(def test-token "TEST-TOKEN")
(def test-graph-name (str "TEST-REPO-" seed))
(def test-repo (str "logseq_db_TEST-REPO-" seed))

(def downloaded-test-graph-name "TEST-REPO-downloaded")
(def downloaded-test-repo "logseq_db_TEST-REPO-downloaded")

;;; tests data
(def page1-uuid #uuid "c051d36f-98b3-4afb-b52a-d5a06bd8591d")
(def page2-uuid #uuid "91d3e320-d2a6-47ae-96a7-8a366ab96cbb")

(def block1-uuid #uuid "aa6d5e60-5d3a-4468-812f-bd60dc9639fb")

(def tx-data-map
  {:create-page
   [{:db/id "page"
     :block/name "basic-edits-test"
     :block/title "basic-edits-test"
     :block/uuid page1-uuid
     :block/created-at 1724836490809
     :block/updated-at 1724836490809
     :block/type "page"
     :block/format :markdown}
    {:block/uuid block1-uuid
     :block/updated-at 1724836490810
     :block/created-at 1724836490810
     :block/format :markdown
     :block/title "block1"
     :block/parent "page"
     :block/order "a0"
     :block/page "page"}]
   :insert-500-blocks
   (cons {:db/id "page"
          :block/uuid page2-uuid
          :block/name "insert-500-blocks"
          :block/title "insert-500-blocks"
          :block/created-at 1725024677501
          :block/updated-at 1725024677501
          :block/type "page"
          :block/format :markdown}
         (map (fn [i order]
                {:block/uuid (random-uuid)
                 :block/created-at 1725024677501
                 :block/updated-at 1725024677501
                 :block/format :markdown
                 :block/title (str "x" i)
                 :block/parent "page"
                 :block/order order
                 :block/page "page"})
              (range 500) (db-order/gen-n-keys 500 "a0" "a1")))})
