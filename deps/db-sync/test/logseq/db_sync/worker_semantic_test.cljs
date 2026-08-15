(ns logseq.db-sync.worker-semantic-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.worker.handler.semantic :as semantic-handler]
            [logseq.db.sqlite.export :as sqlite-export]))

(deftest block-response-includes-user-tags-reference-targets-and-task-status-test
  (let [conn (sqlite-export/create-conn)
        block-id (random-uuid)
        tag-id (random-uuid)
        reference-id (random-uuid)
        status-id (random-uuid)]
    (d/transact! conn [{:db/ident :user.class/project
                        :block/uuid tag-id
                        :block/title "Project"
                        :block/tags :logseq.class/Tag}
                       {:block/uuid reference-id
                        :block/title "Referenced block"}
                       {:db/ident :user.property/status.waiting
                        :block/uuid status-id
                        :block/title "Waiting"
                        :logseq.property/value "Waiting"
                        :logseq.property/icon {:type :tabler-icon :id "clock" :color "#7c3aed"}
                        :block/closed-value-property :logseq.property/status}
                       {:block/uuid block-id
                        :block/title "Work"
                        :block/tags [[:block/uuid tag-id] :logseq.class/Task]
                        :block/refs [[:block/uuid reference-id]]
                        :logseq.property/status [:block/uuid status-id]}])
    (let [response (#'semantic-handler/block-response
                    (d/entity @conn [:block/uuid block-id]))]
      (is (= [{:uuid (str tag-id) :kind "tag" :title "Project"}]
             (:tags response)))
      (is (= [{:uuid (str reference-id) :kind "block" :title "Referenced block"}]
             (:references response)))
      (is (= {:type "tabler-icon" :id "clock" :color "#7c3aed"}
             (get-in response [:status :icon])))
      (is (= "Waiting" (get-in response [:status :title]))))))

(deftest block-response-restores-reference-titles-test
  (let [conn (sqlite-export/create-conn)
        block-id (random-uuid)
        page-id (random-uuid)]
    (d/transact! conn [{:block/uuid page-id
                        :block/title "Project Alpha"
                        :block/tags :logseq.class/Page}
                       {:block/uuid block-id
                        :block/title (str "Review [[" page-id "]] today")
                        :block/refs [[:block/uuid page-id]]}])
    (is (= "Review [[Project Alpha]] today"
           (:title (#'semantic-handler/block-response
                    (d/entity @conn [:block/uuid block-id])))))))

(deftest tree-block-preserves-client-uuid-test
  (let [conn (sqlite-export/create-conn)
        block-id (random-uuid)
        block (#'semantic-handler/tree-block
               conn {:uuid (str block-id) :title "Offline capture"})]
    (is (= block-id (:block/uuid block)))))

(deftest ensure-today-page-defaults-missing-journal-title-format-test
  (let [conn (sqlite-export/create-conn)
        formatter (:logseq.property.journal/title-format
                   (d/entity @conn :logseq.class/Journal))]
    (d/transact! conn [[:db/retract :logseq.class/Journal
                        :logseq.property.journal/title-format formatter]])
    (let [page (#'semantic-handler/ensure-today-page! conn)]
      (is (string? (:block/title page)))
      (is (seq (:block/title page))))))

(deftest asset-response-stays-an-independent-journal-block-test
  (let [conn (sqlite-export/create-conn)
        journal-id (random-uuid)
        asset-id (random-uuid)]
    (d/transact! conn [{:block/uuid journal-id
                        :block/title "Aug 14th, 2026"
                        :block/journal-day 20260814
                        :block/tags :logseq.class/Journal}
                       {:block/uuid asset-id
                        :block/title "photo.jpg"
                        :block/page [:block/uuid journal-id]
                        :block/parent [:block/uuid journal-id]
                        :block/tags :logseq.class/Asset
                        :logseq.property.asset/type "jpg"
                        :logseq.property.asset/size 2048
                        :logseq.property.asset/checksum (apply str (repeat 64 "a"))}])
    (let [response (#'semantic-handler/block-response
                    (d/entity @conn [:block/uuid asset-id]))]
      (is (= "asset" (:kind response)))
      (is (= (str journal-id) (:parent-id response)))
      (is (= "jpg" (:asset-type response)))
      (is (= 2048 (:asset-size response)))
      (is (= 64 (count (:asset-checksum response)))))))

(deftest search-asset-response-includes-block-and-journal-context-test
  (let [conn (sqlite-export/create-conn)
        journal-id (random-uuid)
        asset-id (random-uuid)]
    (d/transact! conn [{:block/uuid journal-id :block/title "Aug 14th, 2026"
                        :block/journal-day 20260814 :block/tags :logseq.class/Journal}
                       {:block/uuid asset-id :block/title "voice.m4a"
                        :block/page [:block/uuid journal-id]
                        :block/tags :logseq.class/Asset
                        :logseq.property.asset/type "m4a"}])
    (let [response (#'semantic-handler/search-result-response
                    (d/entity @conn [:block/uuid asset-id]))]
      (is (= "asset" (:kind response)))
      (is (= "assets" (:resource response)))
      (is (= (str journal-id) (:page-id response)))
      (is (= 20260814 (:journal-day response))))))

(deftest matching-asset-retry-only-matches-the-same-client-uuid-test
  (let [conn (sqlite-export/create-conn)
        asset-id (random-uuid)
        checksum (apply str (repeat 64 "b"))]
    (d/transact! conn [{:block/uuid asset-id
                        :block/title "photo.jpg"
                        :block/tags :logseq.class/Asset
                        :logseq.property.asset/type "jpg"
                        :logseq.property.asset/checksum checksum}])
    (is (= asset-id
           (:block/uuid (#'semantic-handler/matching-asset @conn asset-id checksum))))
    (is (nil? (#'semantic-handler/matching-asset @conn (random-uuid) checksum)))))
