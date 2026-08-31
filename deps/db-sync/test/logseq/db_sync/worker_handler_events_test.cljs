(ns logseq.db-sync.worker-handler-events-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.sync :as sync-handler]))

(defn- make-server []
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)]
    {:sql sql
     :conn conn
     :self #js {:sql sql :conn conn :schema-ready true}}))

(defn- entity-change [changes entity-id]
  (some #(when (= entity-id (:id %)) %) (:upserts changes)))

(deftest latest-entity-changes-deduplicates-and-preserves-current-types-test
  (let [{:keys [sql conn self]} (make-server)
        page-id (random-uuid)
        block-id (random-uuid)
        untouched-id (random-uuid)]
    (d/transact! conn [{:db/ident :logseq.class/Page}
                       {:db/ident :logseq.class/Task}
                       {:block/uuid page-id
                        :block/title "Page"
                        :block/tags :logseq.class/Page}
                       {:block/uuid block-id
                        :block/title "Draft"
                        :block/page [:block/uuid page-id]
                        :block/tags :logseq.class/Task
                        :block/created-at 100}
                       {:block/uuid untouched-id :block/title "Untouched"}])
    (let [since (storage/get-t sql)]
      (d/transact! conn [[:db/add [:block/uuid block-id] :block/title "Middle"]])
      (d/transact! conn [[:db/add [:block/uuid block-id] :block/title "Final"]
                         [:db/add [:block/uuid block-id] :block/updated-at 200]])
      (let [changes (sync-handler/latest-entity-changes self "graph-1" since)
            upsert (entity-change changes [:block/uuid block-id])
            attrs (:attrs upsert)]
        (is (= 1 (:format-version changes)))
        (is (= "graph-1" (:graph-id changes)))
        (is (= since (:t-before changes)))
        (is (= (storage/get-t sql) (:t changes)))
        (is (= 1 (count (:upserts changes))))
        (is (empty? (:deleted changes)))
        (is (= block-id (:block/uuid attrs)))
        (is (= "Final" (:block/title attrs)))
        (is (= 100 (:block/created-at attrs)))
        (is (= 200 (:block/updated-at attrs)))
        (is (= [:block/uuid page-id] (:block/page attrs)))
        (is (= #{[:db/ident :logseq.class/Task]} (:block/tags attrs)))
        (is (nil? (entity-change changes [:block/uuid untouched-id])))))))

(deftest latest-entity-changes-communicates-property-retraction-with-complete-entity-test
  (let [{:keys [sql conn self]} (make-server)
        block-id (random-uuid)]
    (d/transact! conn [{:block/uuid block-id
                        :block/title "Block"
                        :block/collapsed? true}])
    (let [since (storage/get-t sql)]
      (d/transact! conn [[:db/retract [:block/uuid block-id] :block/collapsed? true]])
      (let [attrs (:attrs (entity-change
                           (sync-handler/latest-entity-changes self "graph-1" since)
                           [:block/uuid block-id]))]
        (is (= "Block" (:block/title attrs)))
        (is (not (contains? attrs :block/collapsed?)))))))

(deftest latest-entity-changes-reports-delete-and-create-then-delete-once-test
  (doseq [created-before-baseline? [true false]]
    (let [{:keys [sql conn self]} (make-server)
          block-id (random-uuid)]
      (when created-before-baseline?
        (d/transact! conn [{:block/uuid block-id :block/title "Existing"}]))
      (let [since (storage/get-t sql)]
        (when-not created-before-baseline?
          (d/transact! conn [{:block/uuid block-id :block/title "Ephemeral"}]))
        (d/transact! conn [[:db/retractEntity [:block/uuid block-id]]])
        (let [changes (sync-handler/latest-entity-changes self "graph-1" since)]
          (is (empty? (:upserts changes)))
          (is (= [[:block/uuid block-id]] (:deleted changes))))))))

(deftest latest-entity-changes-supports-ident-and-file-identities-test
  (let [{:keys [sql conn self]} (make-server)]
    (d/transact! conn [{:db/ident :user.property/priority :kv/value "low"}
                       {:file/path "logseq/config.edn" :file/content "old"}])
    (let [since (storage/get-t sql)]
      (d/transact! conn [[:db/add [:db/ident :user.property/priority] :kv/value "high"]
                         [:db/add [:file/path "logseq/config.edn"] :file/content "new"]])
      (let [changes (sync-handler/latest-entity-changes self "graph-1" since)]
        (is (= "high" (get-in (entity-change changes [:db/ident :user.property/priority])
                              [:attrs :kv/value])))
        (is (= "new" (get-in (entity-change changes [:file/path "logseq/config.edn"])
                             [:attrs :file/content])))))))

(deftest latest-entity-changes-detects-non-contiguous-tx-log-test
  (let [{:keys [sql conn self]} (make-server)
        block-id (random-uuid)]
    (d/transact! conn [{:block/uuid block-id :block/title "One"}])
    (let [since (storage/get-t sql)]
      (d/transact! conn [[:db/add [:block/uuid block-id] :block/title "Two"]])
      (d/transact! conn [[:db/add [:block/uuid block-id] :block/title "Three"]])
      (common/sql-exec sql "delete from tx_log where t = ?" (inc since))
      (is (= {:reason "cursor-expired" :snapshot-required true}
             (sync-handler/latest-entity-changes self "graph-1" since))))))
