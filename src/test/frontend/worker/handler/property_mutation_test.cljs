(ns frontend.worker.handler.property-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.property :as worker-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]))

(defn- initial-conn
  []
  (let [conn (d/create-conn (assoc db-schema/schema
                                   :user.property/ref {:db/valueType :db.type/ref
                                                       :db/cardinality :db.cardinality/one}
                                   :user.property/page-ref {:db/valueType :db.type/ref
                                                            :db/cardinality :db.cardinality/one}
                                   :user.property/multi {:db/cardinality :db.cardinality/many}))]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    conn))

(defn- idents
  [classes]
  (set (map :db/ident classes)))

(deftest get-all-classes-filters-private-and-extends-hidden-tags
  (let [conn (initial-conn)]
    (d/transact! conn [{:db/ident :user.class/Topic
                        :block/title "Topic"
                        :block/name "topic"
                        :block/uuid (random-uuid)
                        :block/tags :logseq.class/Tag}])
    (let [db @conn]
      (testing "defaults drop private tags and keep user classes"
        (let [result (idents (worker-property/get-all-classes db {}))]
          (is (contains? result :user.class/Topic))
          (is (contains? result :logseq.class/Root))
          (is (not (contains? result :logseq.class/Page)))))
      (testing "private tags are kept when not excluded"
        (let [result (idents (worker-property/get-all-classes
                              db {:except-private-tags? false}))]
          (is (contains? result :logseq.class/Page))
          (is (contains? result :user.class/Topic))))
      (testing "extends-hidden tags are dropped only when asked"
        (let [result (idents (worker-property/get-all-classes
                              db {:except-private-tags? false
                                  :except-extends-hidden-tags? true}))]
          (is (contains? result :user.class/Topic))
          (is (not (contains? result :logseq.class/Page))))))))

(deftest property-node-selector-data-class-options-and-class-ids
  (let [conn (initial-conn)
        plain-uuid (random-uuid)]
    (d/transact! conn [{:db/ident :user.class/Topic
                        :block/title "Topic"
                        :block/name "topic"
                        :block/uuid (random-uuid)
                        :block/tags :logseq.class/Tag}
                       {:block/title "Plain"
                        :block/name "plain"
                        :block/uuid plain-uuid
                        :block/tags :logseq.class/Page}])
    (let [db @conn
          plain-id (:db/id (d/entity db [:block/uuid plain-uuid]))
          topic-id (:db/id (d/entity db :user.class/Topic))
          data-for (fn [property]
                     (worker-property/property-node-selector-data
                      db {:property (cond-> property
                                      (not= :class (:logseq.property/type property))
                                      (assoc :logseq.property/classes [{:db/id topic-id}]))
                          :block {:db/id plain-id}}))]
      (testing "private tags are class options only for template-applied-to"
        (is (not (contains? (idents (:class-options
                                     (data-for {:db/ident :user.property/other
                                                :logseq.property/type :node})))
                            :logseq.class/Page)))
        (is (contains? (idents (:class-options
                                (data-for {:db/ident :logseq.property/template-applied-to
                                           :logseq.property/type :node})))
                       :logseq.class/Page)))
      (testing "the extends property adds the edited block to the class ids"
        (is (contains? (:structured-children-by-class-id
                        (data-for {:db/ident :logseq.property.class/extends
                                   :logseq.property/type :node}))
                       plain-id))
        (is (not (contains? (:structured-children-by-class-id
                             (data-for {:db/ident :user.property/other
                                        :logseq.property/type :node}))
                            plain-id))))
      (testing "a class-typed property offers the objects of the Tag class"
        (is (some #(= "Topic" (:block/title %))
                  (:initial-choices (data-for {:db/ident :user.property/cls
                                               :logseq.property/type :class}))))
        (is (= (set (map :db/id (worker-property/get-all-classes db {:except-private-tags? false})))
               (set (map :db/id (:initial-choices (data-for {:db/ident :user.property/cls
                                                             :logseq.property/type :class}))))))
        (is (contains? (:structured-children-by-class-id
                        (data-for {:db/ident :user.property/cls
                                   :logseq.property/type :class}))
                       topic-id))))))

(deftest broad-scoped-node-property-needs-node-type-and-page-class
  (let [f #'worker-property/broad-scoped-node-property?]
    (is (true? (f {:logseq.property/type :node} [{:db/ident :logseq.class/Page}])))
    (is (not (f {:logseq.property/type :default} [{:db/ident :logseq.class/Page}])))
    (is (not (f {:logseq.property/type :node} [{:db/ident :user.class/Topic}])))))

(deftest property-node-selector-resolves-hidden-value-blocks-to-targets
  (let [conn (initial-conn)
        target-uuid (random-uuid)
        alias-one-uuid (random-uuid)
        holder-uuid (random-uuid)
        page-value-uuid (random-uuid)]
    (d/transact! conn [{:db/ident :user.property/ref
                        :block/uuid (random-uuid)
                        :block/title "ref"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :node
                        :db/valueType :db.type/ref
                        :db/cardinality :db.cardinality/one}
                       {:db/ident :user.property/page-ref
                        :block/uuid (random-uuid)
                        :block/title "page-ref"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :page
                        :db/valueType :db.type/ref
                        :db/cardinality :db.cardinality/one}
                       {:db/id -1
                        :block/title "Target"
                        :block/name "target"
                        :block/uuid target-uuid
                        :block/tags :logseq.class/Page}
                       {:db/id -2
                        :block/title "Alias One"
                        :block/name "alias-one"
                        :block/uuid alias-one-uuid
                        :block/tags :logseq.class/Page
                        :block/alias -1}
                       {:db/id -3
                        :block/title "Alias Two"
                        :block/name "alias-two"
                        :block/uuid (random-uuid)
                        :block/tags :logseq.class/Page
                        :block/alias -1}
                       {:db/id -4
                        :block/title (str target-uuid)
                        :block/uuid (random-uuid)
                        :logseq.property/created-from-property :user.property/ref}
                       {:db/id -5
                        :block/title "holder"
                        :block/name "holder"
                        :block/uuid holder-uuid
                        :block/tags :logseq.class/Page
                        :user.property/ref -4
                        :user.property/page-ref -6}
                       {:db/id -6
                        :block/title (str target-uuid)
                        :block/uuid page-value-uuid
                        :logseq.property/created-from-property :user.property/page-ref}])
    (let [db @conn
          target (d/entity db [:block/uuid target-uuid])
          alias-one (d/entity db [:block/uuid alias-one-uuid])
          data (worker-property/property-node-selector-data
                db {:property {:db/ident :user.property/ref}
                    :block {:db/id (:db/id (d/entity db [:block/uuid holder-uuid]))}})
          choice (first (:initial-choices data))]
      (is (= 1 (count (:initial-choices data))))
      (is (= (:db/id target) (get-in choice [:value :db/id])))
      (is (= "Target" (:label choice)))
      (is (= (:db/id alias-one) (get-in choice [:value :block/alias-source-page-id])))
      (testing "only :node properties resolve hidden value blocks"
        (let [page-data (worker-property/property-node-selector-data
                         db {:property {:db/ident :user.property/page-ref}
                             :block {:db/id (:db/id (d/entity db [:block/uuid holder-uuid]))}})
              page-choice (first (:initial-choices page-data))]
          (is (= (:db/id (d/entity db [:block/uuid page-value-uuid]))
                 (get-in page-choice [:value :db/id])))
          (is (nil? (get-in page-choice [:value :block/alias-source-page-id]))))))))

(defn- render-conn
  []
  (db-test/create-conn-with-blocks
   {:properties {:visible {:logseq.property/type :default}
                 :hidden {:logseq.property/type :default :logseq.property/hide? true}
                 :hide-empty {:logseq.property/type :default :logseq.property/hide-empty-value true}
                 :cpa {:logseq.property/type :default}
                 :cpb {:logseq.property/type :default}
                 :bottom {:logseq.property/type :default :logseq.property/ui-position :block-below}
                 :p-default {:logseq.property/type :default}
                 :p-default-many {:logseq.property/type :default :db/cardinality :db.cardinality/many}
                 :p-closed {:logseq.property/type :default
                            :build/closed-values [{:value "One" :uuid (random-uuid)}]}
                 :p-url {:logseq.property/type :url}
                 :p-node-many {:logseq.property/type :node :db/cardinality :db.cardinality/many}}
    :classes {:ClsA {:build/class-properties [:cpa]}
              :ClsB {:build/class-properties [:cpb]}}
    :pages-and-blocks
    [{:page {:block/title "P"}
      :blocks [{:block/title "blk"
                :build/tags [:ClsA :ClsB]
                :build/properties {:visible "v" :hidden "h" :hide-empty "x"}}
               {:block/title "empty"}
               {:block/title "valued"
                :build/properties {:bottom "b"}}]}]}))

(defn- full-ids
  [result]
  (set (map :property-id (:full-properties result))))

(deftest display-properties-shows-visible-class-and-hidden-valued-properties
  (let [conn (render-conn)
        db @conn
        blk (db-test/find-block-by-content db "blk")]
    (testing "gallery view only drops class property lists"
      (is (contains? (full-ids (worker-property/display-properties db blk {:gallery-view? true} false))
                     :user.property/visible)))
    (testing "hide-empty-value does not hide a valued property"
      (d/transact! conn [[:db/add :user.property/hide-empty :logseq.property/hide-empty-value true]])
      (is (true? (:logseq.property/hide-empty-value (d/entity @conn :user.property/hide-empty))))
      (is (contains? (full-ids (worker-property/display-properties @conn (d/entity @conn (:db/id blk)) {} false))
                     :user.property/hide-empty)))
    (testing "state-hide-empty keeps a hidden-by-default property that has a value"
      (is (contains? (full-ids (worker-property/display-properties
                                db blk {:state-hide-empty-properties? true} false))
                     :user.property/hidden)))
    (testing "every tagged class contributes its properties"
      (let [ids (full-ids (worker-property/display-properties db blk {} false))]
        (is (contains? ids :user.property/cpa))
        (is (contains? ids :user.property/cpb))))
    (testing "non-public built-in properties are not displayed"
      (d/transact! conn [[:db/add (:db/id blk) :logseq.property/created-from-property (:db/id blk)]])
      (let [result (worker-property/display-properties @conn (d/entity @conn (:db/id blk)) {} true)]
        (is (not (contains? (full-ids result) :logseq.property/created-from-property)))
        (is (contains? (full-ids result) :user.property/visible))))))

(deftest display-properties-for-block-reads-cardinality-and-bidirectional-default
  (let [conn (initial-conn)
        holder-uuid (random-uuid)]
    (d/transact! conn [{:db/ident :user.property/multi
                        :block/uuid (random-uuid)
                        :block/title "multi"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :default}
                       {:db/ident :user.class/Plain
                        :block/title "Plain"
                        :block/name "plain"
                        :block/uuid (random-uuid)
                        :block/tags :logseq.class/Tag}
                       {:db/ident :user.class/Set
                        :block/title "Set"
                        :block/name "set"
                        :block/uuid (random-uuid)
                        :block/tags :logseq.class/Tag
                        :logseq.property.class/enable-bidirectional? true}
                       {:block/title "holder"
                        :block/name "holder"
                        :block/uuid holder-uuid
                        :user.property/multi ["a" "b"]}])
    (let [db @conn
          f worker-property/display-properties-for-block]
      (is (= #{"a" "b"} (get (f db (d/entity db [:block/uuid holder-uuid])) :user.property/multi)))
      (is (false? (:logseq.property.class/enable-bidirectional?
                   (f db (d/entity db :user.class/Plain)))))
      (is (true? (:logseq.property.class/enable-bidirectional?
                  (f db (d/entity db :user.class/Set)))))
      (is (not (contains? (f db (d/entity db :logseq.class/Task))
                          :logseq.property.class/enable-bidirectional?))))))

(deftest block-class-properties-accepts-tag-maps-and-idents
  (let [conn (render-conn)
        db @conn
        f #'worker-property/block-class-properties
        cls-a (d/entity db :user.class/ClsA)]
    (doseq [tag [{:db/id (:db/id cls-a)} {:db/ident :user.class/ClsA} :user.class/ClsA]]
      (is (= #{:user.property/cpa}
             (set (map :db/ident (:classes-properties (f db {:block/tags [tag]}))))))
          (pr-str tag))))

(deftest render-property-position-helpers
  (let [conn (render-conn)
        db @conn
        bottom? #(boolean (#'worker-property/render-bottom-position-property? db (d/entity db %)))
        schema? #'worker-property/render-schema-or-tag-related-property?
        tag-page? #(boolean (#'worker-property/render-tag-class-page? db (d/entity db %)))]
    (testing "schema and tag related properties"
      (is (true? (boolean (schema? :block/tags))))
      (is (true? (boolean (schema? :logseq.property.class/properties))))
      (is (true? (boolean (schema? :logseq.property/type))))
      (is (not (schema? :user.property/visible))))
    (testing "tag class pages"
      (is (true? (tag-page? :logseq.class/Tag)))
      (is (true? (tag-page? :user.class/ClsA)))
      (is (false? (tag-page? :user.property/visible))))
    (testing "bottom position is for non-default types, closed values and node lists"
      (is (false? (bottom? :user.property/p-default)))
      (is (false? (bottom? :user.property/p-default-many)))
      (is (true? (bottom? :user.property/p-closed)))
      (is (false? (bottom? :user.property/p-url)))
      (is (true? (bottom? :user.property/p-node-many)))
      (is (true? (bottom? :logseq.property/created-from-property)))
      (is (false? (bottom? :logseq.property.class/extends))))))

(deftest render-positioned-property-block-below-needs-value-or-allowance
  (let [conn (render-conn)
        db @conn
        f #'worker-property/render-positioned-property?
        empty-id (:db/id (db-test/find-block-by-content db "empty"))
        valued-id (:db/id (db-test/find-block-by-content db "valued"))
        class-id (:db/id (d/entity db :user.class/ClsA))
        p :user.property/bottom]
    (is (not (f db empty-id p :block-below {})))
    (is (f db valued-id p :block-below {}))
    (is (f db empty-id p :block-below {:allow-empty-block-below? true}))
    (is (f db class-id p :block-below {}))
    (is (not (f db valued-id p :block-left {})))))

(deftest block-positioned-property-idents-by-position-drops-unpositioned
  (let [conn (render-conn)
        db @conn
        blk (db-test/find-block-by-content db "blk")
        result (worker-property/block-positioned-property-idents-by-position db (:db/id blk))]
    (is (not (contains? result nil)))
    (is (every? seq (vals result)))))

(deftest worker-property-small-helpers
  (let [conn (render-conn)
        db @conn
        blk (db-test/find-block-by-content db "blk")
        tag-ids (sort (map :db/id (:block/tags blk)))]
    (testing "entity-direct-value reads the first stored value"
      (is (= (first tag-ids) (worker-property/entity-direct-value db blk :block/tags))))
    (testing "entity-ref-value? needs a map"
      (is (not (#'worker-property/entity-ref-value? #{:db/id}))))
    (testing "sort-by-order-recursive leaves plain maps alone"
      (is (= {:a 1} (#'worker-property/sort-by-order-recursive {:a 1}))))
    (testing "group-by-page groups only when the first block has a page"
      (is (map? (#'worker-property/group-by-page [{:block/page 1 :id 1} {:id 2}]))))))
