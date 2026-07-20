(ns frontend.worker.db-validate-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn- create-db-graph-conn
  []
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data ""))
    conn))

(defn- with-transact-pipeline
  [f]
  (let [pipeline-before @ldb/*transact-pipeline-fn]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (f)
      (finally
        (reset! ldb/*transact-pipeline-fn pipeline-before)))))

(deftest validate-db-returns-count-fields-without-counts-wrapper
  (let [conn (create-db-graph-conn)]
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (let [result (worker-db-validate/validate-db conn :fix false)
            validation-result (db-validate/validate-db @conn)
            expected-counts (assoc (db-validate/graph-counts @conn (:entities validation-result))
                                   :datoms (:datom-count validation-result))]
        (is (= expected-counts (select-keys result (keys expected-counts))))
        (is (not (contains? result :counts)))
        (is (not (contains? result :datom-count)))
        (is (every? number? (map result (keys expected-counts))))))))

(deftest validate-db-repairs-block-missing-uuid
  (let [conn (create-db-graph-conn)
        page-uuid (random-uuid)
        page-tx (:tempids
                 (d/transact! conn [{:db/id "page"
                                      :block/uuid page-uuid
                                      :block/created-at 1
                                      :block/updated-at 1
                                      :block/name "test page"
                                      :block/title "Test Page"
                                      :block/tags :logseq.class/Page}]))
        page-id (get page-tx "page")
        block-id (get (:tempids
                       (d/transact! conn [{:db/id "block"
                                           :block/created-at 1
                                           :block/updated-at 2
                                           :block/page page-id
                                           :block/parent page-id
                                           :block/order "a0"
                                           :block/title ""}]))
                      "block")]
    (is (seq (:errors (db-validate/validate-db @conn))))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (with-transact-pipeline #(worker-db-validate/validate-db conn))
      (let [repaired-block (d/entity @conn block-id)]
        (is (uuid? (:block/uuid repaired-block)))
        (is (nat-int? (:block/tx-id repaired-block))
            "A live repair must make the repaired block canonically readable.")
        (is (= page-id (:db/id (:block/page repaired-block))))
        (is (= page-id (:db/id (:block/parent repaired-block))))
        (is (empty? (:errors (worker-db-validate/validate-db conn))))))))

(deftest validate-db-repairs-invalid-pages-properties-and-classes
  (let [conn (create-db-graph-conn)
        journal-id (get (:tempids
                         (d/transact! conn [{:db/id "journal"
                                             :block/uuid (random-uuid)
                                             :block/created-at 1
                                             :block/journal-day 20260504
                                             :block/name "2026-05-04"
                                             :block/title "2026-05-04"
                                             :block/tags :logseq.class/Journal}]))
                        "journal")
        class-id (get (:tempids
                       (d/transact! conn [{:db/id "class"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 2
                                           :block/name "imported"
                                           :block/title "imported"
                                           :block/tags :logseq.class/Tag
                                           :db/ident :user.class/imported
                                           :logseq.property.class/extends :logseq.class/Root
                                           :kv/value 1}]))
                      "class")]
    (d/transact! conn [[:db/add :logseq.property.class/extends :block/tags :logseq.class/Tag]
                       [:db/add :logseq.property.class/extends :logseq.property.class/extends :logseq.class/Root]
                       [:db/add :logseq.property.class/extends :block/tx-id 1]
                       [:db/add journal-id :block/tx-id 1]
                       [:db/add class-id :block/tx-id 1]])
    (is (= 3 (count (:errors (db-validate/validate-db @conn)))))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (let [result (with-transact-pipeline #(worker-db-validate/validate-db conn))
            journal (d/entity @conn journal-id)
            property (d/entity @conn :logseq.property.class/extends)
            class (d/entity @conn class-id)]
        (is (empty? (:errors result)))
        (doseq [entity [journal property class]]
          (is (not= 1 (:block/tx-id entity))
              "Every canonical entity changed by a live repair receives a new revision."))
        (is (= 1 (:block/updated-at journal)))
        (is (= [:logseq.class/Property] (mapv :db/ident (:block/tags property))))
        (is (nil? (:logseq.property.class/extends property)))
        (is (nil? (:kv/value class)))
        (is (empty? (:errors (worker-db-validate/validate-db conn))))))))
