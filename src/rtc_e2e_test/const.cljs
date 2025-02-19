(ns const
  "Consts for rtc e2e tests"
  (:require [logseq.db.common.order :as db-order]))

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
(def message-page-uuid #uuid "a3da426a-4202-4a79-8e97-13f4862b0270")

(def page1-uuid #uuid "c051d36f-98b3-4afb-b52a-d5a06bd8591d")
(def page2-uuid #uuid "91d3e320-d2a6-47ae-96a7-8a366ab96cbb")
(def page3-uuid #uuid "9a846640-2b63-4298-9ad6-8ca6c1285016")

(def block1-uuid #uuid "aa6d5e60-5d3a-4468-812f-bd60dc9639fb")

;;; ----- move-blocks-concurrently case -----
(def block2-uuid #uuid "a78e19fc-7e9a-4f61-8988-0e9a649bc875")
(def block3-uuid #uuid "226166d8-1380-4d7a-9fe1-f98e2d583259")
(def block4-uuid #uuid "fb8f05d2-9d91-492e-81e2-8a0b65f09d8c")
(def block5-uuid #uuid "f3c48e62-1726-4492-b42a-a36f4de7b32f")
(def block6-uuid #uuid "23f51a53-db85-465a-9f18-6ca94e59f56c")
(def block7-uuid #uuid "83f99937-fe0a-4d33-81ce-7fe5837baad3")
;;; ----- delete-blocks case ---------
(def step6-page-uuid #uuid "e22dafa5-b3b4-405d-b93d-470caa420e10")
(def step6-block1-uuid #uuid "776acd4a-d011-4985-bfc2-14ee7bbd6a28")
(def step6-block2-uuid #uuid "ba3998c2-8059-4f9e-9e76-2760d2f14512")
(def step6-block3-uuid #uuid "f9ce5393-370a-43dd-a721-aaa5ef83d3ff")
(def step6-block4-uuid #uuid "db00bb0d-2bef-49e7-96ed-b4882cdf5686")
(def step6-block5-uuid #uuid "d34e8a9c-5e87-4511-b982-2bf2ebc82607")

(def ^:large-vars/data-var tx-data-map
  {:create-page
   [{:db/id "page"
     :block/name "basic-edits-test"
     :block/title "basic-edits-test"
     :block/uuid page1-uuid
     :block/created-at 1724836490809
     :block/updated-at 1724836490809
     :block/type "page"}
    {:block/uuid block1-uuid
     :block/updated-at 1724836490810
     :block/created-at 1724836490810
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
          :block/type "page"}
         (map (fn [i order]
                {:block/uuid (random-uuid)
                 :block/created-at 1725024677501
                 :block/updated-at 1725024677501
                 :block/title (str "x" i)
                 :block/parent "page"
                 :block/order order
                 :block/page "page"})
              (range 500) (db-order/gen-n-keys 500 "a0" "a1")))
   :step3-add-task-properties-to-block1
   [{:db/id "id-0907"
     :block/uuid #uuid "00000001-2024-0907-0000-000000000000"
     :block/updated-at 1725455235108
     :block/created-at 1725455235108
     :block/journal-day 20240907
     :block/title "Sep 7th, 2024"
     :block/name "sep 7th, 2024"
     :block/type "journal"}
    {:block/uuid block1-uuid
     :block/updated-at 1725454876718
     :block/tags :logseq.class/Task
     :logseq.task/status :logseq.task/status.done
     :logseq.task/deadline "id-0907"}]
   :step3-toggle-status-TODO
   [{:block/uuid block1-uuid
     :logseq.task/status :logseq.task/status.todo}]
   :step3-toggle-status-DOING
   [{:block/uuid block1-uuid
     :logseq.task/status :logseq.task/status.doing}]
   :move-blocks-concurrently-1
   [{:db/id "page"
     :block/uuid page3-uuid
     :block/name "move-blocks-concurrently"
     :block/title "move-blocks-concurrently"
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/type "page"}
    {:block/uuid block2-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x1"
     :block/parent "page"
     :block/order "a0"
     :block/page "page"}
    {:block/uuid block3-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x2"
     :block/parent "page"
     :block/order "a1"
     :block/page "page"}
    {:block/uuid block4-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x3"
     :block/parent "page"
     :block/order "a2"
     :block/page "page"}
    {:block/uuid block5-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x4"
     :block/parent "page"
     :block/order "a3"
     :block/page "page"}
    {:block/uuid block6-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x5"
     :block/parent "page"
     :block/order "a4"
     :block/page "page"}
    {:block/uuid block7-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x6"
     :block/parent "page"
     :block/order "a5"
     :block/page "page"}]
   :move-blocks-concurrently-client1
   [{:block/uuid block6-uuid
     :block/parent [:block/uuid block3-uuid]
     :block/order "a0"}
    {:block/uuid block5-uuid
     :block/parent [:block/uuid block6-uuid]
     :block/order "a0"}
    {:block/uuid block4-uuid
     :block/parent [:block/uuid block2-uuid]
     :block/order "a0"}
    {:block/uuid block7-uuid
     :block/parent [:block/uuid page3-uuid]
     :block/order (db-order/gen-key "a0" "a1")}]
   :move-blocks-concurrently-client2
   [{:block/uuid block2-uuid
     :block/order "a2V"}
    {:block/uuid block5-uuid
     :block/parent [:block/uuid block3-uuid]
     :block/order "a0"}
    {:block/uuid block6-uuid
     :block/parent [:block/uuid block5-uuid]
     :block/order "a0"}
    {:block/uuid block4-uuid
     :block/parent [:block/uuid block7-uuid]
     :block/order "a0"}]
   :step6-delete-blocks-client1-1
   ;; - 1
   ;;   - 2
   ;; - 3
   ;;   - 4
   ;;     - 5
   [{:db/id "page"
     :block/uuid step6-page-uuid
     :block/name "step6-delete-blocks"
     :block/title "step6-delete-blocks"
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/type "page"}
    {:db/id "b1"
     :block/uuid step6-block1-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x1"
     :block/parent "page"
     :block/order "a0"
     :block/page "page"}
    {:db/id "b2"
     :block/uuid step6-block2-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x2"
     :block/parent "b1"
     :block/order "a0"
     :block/page "page"}
    {:db/id "b3"
     :block/uuid step6-block3-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x3"
     :block/parent "page"
     :block/order "a1"
     :block/page "page"}
    {:db/id "b4"
     :block/uuid step6-block4-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x4"
     :block/parent "b3"
     :block/order "a0"
     :block/page "page"}
    {:db/id "b5"
     :block/uuid step6-block5-uuid
     :block/created-at 1725024677501
     :block/updated-at 1725024677501
     :block/title "x5"
     :block/parent "b4"
     :block/order "a0"
     :block/page "page"}]
   :step6-delete-blocks-client1-2
   ;; only block3 left
   [[:db/retractEntity [:block/uuid step6-block1-uuid]]
    [:db/retractEntity [:block/uuid step6-block2-uuid]]
    [:db/retractEntity [:block/uuid step6-block4-uuid]]
    [:db/retractEntity [:block/uuid step6-block5-uuid]]]})
