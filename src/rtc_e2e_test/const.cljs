(ns const
  "Consts for rtc e2e tests")

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
(def page1-uuid (random-uuid))

(def block1-uuid (random-uuid))

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
     :block/page "page"}]})
