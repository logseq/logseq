(ns frontend.worker.handler.property-mutation2-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.property :as worker-property]
            [frontend.worker.plain-value :as worker-plain]
            [frontend.worker.state :as worker-state]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(defn- thread-api-fn
  [k]
  (let [f (get @thread-api/*thread-apis k)]
    (assert (fn? f) (str "thread api not registered: " k))
    f))

(defn- call-thread-api
  [conn k & args]
  (let [repo "mutation2-property-repo"]
    (swap! worker-state/*datascript-conns assoc repo conn)
    (try
      (apply (thread-api-fn k) repo args)
      (finally
        (swap! worker-state/*datascript-conns dissoc repo)))))

(defn- add-class!
  [conn ident title uuid' extends-id]
  (d/transact! conn [(cond-> {:db/ident ident
                              :block/title title
                              :block/name (.toLowerCase title)
                              :block/uuid uuid'
                              :block/tags :logseq.class/Tag}
                       extends-id
                       (assoc :logseq.property.class/extends extends-id))])
  (:db/id (d/entity @conn ident)))

(deftest first-url-property-value-reads-the-blocks-own-url
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:link {:logseq.property/type :url}}
               :pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "first"
                           :build/properties {:link "https://first.example"}}
                          {:block/title "second"
                           :build/properties {:link "https://second.example"}}
                          {:block/title "valued"
                           :build/properties {:link {:build/property-value :block
                                                     :block/title "https://valued.example"}}}]}]})
        db @conn
        id-of #(:db/id (db-test/find-block-by-content db %))]
    (is (= "https://second.example"
           (#'worker-property/first-url-property-value db (id-of "second"))))
    (is (= "https://valued.example"
           (#'worker-property/first-url-property-value db (id-of "valued"))))))

(deftest get-all-classes-skips-recycled-classes
  (let [conn (db-test/create-conn-with-blocks {:classes {:Live {} :Gone {}}})]
    (d/transact! conn [[:db/add [:db/ident :user.class/Gone] :logseq.property/deleted-at 1234]])
    (let [idents (set (map :db/ident (worker-property/get-all-classes @conn {})))]
      (is (contains? idents :user.class/Live))
      (is (not (contains? idents :user.class/Gone))))))

(deftest class-extends-children-tree-nests-and-sorts-children
  (let [conn (db-test/create-conn-with-blocks {:classes {:Parent {}}})
        parent-id (:db/id (d/entity @conn :user.class/Parent))
        ;; uuid order is the reverse of title order
        _ (add-class! conn :user.class/B "B" #uuid "00000000-0000-0000-0000-000000000001" parent-id)
        a-id (add-class! conn :user.class/A "A" #uuid "00000000-0000-0000-0000-000000000002" parent-id)
        _ (add-class! conn :user.class/A1 "A1" #uuid "00000000-0000-0000-0000-000000000003" a-id)
        tree (worker-property/class-extends-children-tree @conn parent-id)
        a-node (first tree)]
    (is (vector? tree))
    (is (every? map? tree) "children are plain maps")
    (when (every? map? tree)
      (is (= ["A" "B"] (mapv :block/title tree)) "children sorted by title")
      (is (= #{:db/id :block/title :block/uuid :db/ident :class/children}
             (set (keys a-node))))
      (is (= :user.class/A (:db/ident a-node)))
      (is (= a-id (:db/id a-node)))
      (is (= ["A1"] (mapv :block/title (:class/children a-node))))
      (is (= [] (:class/children (first (:class/children a-node)))))
      (is (= [] (:class/children (second tree)))))))

(deftest property-node-selector-data-options-and-distinct-choices
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {} :Other {}}
               :pages-and-blocks
               [{:page {:block/title "Both tags" :build/tags [:Topic :Other]}}]})
        topic (d/entity @conn :user.class/Topic)
        other (d/entity @conn :user.class/Other)
        property {:db/ident :user.property/refs
                  :logseq.property/type :node
                  :logseq.property/classes [(select-keys topic [:db/id :db/ident :block/title])
                                            (select-keys other [:db/id :db/ident :block/title])]}
        data (worker-property/property-node-selector-data @conn {:property property})]
    (is (= ["Both tags"] (mapv :block/title (:initial-choices data)))
        "a page tagged with both classes is a single choice")
    (is (every? #(and (map? %) (not (de/entity? %))) (:initial-choices data))
        "choices are plain maps")
    (testing "extends options hide the extends-hidden tags"
      (is (= (set (map :db/ident (worker-property/get-all-classes @conn {:except-extends-hidden-tags? true})))
             (set (map :db/ident (:extends-class-options data)))))
      (is (not= (set (map :db/ident (:extends-class-options data)))
                (set (map :db/ident (:all-classes data))))))
    (testing "class ids are not duplicated and the root class is not a choice class"
      (is (= (count (:structured-children-by-class-id data))
             (count (distinct (keys (:structured-children-by-class-id data)))))))))

(deftest property-node-selector-data-excludes-root-class-from-initial-choices
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {}}
               :pages-and-blocks
               [{:page {:block/title "Topic page" :build/tags [:Topic]}}]})
        root (d/entity @conn :logseq.class/Root)
        topic (d/entity @conn :user.class/Topic)
        property {:db/ident :user.property/refs
                  :logseq.property/type :node
                  :logseq.property/classes [(select-keys root [:db/id :db/ident :block/title])
                                            (select-keys topic [:db/id :db/ident :block/title])]}
        data (worker-property/property-node-selector-data @conn {:property property})]
    (is (= ["Topic page"] (mapv :block/title (:initial-choices data)))
        "root class is not used to find choices")
    (is (nil? (:initial-choices
               (worker-property/property-node-selector-data
                @conn {:property (assoc property :logseq.property/type :property)})))
        "a :property type property has no initial choices")))

(deftest get-class-objects-thread-api-returns-plain-values-with-explicit-refs
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:C1 {}}
               :pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "object" :build/tags [:C1]}]}]})
        db @conn
        class-id (:db/id (d/entity db :user.class/C1))
        plain (map #(worker-plain/worker-plain-value db %)
                   (db-class/get-class-objects db class-id))
        expected (worker-plain/with-explicit-ref-fields-recursive plain)]
    (is (= 1 (count expected)))
    (is (= (vec expected)
           (vec (call-thread-api conn :thread-api/get-class-objects class-id))))))

(deftest property-node-selector-data-finds-class-objects-by-class-id-only
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {}}
               :pages-and-blocks
               [{:page {:block/title "Topic page" :build/tags [:Topic]}}]})
        topic-id (:db/id (d/entity @conn :user.class/Topic))
        data (worker-property/property-node-selector-data
              @conn {:property {:db/ident :user.property/refs
                                :logseq.property/type :node
                                :logseq.property/classes [{:db/id topic-id}]}})]
    (is (= ["Topic page"] (mapv :block/title (:initial-choices data))))))

(deftest property-node-selector-values-carry-identity-fields
  (let [alias-target-uuid (random-uuid)
        alias-source-uuid (random-uuid)
        class-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:Thing {:block/uuid class-uuid :build/keep-uuid? true}}
               :properties {:refs {:logseq.property/type :node
                                   :db/cardinality :db.cardinality/many}}
               :pages-and-blocks
               [{:page {:block/title "Alias target" :block/uuid alias-target-uuid
                        :build/keep-uuid? true}}
                {:page {:block/title "Alias source" :block/uuid alias-source-uuid
                        :build/keep-uuid? true
                        :build/properties {:block/alias #{[:block/uuid alias-target-uuid]}}}}
                {:page {:block/title "Referrer"
                        :build/properties {:refs #{[:block/uuid alias-target-uuid]
                                                   [:block/uuid alias-source-uuid]
                                                   [:block/uuid class-uuid]}}}}]})
        data (worker-property/property-node-selector-data
              @conn {:property (d/entity @conn :user.property/refs)})
        choices (:initial-choices data)
        values (map :value choices)
        by-title (into {} (map (juxt :block/title identity)) (map #(into {} %) values))]
    (is (seq choices))
    (let [class-value (first (filter #(= :user.class/Thing (:db/ident %)) values))]
      (is (some? class-value) "choice value carries :db/ident")
      (is (= class-uuid (:block/uuid class-value)) "choice value carries :block/uuid")
      (is (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags class-value))
          "choice value carries :block/tags")
      (is (not (contains? class-value :block/name))
          "choice value only carries the identity attributes"))
    (let [source (first (filter #(= alias-source-uuid (:block/uuid %)) values))]
      (is (some? source))
      (is (some? (:block/alias source)) "choice value carries :block/alias"))
    (let [target (first (filter #(= alias-target-uuid (:block/uuid %)) values))]
      (is (some? target))
      (is (number? (:block/alias-source-page-id target))
          "alias target remembers the page that aliases it"))
    (is (some? by-title))))

(deftest thread-apis-are-registered-under-their-own-names
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :classes {:C1 {:build/class-properties [:p1]}}
               :pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "tagged" :build/tags [:C1] :build/properties {:p1 "v"}}]}]})
        class-id (:db/id (d/entity @conn :user.class/C1))]
    (testing "get-all-classes"
      (is (some #(= :user.class/C1 (:db/ident %))
                (call-thread-api conn :thread-api/get-all-classes {}))))
    (testing "get-class-properties"
      (is (= [:user.property/p1]
             (mapv :db/ident (call-thread-api conn :thread-api/get-class-properties class-id)))))
    (testing "get-property-values"
      (let [option {:property-ident :user.property/p1}
            expected (db-view/get-property-values @conn :user.property/p1 option)]
        (is (seq expected))
        (is (= expected (call-thread-api conn :thread-api/get-property-values option)))))
    (testing "validate-property-value"
      (let [property (d/entity @conn :user.property/p1)]
        (is (= (outliner-property/validate-property-value @conn property "text")
               (call-thread-api conn :thread-api/validate-property-value
                                {:property property :value "text"})))))))

(deftest convert-tag-to-page-drops-class-schema
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :classes {:Parent {}
                         :Topic {:build/class-extends [:Parent]
                                 :build/class-properties [:p1]}}})
        topic-id (:db/id (d/entity @conn :user.class/Topic))
        tx-metas (atom [])]
    (d/listen! conn ::capture (fn [tx-report] (swap! tx-metas conj (:tx-meta tx-report))))
    (call-thread-api conn :thread-api/convert-tag-to-page topic-id)
    (let [topic (d/entity @conn topic-id)]
      (is (nil? (:logseq.property.class/extends topic)))
      (is (nil? (:logseq.property.class/properties topic)))
      (is (nil? (:db/ident topic)))
      (is (= #{:logseq.class/Page} (set (map :db/ident (:block/tags topic))))))
    (is (some #(= :save-block (:outliner-op %)) @tx-metas))))

(deftest convert-page-to-tag-transacts-as-save-block
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Convert me"}}]})
        page-id (:db/id (db-test/find-page-by-title @conn "Convert me"))
        tx-metas (atom [])]
    (d/listen! conn ::capture (fn [tx-report] (swap! tx-metas conj (:tx-meta tx-report))))
    (call-thread-api conn :thread-api/convert-page-to-tag page-id)
    (is (some #(= :save-block (:outliner-op %)) @tx-metas))
    (is (contains? (set (map :db/ident (:block/tags (d/entity @conn page-id))))
                   :logseq.class/Tag))))

(defn- full-ids [result] (set (map :property-id (:full-properties result))))
(defn- hidden-ids [result] (set (map :property-id (:hidden-properties result))))

(deftest entity-direct-value-accepts-lookup-refs-and-ids
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page"} :blocks [{:block/title "b1"}]}]})
        db @conn
        block (db-test/find-block-by-content db "b1")]
    (is (= "b1" (worker-property/entity-direct-value db [:block/uuid (:block/uuid block)] :block/title)))
    (is (= "b1" (worker-property/entity-direct-value db (:db/id block) :block/title)))))

(deftest display-property-map-reports-description-and-closed-values
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default
                                 :build/properties {:logseq.property/description "About p1"}
                                 :build/closed-values [{:value "A" :uuid (random-uuid)}]}
                            :p2 {:logseq.property/type :default}}})
        db @conn
        property (d/entity db :user.property/p1)
        description (:logseq.property/description property)
        m (worker-property/display-property-map db :user.property/p1)]
    (is (some? description))
    (is (= {:db/id (:db/id description)
            :block/title "About p1"
            :block/uuid (:block/uuid description)}
           (:logseq.property/description m)))
    (is (= 1 (count (:property/closed-values m))))
    (is (= 1 (count (worker-property/property-closed-values db {:db/id (:db/id property)})))
        "closed values are found from a plain map with only a :db/id")
    (is (not (contains? (worker-property/display-property-map db :user.property/p2)
                        :logseq.property/description)))))

(deftest positioned-property-meta-reflects-property-flags
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}
                            :p2 {:logseq.property/type :default}
                            :p3 {:logseq.property/type :default}}})
        _ (d/transact! conn [{:db/ident :user.property/p1
                              :logseq.property/public? false
                              :logseq.property/hide? true
                              :logseq.property/hide-empty-value true}
                             {:db/ident :user.property/p2
                              :logseq.property/scalar-default-value "x"}])
        meta-of #(#'worker-property/positioned-property-meta @conn %)
        meta1 (meta-of :user.property/p1)
        meta2 (meta-of :user.property/p2)
        meta3 (meta-of :user.property/p3)]
    (is (= :user.property/p1 (:db/ident (:property meta1))))
    (is (false? (:public? meta1)))
    (is (true? (:hide? meta1)))
    (is (true? (:hide-empty? meta1)))
    (is (false? (:default? meta1)))
    (is (true? (:public? meta3)))
    (is (false? (:hide? meta3)))
    (is (false? (:hide-empty? meta3)))
    (is (true? (:default? meta2)) "a scalar default value counts as a default")))

(deftest block-class-properties-caches-by-tag-ids-and-orders-map-blocks
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}
                            :p2 {:logseq.property/type :default}}
               :classes {:Zed {:build/class-properties [:p1 :p2]}
                         :Alpha {:build/class-properties [:p1]}
                         :NoProps {}}
               :pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "tagged" :build/tags [:Zed]}]}]})
        db @conn
        class-id #(:db/id (d/entity db %))
        block (db-test/find-block-by-content db "tagged")
        cache (volatile! {})]
    (binding [worker-property/*block-class-properties-cache* cache]
      (#'worker-property/block-class-properties db block))
    (is (= #{[(class-id :user.class/Zed)]} (set (keys @cache)))
        "the cache key is the block's tag ids")
    (let [result (#'worker-property/block-class-properties
                  db {:block/tags [(class-id :user.class/Zed)
                                   {:db/ident :user.class/Alpha}
                                   (class-id :user.class/NoProps)]})]
      (is (= [:user.class/Alpha :user.class/Zed] (mapv :db/ident (:all-classes result)))
          "classes sorted by name, classes without properties dropped")
      (is (= #{:user.property/p1 :user.property/p2}
             (set (map :db/ident (:classes-properties result)))))
      (is (= 2 (count (:classes-properties result))) "shared properties are not repeated"))))

(deftest display-properties-for-block-groups-many-values-as-sets
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:multi {:logseq.property/type :default
                                    :db/cardinality :db.cardinality/many}}
               :pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:multi #{"x" "y"}}}]}]})
        db @conn
        props (worker-property/display-properties-for-block
               db (db-test/find-block-by-content db "b1"))]
    (is (set? (get props :user.property/multi)))
    (is (= 2 (count (get props :user.property/multi))))))

(deftest recycled-entity-values-are-filtered-for-display
  (let [live {:db/id 1}
        gone {:db/id 2 :logseq.property/deleted-at 5}
        gone-by-uuid {:block/uuid (random-uuid) :logseq.property/deleted-at 5}
        f #'worker-property/filter-recycled-entity-values
        sanitize #'worker-property/sanitize-property-values-for-display]
    (is (nil? (f gone)))
    (is (nil? (f gone-by-uuid)) "entities identified by :block/uuid count as entity refs")
    (is (= [live] (f [live gone])))
    (is (vector? (f [live gone])))
    (is (= [live] (f (list live gone))))
    (is (vector? (f (list live gone))))
    (is (= #{live} (f #{live gone})))
    (is (= "text" (f "text")))
    (is (= {:properties {} :recycled-only-property-ids #{}} (sanitize {})))
    (is (= {:properties {:user.property/a nil :user.property/b "x" :user.property/c nil}
            :recycled-only-property-ids #{:user.property/a :user.property/c}}
           (sanitize {:user.property/a [gone]
                      :user.property/b "x"
                      :user.property/c gone-by-uuid})))))

(deftest display-properties-shows-other-position-properties-in-page-areas
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page"} :blocks [{:block/title "plain"}]}]})
        tagged-ids (doall
                    (for [tag [:logseq.class/Page :logseq.class/Tag :logseq.class/Property :logseq.class/Journal]]
                      (let [uuid' (random-uuid)]
                        (d/transact! conn [{:block/uuid uuid'
                                            :block/title (str "tagged " (name tag))
                                            :block/tags tag
                                            :logseq.property/status :logseq.property/status.todo}])
                        [tag uuid'])))
        db @conn
        plain (db-test/find-block-by-content db "plain")]
    (d/transact! conn [[:db/add (:db/id plain) :logseq.property/status :logseq.property/status.todo]])
    (doseq [[tag uuid'] tagged-ids]
      (let [block (d/entity @conn [:block/uuid uuid'])
            result (worker-property/display-properties @conn block {:page-title? true} false)]
        (is (contains? (full-ids result) :logseq.property/status)
            (str "status is shown on a page-like node tagged " tag))
        (is (not (contains? (full-ids result) :block/tags))
            "tags are never listed as a property")
        (is (not (contains? (hidden-ids result) :block/tags)))))
    (let [result (worker-property/display-properties
                  @conn (d/entity @conn (:db/id plain)) {:page-title? true} false)]
      (is (not (contains? (full-ids result) :logseq.property/status))
          "a plain block keeps the left-positioned status out of the list"))))

(deftest display-properties-gallery-view-hides-class-properties-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :classes {:C1 {:build/class-properties [:p1]}}})
        db @conn
        class (d/entity db :user.class/C1)]
    (is (contains? (full-ids (worker-property/display-properties db class {:page-title? true} false))
                   :logseq.property.class/properties))
    (is (not (contains? (full-ids (worker-property/display-properties
                                   db class {:page-title? true :gallery-view? true} false))
                        :logseq.property.class/properties)))))

(deftest display-properties-lists-hidden-class-properties-once
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:he {:logseq.property/type :default}
                            :hid {:logseq.property/type :default}
                            :shared {:logseq.property/type :default}}
               :classes {:C2 {:build/class-properties [:he :hid :shared]}
                         :C3 {:build/class-properties [:shared]}}
               :pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "with hidden" :build/tags [:C2 :C3]}]}]})
        _ (d/transact! conn [{:db/ident :user.property/he :logseq.property/hide-empty-value true}
                             {:db/ident :user.property/hid :logseq.property/hide? true}])
        db @conn
        hidden-block (db-test/find-block-by-content db "with hidden")
        hidden-result (worker-property/display-properties
                       @conn (d/entity @conn (:db/id hidden-block)) {} false)]
    (testing "empty hide-empty and hidden class properties are listed as hidden"
      (is (contains? (hidden-ids hidden-result) :user.property/he))
      (is (contains? (hidden-ids hidden-result) :user.property/hid))
      (is (not (contains? (full-ids hidden-result) :user.property/he)))
      (is (not (contains? (full-ids hidden-result) :user.property/hid))))
    (testing "a property declared by two classes is listed once"
      (is (= 1 (count (filter #(= :user.property/shared (:property-id %))
                              (:full-properties hidden-result))))))))

(deftest display-properties-lists-a-hidden-class-property-with-a-value-once
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:hid {:logseq.property/type :default}}
               :classes {:C2 {:build/class-properties [:hid]}}
               :pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "valued" :build/tags [:C2]
                                             :build/properties {:hid "x"}}]}]})
        _ (d/transact! conn [{:db/ident :user.property/hid :logseq.property/hide? true}])
        block (db-test/find-block-by-content @conn "valued")
        result (worker-property/display-properties @conn block {} false)]
    (is (= 1 (count (filter #(= :user.property/hid (:property-id %)) (:hidden-properties result)))))
    (is (not (contains? (full-ids result) :user.property/hid)))))

(deftest display-properties-shows-hidden-properties-when-asked-under-hide-empty
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:hid {:logseq.property/type :default}}
               :classes {:C2 {:build/class-properties [:hid]}}
               :pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "empty" :build/tags [:C2]}]}]})
        _ (d/transact! conn [{:db/ident :user.property/hid :logseq.property/hide? true}])
        block (db-test/find-block-by-content @conn "empty")
        result (worker-property/display-properties @conn block {:state-hide-empty-properties? true} true)]
    (is (contains? (full-ids result) :user.property/hid)
        "show-empty-and-hidden-properties? shows a hide? property, empty or not")
    (is (not (contains? (hidden-ids result) :user.property/hid)))))

(deftest display-properties-does-not-list-query-as-hidden
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "Todo query"
                           :build/tags [:logseq.class/Query]
                           :build/properties
                           {:logseq.property/query
                            {:build/property-value :block
                             :block/title "{:query (task Todo)}"}}}]}]})
        db @conn
        block (db-test/find-block-by-content db "Todo query")
        result (worker-property/display-properties db block {} false)]
    (is (not (contains? (hidden-ids result) :logseq.property/query)))))

(deftest render-tag-class-page?-recognizes-the-tag-class
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:C1 {}}
               :pages-and-blocks [{:page {:block/title "page"} :blocks [{:block/title "plain"}]}]})
        db @conn]
    (is (true? (boolean (#'worker-property/render-tag-class-page? db (d/entity db :logseq.class/Tag)))))
    (is (true? (boolean (#'worker-property/render-tag-class-page? db (d/entity db :user.class/C1)))))
    (is (false? (boolean (#'worker-property/render-tag-class-page?
                          db (db-test/find-block-by-content db "plain")))))))

(deftest block-property-id-helpers
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:multi {:logseq.property/type :default
                                    :db/cardinality :db.cardinality/many}
                            :choice {:logseq.property/type :default
                                     :build/closed-values [{:value "A" :uuid (random-uuid)}]}
                            :plain {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:multi #{"x" "y"}}}]}]})
        db @conn
        block (db-test/find-block-by-content db "b1")]
    (is (= [:user.property/multi] (vec (worker-property/direct-block-property-ids db (:db/id block))))
        "a many property with two values is listed once")
    (is (= [:user.property/multi]
           (worker-property/block-property-keys db [:block/uuid (:block/uuid block)])))
    (is (true? (#'worker-property/property-has-closed-values? db (d/entity db :user.property/choice))))
    (is (false? (#'worker-property/property-has-closed-values? db (d/entity db :user.property/plain))))))

(deftest block-positioned-property-idents-include-empty-class-properties-and-sort
  (let [page-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:rel {:logseq.property/type :node}
                            :zeta {:logseq.property/type :node
                                   :block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                                   :build/keep-uuid? true}
                            :alpha {:logseq.property/type :node
                                    :block/uuid #uuid "00000000-0000-0000-0000-000000000002"
                                    :build/keep-uuid? true}}
               :classes {:C5 {:build/class-properties [:rel]}}
               :pages-and-blocks
               [{:page {:block/title "target page" :block/uuid page-uuid :build/keep-uuid? true}}
                {:page {:block/title "page"}
                 :blocks [{:block/title "class member" :build/tags [:C5]}
                          {:block/title "two own"
                           :build/properties {:zeta [:block/uuid page-uuid]
                                              :alpha [:block/uuid page-uuid]}}]}]})
        db @conn
        member (db-test/find-block-by-content db "class member")
        two-own (db-test/find-block-by-content db "two own")]
    (is (= [:user.property/rel]
           (worker-property/block-positioned-property-idents db (:db/id member) :block-below))
        "an empty class property is shown below the block")
    (is (= [:user.property/zeta :user.property/alpha]
           (worker-property/block-positioned-property-idents db (:db/id two-own) :block-below))
        "positioned idents follow the property order, not the attribute order")
    (is (vector? (worker-property/block-positioned-properties db (:db/id two-own) :block-below)))
    (is (= 2 (count (worker-property/block-positioned-properties db (:db/id two-own) :block-below))))))

(deftest sort-by-order-recursive-replaces-reverse-parent-with-sorted-children
  (let [result (#'worker-property/sort-by-order-recursive
                [{:db/id 1 :block/_parent [{:block/order "b" :db/id 3} {:block/order "a" :db/id 2}]}])]
    (is (= [{:db/id 1 :block/children [{:block/order "a" :db/id 2} {:block/order "b" :db/id 3}]}]
           result))))

(deftest get-all-properties-orders-filters-and-titles
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:zzz {:logseq.property/type :default :block/title "Zzz title"}}
               :pages-and-blocks [{:page {:block/title "page"}}]})
        _ (d/transact! conn [{:db/ident :plugin.property.demo/aaa
                              :block/title "AAA"
                              :block/name "aaa"
                              :block/uuid (random-uuid)
                              :block/tags :logseq.class/Property
                              :logseq.property/type :default}
                             {:db/ident :user.property/untitled
                              :block/name "untitled"
                              :block/uuid (random-uuid)
                              :block/tags :logseq.class/Property
                              :logseq.property/type :default}])
        db @conn
        page (db-test/find-page-by-title db "page")
        idents (fn [opts] (mapv :db/ident (worker-property/get-all-properties db opts)))
        by-ident (fn [opts] (into {} (map (juxt :db/ident identity))
                                  (worker-property/get-all-properties db opts)))]
    (testing "plugin properties sort after user properties"
      (is (= :plugin.property.demo/aaa (last (idents {})))))
    (testing "display titles"
      (let [m (by-ident {})]
        (is (= "Zzz title" (:block/raw-title (get m :user.property/zzz))))
        (is (= "untitled" (:block/raw-title (get m :user.property/untitled)))
            "a property without a title is named by its :block/name")))
    (testing "a live property has no deleted-at key"
      (d/transact! conn [{:db/ident :user.property/zzz
                          :logseq.property/description {:block/uuid (random-uuid) :block/title "About zzz"}}])
      (let [m (get (into {} (map (juxt :db/ident identity))
                         (worker-property/get-all-properties @conn {}))
                   :user.property/zzz)]
        (is (some? (:logseq.property/description m)))
        (is (not (contains? m :logseq.property/deleted-at)))))
    (testing "non queryable built-in properties can be removed"
      (let [result-idents (idents {:remove-built-in-property? false
                                   :remove-non-queryable-built-in-property? true})
            built-in-idents (filter #(entity-util/built-in? (d/entity db %)) result-idents)]
        (is (seq built-in-idents))
        (is (every? #(:queryable? (db-property/built-in-properties %)) built-in-idents))
        (is (some #{:user.property/zzz} result-idents))
        (is (> (count (idents {:remove-built-in-property? false}))
               (count result-idents)))))
    (testing "properties unsuitable for the ui can be removed"
      (let [all (idents {:remove-built-in-property? false})
            suitable (idents {:remove-built-in-property? false
                              :remove-ui-non-suitable-properties? true
                              :block page})]
        (is (some #{:logseq.property/query} all))
        (is (not (some #{:logseq.property/query} suitable)))
        (is (some #{:user.property/zzz} suitable))))
    (testing "class schema hides public built-in properties that have a view context"
      (let [opts {:remove-built-in-property? false
                  :remove-ui-non-suitable-properties? true
                  :block page}]
        (is (some #{:block/alias} (idents opts)))
        (is (not (some #{:block/alias} (idents (assoc opts :class-schema? true)))))))))

(deftest scheduled-and-deadline-blocks-skip-done-and-canceled
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "todo item"}
                                            {:block/title "done item"}
                                            {:block/title "canceled item"}]}]})
        db @conn
        id-of #(:db/id (db-test/find-block-by-content db %))
        _ (d/transact! conn [{:db/id (id-of "todo item") :logseq.property/scheduled 1000
                              :logseq.property/status :logseq.property/status.todo}
                             {:db/id (id-of "done item") :logseq.property/scheduled 1000
                              :logseq.property/status :logseq.property/status.done}
                             {:db/id (id-of "canceled item") :logseq.property/deadline 1000
                              :logseq.property/status :logseq.property/status.canceled}])
        result (#'worker-property/get-date-scheduled-or-deadlines @conn 0 2000)
        [page blocks] (first result)]
    (is (= 1 (count result)))
    (is (= #{:db/id :block/title :block/uuid} (set (keys page))))
    (is (= "page" (:block/title page)))
    (is (= ["todo item"] (mapv :block/title blocks)))))
