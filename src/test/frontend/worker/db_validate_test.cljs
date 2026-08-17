(ns frontend.worker.db-validate-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]))

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
      (with-transact-pipeline #(worker-db-validate/validate-db conn :fix true))
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
      (let [result (with-transact-pipeline #(worker-db-validate/validate-db conn :fix true))
            journal (d/entity @conn journal-id)
            property (d/entity @conn :logseq.property.class/extends)
            class (d/entity @conn class-id)]
        (is (empty? (:errors result)))
        (doseq [entity [journal property class]]
          (is (not= 1 (:block/tx-id entity))
              (str "Every canonical entity changed by a live repair receives a new revision: "
                   (select-keys entity [:db/id :db/ident :block/uuid :block/title]))))
        (is (= 1 (:block/updated-at journal)))
        (is (= [:logseq.class/Property] (mapv :db/ident (:block/tags property))))
        (is (nil? (:logseq.property.class/extends property)))
        (is (nil? (:kv/value class)))
        (is (empty? (:errors (worker-db-validate/validate-db conn))))))))

(defn- fig-source-value-id
  [db block-id]
  (:db/id (:user.property/fig-source (d/entity db block-id))))

(defn- create-node-property-with-orphaned-closed-values
  "Text property with leftover closed values after a type change to Node, plus a live Node value."
  []
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:fig-source {:logseq.property/type :default
                                         :build/closed-values [{:value "raster"}
                                                               {:value "vector"}]}}
               :pages-and-blocks
               [{:page {:block/title "some-node-page"}}
                {:page {:block/title "page 1"}
                 :blocks [{:block/title "target block"}]}]})
        property (d/entity @conn :user.property/fig-source)
        node-page (db-test/find-page-by-title @conn "some-node-page")
        block (db-test/find-block-by-content @conn "target block")]
    (d/transact! conn [{:db/id (:db/id property)
                        :logseq.property/type :node}])
    (d/transact! conn [[:db/add (:db/id block) :user.property/fig-source (:db/id node-page)]])
    {:conn conn
     :block-id (:db/id block)
     :node-page-id (:db/id node-page)
     :updated-at (:block/updated-at (d/entity @conn (:db/id block)))}))

(deftest validate-db-preserves-node-value-when-property-has-orphaned-closed-values
  (let [{:keys [conn block-id node-page-id updated-at]} (create-node-property-with-orphaned-closed-values)
        property (d/entity @conn :user.property/fig-source)]
    (is (= :node (:logseq.property/type property)))
    (is (seq (:block/_closed-value-property property))
        "Leftover closed values remain after the type change.")
    (is (= node-page-id (fig-source-value-id @conn block-id)))
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _args] nil)]
      (testing "validate without --fix does not mutate"
        (let [result (worker-db-validate/validate-db conn)
              block (d/entity @conn block-id)]
          (is (empty? (:errors result)))
          (is (= node-page-id (fig-source-value-id @conn block-id))
              "GUI default validate must not drop a live Node value")
          (is (= updated-at (:block/updated-at block)))
          (is (zero? (or (:retracted-property-values result) 0)))))
      (testing "validate with --fix still keeps a valid Node value"
        (let [result (with-transact-pipeline
                       #(worker-db-validate/validate-db conn :fix true))
              block (d/entity @conn block-id)]
          (is (empty? (:errors result)))
          (is (= node-page-id (fig-source-value-id @conn block-id))
              "--fix must not silently drop a valid Node value")
          (is (zero? (or (:retracted-property-values result) 0)))
          (is (= updated-at (:block/updated-at block))))))))

(deftest validate-db-reports-closed-value-retractions-when-fixing
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:status {:logseq.property/type :default
                                     :build/closed-values [{:value "Todo"}
                                                           {:value "Doing"}]}}
               :pages-and-blocks
               [{:page {:block/title "some-node-page"}}
                {:page {:block/title "page 1"}
                 :blocks [{:block/title "target block"}]}]})
        block (db-test/find-block-by-content @conn "target block")
        node-page (db-test/find-page-by-title @conn "some-node-page")
        _ (d/transact! conn [[:db/add (:db/id block) :user.property/status (:db/id node-page)]])
        original-updated-at (:block/updated-at (d/entity @conn (:db/id block)))
        notifications (atom [])]
    (is (= (:db/id node-page)
           (:db/id (:user.property/status (d/entity @conn (:db/id block))))))
    (with-redefs [shared-service/broadcast-to-clients!
                  (fn [type' payload]
                    (when (= type' :notification)
                      (swap! notifications conj payload)))]
      (testing "without --fix the out-of-enum value is left in place"
        (let [result (worker-db-validate/validate-db conn :fix false)]
          (is (= (:db/id node-page)
                 (:db/id (:user.property/status (d/entity @conn (:db/id block))))))
          (is (zero? (or (:retracted-property-values result) 0)))
          (is (= original-updated-at
                 (:block/updated-at (d/entity @conn (:db/id block)))))))
      (testing "with --fix the out-of-enum value is retracted, stamped, and reported"
        (reset! notifications [])
        (let [result (with-transact-pipeline
                       #(worker-db-validate/validate-db conn :fix true))
              block' (d/entity @conn (:db/id block))
              notification (first @notifications)]
          (is (nil? (:user.property/status block')))
          (is (pos? (:retracted-property-values result)))
          (is (> (:block/updated-at block') original-updated-at))
          (is (nat-int? (:block/tx-id block')))
          (is (= :graph.validation/values-retracted
                 (get-in notification [5 :i18n-key]))
              "Retractions must not be reported as a silent valid graph")
          (is (not= :graph.validation/valid
                    (get-in notification [5 :i18n-key]))))))))
