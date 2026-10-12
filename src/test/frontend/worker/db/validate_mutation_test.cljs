(ns frontend.worker.db.validate-mutation-test
  "Tests from the mutation triage of frontend.worker.db.validate"
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(def ^:private initial-db
  ;; built once: building the initial data is the slow part of each test
  (delay
    (let [conn (d/create-conn db-schema/schema)]
      (d/transact! conn (sqlite-create-graph/build-db-initial-data ""))
      @conn)))

(defn- create-db-graph-conn
  []
  (d/conn-from-db @initial-db))

(defn- add!
  "Transacts one entity map without the pipeline and returns its id"
  [conn m]
  (get (:tempids (d/transact! conn [(assoc m :db/id "e")])) "e"))

(defn- add-page!
  [conn title]
  (add! conn {:block/uuid (random-uuid)
              :block/name title
              :block/title title
              :block/tags :logseq.class/Page
              :block/created-at 1
              :block/updated-at 1}))

(defn- fix-invalid-blocks!
  [conn dispatch-key ids]
  (#'worker-db-validate/fix-invalid-blocks!
   conn
   (map (fn [id] {:entity {:db/id id} :dispatch-key dispatch-key}) ids)))

(defn- gone?
  [conn id]
  (empty? (d/datoms @conn :eavt id)))

(defn- tag-idents
  [entity]
  (set (map :db/ident (:block/tags entity))))

(defn- with-transact-pipeline
  [f]
  (let [pipeline-before @ldb/*transact-pipeline-fn]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (f)
      (finally
        (reset! ldb/*transact-pipeline-fn pipeline-before)))))

(defn- validate-db-quietly
  [conn & args]
  (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
    (apply worker-db-validate/validate-db conn args)))

(deftest fix-invalid-blocks-retracts-titled-orphan-that-has-uuid
  (let [conn (create-db-graph-conn)
        id (add! conn {:block/uuid (random-uuid) :block/title "orphan"})]
    (fix-invalid-blocks! conn :block [id])
    (is (gone? conn id))))

(deftest fix-invalid-blocks-adds-missing-updated-at-to-normal-page-and-keeps-its-name
  (let [conn (create-db-graph-conn)
        id (add! conn {:block/uuid (random-uuid)
                       :block/name "dated"
                       :block/title "dated"
                       :block/tags :logseq.class/Page
                       :block/created-at 5})]
    (fix-invalid-blocks! conn :normal-page [id])
    (let [page (d/entity @conn id)]
      (is (= 5 (:block/updated-at page)))
      (is (= "dated" (:block/name page))))))

(deftest fix-invalid-blocks-retracts-name-of-non-page-block
  (let [conn (create-db-graph-conn)
        page-id (add-page! conn "p")
        id (add! conn {:block/uuid (random-uuid)
                       :block/title "b"
                       :block/name "stray"
                       :block/page page-id
                       :block/parent page-id
                       :block/order "a0"
                       :block/created-at 1
                       :block/updated-at 1})]
    (fix-invalid-blocks! conn :block [id])
    (is (nil? (:block/name (d/entity @conn id))))
    (is (= "b" (:block/title (d/entity @conn id))))))

(deftest fix-invalid-blocks-retracts-untagged-external-url-block
  (let [conn (create-db-graph-conn)
        page-id (add-page! conn "p")
        id (add! conn {:block/uuid (random-uuid)
                       :block/title "External URL"
                       :block/page page-id
                       :block/parent page-id
                       :block/order "a0"
                       :block/created-at 1
                       :block/updated-at 1})]
    (fix-invalid-blocks! conn :block [id])
    (is (gone? conn id))))

(deftest fix-invalid-blocks-keeps-block-whose-created-by-ref-is-an-entity
  (let [conn (create-db-graph-conn)
        page-id (add-page! conn "p")
        id (add! conn {:block/uuid (random-uuid)
                       :block/title "c"
                       :block/page page-id
                       :block/parent page-id
                       :block/order "a0"
                       :block/created-at 1
                       :block/updated-at 1
                       :logseq.property/created-by-ref page-id})]
    (fix-invalid-blocks! conn :block [id])
    (is (not (gone? conn id)))
    (is (= page-id (:db/id (:logseq.property/created-by-ref (d/entity @conn id)))))))

(deftest fix-invalid-blocks-removes-page-tag-from-property-only
  (let [conn (create-db-graph-conn)
        id (add! conn {:block/uuid (random-uuid)
                       :db/ident :user.property/color
                       :db/cardinality :db.cardinality/one
                       :block/name "color"
                       :block/title "color"
                       :block/tags [:logseq.class/Property :logseq.class/Page]
                       :block/created-at 1
                       :block/updated-at 1})]
    (fix-invalid-blocks! conn :property [id])
    (is (= #{:logseq.class/Property} (tag-idents (d/entity @conn id))))))

(deftest fix-invalid-blocks-removes-page-tag-from-class-and-keeps-its-ident-and-extends
  (let [conn (create-db-graph-conn)
        id (add! conn {:block/uuid (random-uuid)
                       :db/ident :user.class/Robot
                       :block/name "robot"
                       :block/title "Robot"
                       :block/tags [:logseq.class/Tag :logseq.class/Page]
                       :logseq.property.class/extends :logseq.class/Root
                       :block/created-at 1
                       :block/updated-at 1})]
    (fix-invalid-blocks! conn :class [id])
    (let [class (d/entity @conn id)]
      (is (= #{:logseq.class/Tag} (tag-idents class)))
      (is (= :user.class/Robot (:db/ident class)))
      (is (= [:logseq.class/Root] (map :db/ident (:logseq.property.class/extends class)))))))

(deftest fix-invalid-blocks-puts-description-block-under-its-property
  (let [conn (create-db-graph-conn)
        property-id (add! conn {:block/uuid (random-uuid)
                                :db/ident :user.property/description
                                :db/cardinality :db.cardinality/one
                                :block/name "description"
                                :block/title "description"
                                :block/tags :logseq.class/Property
                                :block/created-at 1
                                :block/updated-at 1})
        id (add! conn {:block/uuid (random-uuid)
                       :block/title "note"
                       :logseq.property/created-from-property property-id
                       :block/created-at 1
                       :block/updated-at 1})]
    (fix-invalid-blocks! conn :block [id])
    (let [block (d/entity @conn id)]
      (is (= property-id (:db/id (:block/page block))))
      (is (= property-id (:db/id (:block/parent block)))))))

(deftest fix-invalid-blocks-replaces-class-used-as-property-by-same-titled-property
  (let [conn (create-db-graph-conn)
        class-id (add! conn {:block/uuid (random-uuid)
                             :db/ident :user.class/Person
                             :block/name "person"
                             :block/title "Person"
                             :block/tags :logseq.class/Tag
                             :logseq.property.class/extends :logseq.class/Root
                             :block/created-at 1
                             :block/updated-at 1})
        property-id (add! conn {:block/uuid (random-uuid)
                                :db/ident :user.property/person
                                :db/cardinality :db.cardinality/one
                                :block/name "person"
                                :block/title "Person"
                                :block/tags :logseq.class/Property
                                :block/created-at 1
                                :block/updated-at 1})
        page-id (add-page! conn "p")
        view-id (add! conn {:block/uuid (random-uuid)
                            :block/title ""
                            :block/page page-id
                            :block/parent page-id
                            :block/order "a0"
                            :block/created-at 1
                            :block/updated-at 1
                            :logseq.property.view/group-by-property class-id})
        block-id (add! conn {:block/uuid (random-uuid)
                             :block/title "b"
                             :block/page page-id
                             :block/parent page-id
                             :block/order "a1"
                             :block/created-at 1
                             :block/updated-at 1
                             :user.class/Person "v"})]
    (fix-invalid-blocks! conn :block [])
    (is (= property-id (:db/id (:logseq.property.view/group-by-property (d/entity @conn view-id)))))
    (let [block (d/entity @conn block-id)]
      (is (= "v" (:user.property/person block)))
      (is (nil? (:user.class/Person block))))))

(deftest validate-db-fixes-entity-over-several-rounds
  (let [conn (create-db-graph-conn)
        id (add! conn {:block/uuid (random-uuid)
                       :block/name "flags"
                       :block/title "flags"
                       :block/tags :logseq.class/Page
                       :block/created-at 1
                       :block/updated-at 1
                       :hide? true
                       :public? true})
        result (validate-db-quietly conn)
        page (d/entity @conn id)]
    (is (empty? (:errors result)))
    (is (nil? (:hide? page)))
    (is (nil? (:public? page)))))

(deftest validate-db-retracts-non-closed-values-and-keeps-closed-ones
  (let [conn (create-db-graph-conn)
        page-id (add-page! conn "p")
        valid-id (add! conn {:block/uuid (random-uuid)
                             :block/title "todo"
                             :block/page page-id
                             :block/parent page-id
                             :block/order "a0"
                             :block/created-at 1
                             :block/updated-at 1
                             :logseq.property/status :logseq.property/status.todo})
        invalid-id (add! conn {:block/uuid (random-uuid)
                               :block/title "bad"
                               :block/page page-id
                               :block/parent page-id
                               :block/order "a1"
                               :block/created-at 1
                               :block/updated-at 1
                               :logseq.property/status page-id})]
    (validate-db-quietly conn)
    (is (= :logseq.property/status.todo
           (:db/ident (:logseq.property/status (d/entity @conn valid-id)))))
    (is (nil? (:logseq.property/status (d/entity @conn invalid-id))))))

(deftest fix-extends-cardinality-makes-extends-cardinality-many
  (let [conn (create-db-graph-conn)]
    (d/transact! conn [[:db/add :logseq.property.class/extends :db/cardinality :db.cardinality/one]])
    (#'worker-db-validate/fix-extends-cardinality! conn)
    (is (= :db.cardinality/many
           (:db/cardinality (d/entity @conn :logseq.property.class/extends))))))

(deftest fix-icon-wrong-type-retracts-ref-value-type
  (let [conn (create-db-graph-conn)]
    (d/transact! conn [[:db/add :logseq.property/icon :db/valueType :db.type/ref]])
    (#'worker-db-validate/fix-icon-wrong-type! conn)
    (is (nil? (:db/valueType (d/entity @conn :logseq.property/icon))))))

(deftest fix-num-prefix-db-idents-renames-property-its-values-and-hidden-columns
  (let [conn (create-db-graph-conn)
        num-ident (keyword "user.property" "1foo")
        _property-id (add! conn {:block/uuid (random-uuid)
                                 :db/ident num-ident
                                 :db/cardinality :db.cardinality/one
                                 :db/index true
                                 :logseq.property/type :checkbox
                                 :block/name "1foo"
                                 :block/title "1foo"
                                 :block/tags :logseq.class/Property
                                 :block/created-at 1
                                 :block/updated-at 1})
        page-id (add-page! conn "p")
        block-id (add! conn {:block/uuid (random-uuid)
                             :block/title "b"
                             :block/page page-id
                             :block/parent page-id
                             :block/order "a0"
                             :block/created-at 1
                             :block/updated-at 1
                             num-ident true})
        view-id (add! conn {:block/uuid (random-uuid)
                            :block/title ""
                            :block/page page-id
                            :block/parent page-id
                            :block/order "a1"
                            :block/created-at 1
                            :block/updated-at 1
                            :logseq.property.table/hidden-columns #{num-ident}})]
    (#'worker-db-validate/fix-num-prefix-db-idents! conn)
    (is (some? (d/entity @conn :user.property/NUM-1foo)))
    (let [block (d/entity @conn block-id)]
      (is (true? (:user.property/NUM-1foo block)))
      (is (nil? (get block num-ident))))
    (is (= #{:user.property/NUM-1foo}
           (set (:logseq.property.table/hidden-columns (d/entity @conn view-id)))))))

(deftest fix-missing-internal-page-parent-orders-orders-child-page-as-a-repair
  (let [conn (create-db-graph-conn)
        parent-id (add-page! conn "parent")
        child-id (add! conn {:block/uuid (random-uuid)
                             :block/name "child"
                             :block/title "child"
                             :block/tags :logseq.class/Page
                             :block/parent parent-id
                             :block/created-at 1
                             :block/updated-at 1
                             :block/tx-id 1})]
    (with-transact-pipeline #(#'worker-db-validate/fix-missing-internal-page-parent-orders! conn))
    (let [child (d/entity @conn child-id)]
      (is (string? (:block/order child)))
      (is (not= 1 (:block/tx-id child))
          "A repair stamps every entity it changes with a new revision"))))

(deftest validate-db-orders-child-page-that-also-misses-updated-at
  ;; the order repair runs before the other repairs, so it must not be rejected
  ;; for the entity's other, still unrepaired, problems
  (let [conn (create-db-graph-conn)
        parent-id (add-page! conn "parent")
        child-id (add! conn {:block/uuid (random-uuid)
                             :block/name "child"
                             :block/title "child"
                             :block/tags :logseq.class/Page
                             :block/parent parent-id
                             :block/created-at 3})
        result (with-transact-pipeline #(validate-db-quietly conn))
        child (d/entity @conn child-id)]
    (is (string? (:block/order child)))
    (is (= 3 (:block/updated-at child)))
    (is (empty? (:errors result)))))

(deftest validate-db-notifies-valid-graph
  (let [conn (create-db-graph-conn)
        notifications (atom [])]
    (with-redefs [shared-service/broadcast-to-clients!
                  (fn [type payload]
                    (when (= :notification type)
                      (swap! notifications conj (first payload))))]
      (worker-db-validate/validate-db conn))
    (is (= 1 (count @notifications)))
    (is (re-find #"^Your graph is valid!" (first @notifications)))))
