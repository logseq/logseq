(ns logseq.db.frontend.validate-mutation2-test
  "Second-run mutation survivors in logseq.db.frontend.validate."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]))

(defn- add-invalid-block!
  "Transacts a block missing everything but a title and timestamps. Returns its eid."
  [conn]
  (let [uuid' (random-uuid)]
    (d/transact! conn [{:block/uuid uuid'
                        :block/title "invalid block"
                        :block/created-at 1
                        :block/updated-at 2}])
    (:db/id (d/entity @conn [:block/uuid uuid']))))

(deftest validate-tx-report-skips-entities-with-only-bookkeeping-changes
  (let [conn (db-test/create-conn)
        eid (add-invalid-block! conn)
        db @conn
        report (fn [datoms] {:db-after db :tx-data datoms :tx-meta {}})]
    (is (false? (first (db-validate/validate-tx-report (report (d/datoms db :eavt eid)) {})))
        "The block is invalid when all its datoms changed")
    (is (true? (first (db-validate/validate-tx-report (report (d/datoms db :eavt eid :block/created-at)) {})))
        "A change of :block/created-at alone is not validated")
    (is (true? (first (db-validate/validate-tx-report (report (d/datoms db :eavt eid :block/updated-at)) {})))
        "A change of :block/updated-at alone is not validated")))

(deftest validate-db-reports-datom-count-entities-and-errors
  (let [conn (db-test/create-conn)
        valid (db-validate/validate-db @conn)]
    (is (= (count (d/datoms @conn :eavt)) (:datom-count valid)))
    (is (pos? (count (:entities valid))))
    (is (not (contains? valid :errors)) "A new graph is valid")
    (add-invalid-block! conn)
    (let [invalid (db-validate/validate-db @conn)]
      (is (= (count (d/datoms @conn :eavt)) (:datom-count invalid)))
      (is (pos? (count (:entities invalid))))
      (is (seq (:errors invalid)))
      (is (= "invalid block" (:block/title (:entity (first (:errors invalid))))))
      (is (seq (:errors (first (:errors invalid))))
          "Each error entry carries the humanized malli errors"))))

(deftest validate-db-ignores-temp-ui-attributes
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        block (db-test/find-block-by-content @conn "b1")]
    (d/transact! conn [[:db/add (:db/id block) :block.temp/load-status :self]
                       [:db/add (:db/id block) :block.temp/has-children? true]])
    (is (not (contains? (db-validate/validate-db @conn) :errors)))
    (is (nil? (db-validate/validate-local-db! @conn)))))

(deftest validate-local-db-returns-errors-of-invalid-entities
  (let [conn (db-test/create-conn)]
    (is (nil? (db-validate/validate-local-db! @conn)))
    (let [eid (add-invalid-block! conn)
          result (db-validate/validate-local-db! @conn)
          library-id (:db/id (ldb/get-built-in-page @conn "Library"))]
      (is (= "invalid block" (:block/title (:entity (first (:errors result))))))
      (is (= "invalid block" (:block/title (:entity (first (:errors (db-validate/validate-local-db! @conn :entity-ids [eid])))))))
      (is (some? library-id))
      (is (nil? (db-validate/validate-local-db! @conn :entity-ids [library-id]))
          "Only the given entities are validated"))))

(deftest graph-counts-counts-entities-pages-blocks-and-tagged-objects
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:C1 {}}
               :properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}}]})
        db @conn
        count-tagged (fn [tag]
                       (or (d/q '[:find (count ?e) . :in $ ?tag :where [?t :db/ident ?tag] [?e :block/tags ?t]] db tag) 0))
        classes (count-tagged :logseq.class/Tag)
        properties (count-tagged :logseq.class/Property)
        tagged (count (d/datoms db :avet :block/tags))
        entities [{:block/name "a"}
                  {:block/name "b"}
                  {:block/name "c"}
                  {:block/page 1}
                  {:user.property/p1 1 :user.property/p2 2 :block/tags [1]}]
        counts (db-validate/graph-counts db entities)]
    (is (= 5 (:entities counts)))
    (is (= 3 (:pages counts)))
    (is (= 1 (:blocks counts)))
    (is (= classes (:classes counts)))
    (is (= properties (:properties counts)))
    (is (= (- tagged classes properties) (:objects counts)))
    (is (pos? (:objects counts)))
    (is (= 2 (:property-pairs counts))
        "Property pairs don't count :block/tags")))
