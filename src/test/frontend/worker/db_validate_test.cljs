(ns frontend.worker.db-validate-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.db.validate-fix :as validate-fix]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.recycle :as recycle]))

(defn- create-db-graph-conn
  []
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data ""))
    conn))

(deftest validate-db-result-returns-nil-errors-for-valid-db
  (let [conn (create-db-graph-conn)]
    (is (nil? (:errors (validate-fix/validate-db-result @conn))))))

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
      (worker-db-validate/validate-db conn)
      (let [repaired-block (d/entity @conn block-id)]
        (is (uuid? (:block/uuid repaired-block)))
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
                       [:db/add :logseq.property.class/extends :logseq.property.class/extends :logseq.class/Root]])
    (is (= 3 (count (:errors (db-validate/validate-db @conn)))))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (let [result (worker-db-validate/validate-db conn)
            journal (d/entity @conn journal-id)
            property (d/entity @conn :logseq.property.class/extends)
            class (d/entity @conn class-id)]
        (is (empty? (:errors result)))
        (is (= 1 (:block/updated-at journal)))
        (is (= [:logseq.class/Property] (mapv :db/ident (:block/tags property))))
        (is (nil? (:logseq.property.class/extends property)))
        (is (nil? (:kv/value class)))
        (is (empty? (:errors (worker-db-validate/validate-db conn))))))))

(deftest validate-db-deletes-invalid-recycled-blocks
  (let [conn (create-db-graph-conn)
        page-id (get (:tempids
                      (d/transact! conn [{:db/id "page"
                                          :block/uuid (random-uuid)
                                          :block/created-at 1
                                          :block/updated-at 1
                                          :block/name "test page"
                                          :block/title "Test Page"
                                          :block/tags :logseq.class/Page}]))
                     "page")
        block-id (get (:tempids
                       (d/transact! conn [{:db/id "block"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 2
                                           :block/page page-id
                                           :block/parent page-id
                                           :block/order "a0"
                                           :block/title "Deleted block"}]))
                      "block")
        block (d/entity @conn block-id)]
    (d/transact! conn (recycle/recycle-blocks-tx-data @conn [block] {}) {:outliner-op :delete-blocks})
    (d/transact! conn [[:db/add block-id :block/pre-block? true]])
    (is (seq (:errors (db-validate/validate-db @conn))))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (is (empty? (:errors (worker-db-validate/validate-db conn))))
      (is (nil? (d/entity @conn block-id))))))

(deftest validate-db-deletes-invalid-recycled-fragments
  (let [conn (create-db-graph-conn)
        tempids (:tempids
                 (d/transact! conn [{:db/id "recycle-fragment"
                                      :logseq.property.embedding/hnsw-label-updated-at 0
                                      :logseq.property.recycle/original-order "a2b"}
                                     {:db/id "orphan-fragment"
                                      :block/uuid (random-uuid)}]))
        recycle-fragment-id (get tempids "recycle-fragment")
        orphan-fragment-id (get tempids "orphan-fragment")]
    (let [errors (:errors (db-validate/validate-db @conn))]
      (is (seq errors))
      (is (= #{recycle-fragment-id}
             (set (validate-fix/invalid-fragment-ids @conn errors)))))
    (let [result (validate-fix/validate-and-fix-invalid-blocks! conn)]
      (is (empty? (:errors result)))
      (is (nil? (d/entity @conn recycle-fragment-id)))
      (is (nil? (d/entity @conn orphan-fragment-id)))
      (is (empty? (:errors (validate-fix/validate-and-fix-invalid-blocks! conn)))))))

(deftest validate-db-repairs-normal-page-alias-to-non-page
  (let [conn (create-db-graph-conn)
        page-id (get (:tempids
                      (d/transact! conn [{:db/id "page"
                                          :block/uuid (random-uuid)
                                          :block/created-at 1
                                          :block/updated-at 1
                                          :block/name "object oriented programming"
                                          :block/title "Object Oriented Programming"
                                          :block/tags :logseq.class/Page}]))
                     "page")
        block-id (get (:tempids
                       (d/transact! conn [{:db/id "block"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 2
                                           :block/page page-id
                                           :block/parent page-id
                                           :block/order "a0"
                                           :block/title "Not a Page"}]))
                      "block")]
    (d/transact! conn [[:db/add page-id :block/alias block-id]])
    (is (seq (:errors (db-validate/validate-db @conn))))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (let [result (worker-db-validate/validate-db conn)
            page (d/entity @conn page-id)]
        (is (empty? (:errors result)))
        (is (empty? (:block/alias page)))
        (is (empty? (:errors (worker-db-validate/validate-db conn))))))))

(deftest validate-db-repairs-invalid-raw-block-tag
  (let [conn (create-db-graph-conn)
        page-id (get (:tempids
                      (d/transact! conn [{:db/id "page"
                                          :block/uuid (random-uuid)
                                          :block/created-at 1
                                          :block/updated-at 1
                                          :block/name "test page"
                                          :block/title "Test Page"
                                          :block/tags :logseq.class/Page}]))
                     "page")
        block-id (get (:tempids
                       (d/transact! conn [{:db/id "block"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 2
                                           :block/page page-id
                                           :block/parent page-id
                                           :block/order "a0"
                                           :block/title "Tagged block"}]))
                      "block")
        corrupt-db (d/init-db (conj (vec (d/datoms @conn :eavt))
                                    (d/datom block-id :block/tags :missing.ident/tag 1 true))
                              (:schema @conn))
        corrupt-conn (d/conn-from-db corrupt-db)]
    (is (seq (:errors (db-validate/validate-db @corrupt-conn))))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (validate-fix/fix-invalid-blocks! corrupt-conn (:errors (db-validate/validate-db @corrupt-conn)))
      (is (empty? (remove #(= :logseq.class/Page (:db/ident %))
                          (:block/tags (d/entity @corrupt-conn block-id))))))))

(deftest validate-db-does-not-add-class-property-with-missing-ident
  (let [conn (create-db-graph-conn)
        block-id (get (:tempids
                       (d/transact! conn [{:db/id "class"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 1
                                           :block/name "topic"
                                           :block/title "Topic"
                                           :block/tags :logseq.class/Tag
                                           :db/ident :user.class/topic}
                                          {:db/id "property"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 1
                                           :block/name "topic"
                                           :block/title "Topic"
                                           :block/tags :logseq.class/Property}
                                          {:db/id "block"
                                           :block/uuid (random-uuid)
                                           :block/created-at 1
                                           :block/updated-at 2
                                           :block/title "Block"
                                           :user.class/topic "value"}]))
                      "block")]
    (validate-fix/fix-invalid-blocks! conn [])
    (let [block (d/entity @conn block-id)]
      (is (nil? (:user.class/topic block)))
      (is (nil? (get block nil))))))
