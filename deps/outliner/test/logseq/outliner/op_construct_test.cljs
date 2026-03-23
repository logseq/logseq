(ns logseq.outliner.op-construct-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op.construct :as op-construct]))

(defn- run-direct-outdent
  [conn block]
  (let [{:keys [tx-data]}
        (#'outliner-core/indent-outdent-blocks
         conn [block] false
         :parent-original nil
         :logical-outdenting? nil)
        tx-report (d/with @conn tx-data {})]
    {:tx-data (:tx-data tx-report)
     :db-after (:db-after tx-report)}))

(deftest derive-history-outliner-ops-canonicalizes-create-page-and-builds-delete-inverse-test
  (testing "create-page forward op keeps created uuid and reverse op deletes that page"
    (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
          page-uuid (random-uuid)
          tx-data [{:e 1 :a :block/title :v "Created Page" :added true}
                   {:e 1 :a :block/uuid :v page-uuid :added true}]
          tx-meta {:outliner-op :create-page
                   :outliner-ops [[:create-page ["Created Page"
                                                 {:redirect? false
                                                  :split-namespace? true
                                                  :tags ()}]]]}
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn tx-data tx-meta)]
      (is (= :create-page (ffirst forward-outliner-ops)))
      (is (= page-uuid (get-in forward-outliner-ops [0 1 1 :uuid])))
      (is (= [[:delete-page [page-uuid {}]]]
             inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-collapses-mixed-stream-to-transact-placeholder-test
  (testing "mixed semantic/non-semantic ops collapse to transact placeholder"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "child"}]}]})
          child (db-test/find-block-by-content @conn "child")
          tx-meta {:outliner-op :save-block
                   :outliner-ops [[:save-block [{:block/uuid (:block/uuid child)
                                                 :block/title "changed"} {}]]
                                  [:transact nil]]}
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)]
      (is (= op-construct/canonical-transact-op forward-outliner-ops))
      (is (nil? inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-handles-replace-empty-target-insert-inverse-test
  (testing "replace-empty-target insert reverses with delete child + restore target save"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title ""}]}]})
          empty-target (db-test/find-block-by-content @conn "")
          parent-uuid (random-uuid)
          child-uuid (random-uuid)
          tx-meta {:outliner-op :insert-blocks
                   :outliner-ops [[:insert-blocks [[{:block/uuid parent-uuid
                                                     :block/title "paste parent"}
                                                    {:block/uuid child-uuid
                                                     :block/title "paste child"
                                                     :block/parent [:block/uuid parent-uuid]}]
                                                   (:db/id empty-target)
                                                   {:sibling? true
                                                    :replace-empty-target? true
                                                    :outliner-op :paste}]]]}
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)]
      (is (= (:block/uuid empty-target)
             (get-in forward-outliner-ops [0 1 0 0 :block/uuid])))
      (is (= true (get-in forward-outliner-ops [0 1 2 :keep-uuid?])))
      (is (some #(and (= :delete-blocks (first %))
                      (= [[:block/uuid child-uuid]] (get-in % [1 0])))
                inverse-outliner-ops))
      (is (some #(and (= :save-block (first %))
                      (= (:block/uuid empty-target) (get-in % [1 0 :block/uuid]))
                      (= "" (get-in % [1 0 :block/title])))
                inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-builds-upsert-property-inverse-delete-page-test
  (testing "upsert-property with qualified keyword builds delete-page inverse"
    (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
          property-id :user.property/custom-prop
          tx-meta {:outliner-op :upsert-property
                   :outliner-ops [[:upsert-property [property-id
                                                     {:logseq.property/type :default}
                                                     {:property-name "custom-prop"}]]]}
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)
          expected-page-uuid (common-uuid/gen-uuid :db-ident-block-uuid property-id)]
      (is (= [[:delete-page [expected-page-uuid {}]]]
             inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-builds-inverse-for-all-supported-ops-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:c1 {:build/class-properties [:p1]}}
               :properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "parent"
                           :build/children [{:block/title "child-a"}
                                            {:block/title "child-b"}]}
                          {:block/title "prop-block-1"
                           :build/properties {:p1 "before-1"}}
                          {:block/title "prop-block-2"}]}]})
        page (db-test/find-page-by-title @conn "page")
        parent (db-test/find-block-by-content @conn "parent")
        child-a (db-test/find-block-by-content @conn "child-a")
        child-b (db-test/find-block-by-content @conn "child-b")
        prop-block-1 (db-test/find-block-by-content @conn "prop-block-1")
        prop-block-2 (db-test/find-block-by-content @conn "prop-block-2")
        class-id (:db/id (d/entity @conn :user.class/c1))
        class-uuid (:block/uuid (d/entity @conn class-id))
        property-id (:db/id (d/entity @conn :user.property/p1))
        property-page-uuid (:block/uuid (d/entity @conn property-id))
        prop-value-1-id (:db/id (:user.property/p1 prop-block-1))]
    (testing ":save-block"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :save-block
                             :outliner-ops [[:save-block [{:block/uuid (:block/uuid child-a)
                                                           :block/title "changed"} {}]]]})]
        (is (= :save-block (ffirst inverse-outliner-ops)))
        (is (= "child-a" (get-in inverse-outliner-ops [0 1 0 :block/title])))))

    (testing ":insert-blocks"
      (let [inserted-uuid (random-uuid)
            {:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :insert-blocks
                             :outliner-ops [[:insert-blocks [[{:block/uuid inserted-uuid
                                                               :block/title "new"}]
                                                             (:db/id parent)
                                                             {:sibling? false}]]]})]
        (is (= [[:delete-blocks [[[:block/uuid inserted-uuid]] {}]]]
               inverse-outliner-ops))))

    (testing ":move-blocks"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :move-blocks
                             :outliner-ops [[:move-blocks [[(:db/id child-b)]
                                                           (:db/id parent)
                                                           {:sibling? false}]]]})]
        (is (= :move-blocks (ffirst inverse-outliner-ops)))
        (is (= [[:block/uuid (:block/uuid child-b)]]
               (get-in inverse-outliner-ops [0 1 0])))))

    (testing ":delete-blocks"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :delete-blocks
                             :outliner-ops [[:delete-blocks [[(:db/id child-b)] {}]]]})]
        (is (= :insert-blocks (ffirst inverse-outliner-ops)))
        (is (= (:block/uuid child-b)
               (get-in inverse-outliner-ops [0 1 0 0 :block/uuid])))))

    (testing ":create-page"
      (let [page-uuid (random-uuid)
            tx-data [{:e 1 :a :block/title :v "P2" :added true}
                     {:e 1 :a :block/uuid :v page-uuid :added true}]
            {:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn tx-data {:outliner-op :create-page
                                  :outliner-ops [[:create-page ["P2" {:redirect? false}]]]})]
        (is (= [[:delete-page [page-uuid {}]]]
               inverse-outliner-ops))))

    (testing ":delete-page"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :delete-page
                             :outliner-ops [[:delete-page [(:block/uuid page) {}]]]})]
        (is (= [[:restore-recycled [(:block/uuid page)]]]
               inverse-outliner-ops))))

    (testing ":set-block-property"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :set-block-property
                             :outliner-ops [[:set-block-property [(:db/id prop-block-1)
                                                                  :user.property/p1
                                                                  "new-value"]]]})]
        (is (= :set-block-property (ffirst inverse-outliner-ops)))
        (is (= [:block/uuid (:block/uuid prop-block-1)]
               (get-in inverse-outliner-ops [0 1 0])))
        (is (= :user.property/p1 (get-in inverse-outliner-ops [0 1 1])))
        (is (= prop-value-1-id (get-in inverse-outliner-ops [0 1 2 :db/id])))))

    (testing ":remove-block-property"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :remove-block-property
                             :outliner-ops [[:remove-block-property [(:db/id prop-block-1)
                                                                     :user.property/p1]]]})]
        (is (= :set-block-property (ffirst inverse-outliner-ops)))
        (is (= [:block/uuid (:block/uuid prop-block-1)]
               (get-in inverse-outliner-ops [0 1 0])))
        (is (= :user.property/p1 (get-in inverse-outliner-ops [0 1 1])))
        (is (= prop-value-1-id (get-in inverse-outliner-ops [0 1 2 :db/id])))))

    (testing ":batch-set-property"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :batch-set-property
                             :outliner-ops [[:batch-set-property [[(:db/id prop-block-1)
                                                                   (:db/id prop-block-2)]
                                                                  :user.property/p1
                                                                  "new-value"
                                                                  {}]]]})]
        (is (= 2 (count inverse-outliner-ops)))
        (is (= :set-block-property (ffirst inverse-outliner-ops)))
        (is (= :remove-block-property (ffirst (rest inverse-outliner-ops))))))

    (testing ":batch-remove-property"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :batch-remove-property
                             :outliner-ops [[:batch-remove-property [[(:db/id prop-block-1)
                                                                      (:db/id prop-block-2)]
                                                                     :user.property/p1]]]})]
        (is (= 1 (count inverse-outliner-ops)))
        (is (= :set-block-property (ffirst inverse-outliner-ops)))
        (is (= [:block/uuid (:block/uuid prop-block-1)]
               (get-in inverse-outliner-ops [0 1 0])))
        (is (= :user.property/p1 (get-in inverse-outliner-ops [0 1 1])))
        (is (= prop-value-1-id (get-in inverse-outliner-ops [0 1 2 :db/id])))))

    (testing ":class-add-property"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :class-add-property
                             :outliner-ops [[:class-add-property [class-id property-id]]]})]
        (is (= [[:class-remove-property [[:block/uuid class-uuid]
                                         [:block/uuid property-page-uuid]]]]
               inverse-outliner-ops))))

    (testing ":class-remove-property"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :class-remove-property
                             :outliner-ops [[:class-remove-property [class-id property-id]]]})]
        (is (= [[:class-add-property [[:block/uuid class-uuid]
                                      [:block/uuid property-page-uuid]]]]
               inverse-outliner-ops))))

    (testing ":upsert-property"
      (let [property-ident :user.property/test-inverse
            expected-page-uuid (common-uuid/gen-uuid :db-ident-block-uuid property-ident)
            {:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :upsert-property
                             :outliner-ops [[:upsert-property [property-ident
                                                               {:logseq.property/type :default}
                                                               {:property-name "test-inverse"}]]]})]
        (is (= [[:delete-page [expected-page-uuid {}]]]
               inverse-outliner-ops))))))

(deftest build-history-action-metadata-direct-outdent-builds-move-forward-and-inverse-test
  (testing "direct outdent on last sibling canonicalizes to move-blocks and builds inverse move"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child-1"}
                                              {:block/title "child-2"}
                                              {:block/title "child-3"}]}]}]})
          child-2 (db-test/find-block-by-content @conn "child-2")
          child-3 (db-test/find-block-by-content @conn "child-3")
          parent (db-test/find-block-by-content @conn "parent")
          {:keys [tx-data db-after]} (run-direct-outdent conn child-3)
          tx-meta {:outliner-op :move-blocks
                   :outliner-ops [[:indent-outdent-blocks [[(:db/id child-3)]
                                                           false
                                                           {:parent-original nil
                                                            :logical-outdenting? nil}]]]}
          {:keys [db-sync/forward-outliner-ops db-sync/inverse-outliner-ops]}
          (op-construct/build-history-action-metadata
           {:db-before @conn
            :db-after db-after
            :tx-data tx-data
            :tx-meta tx-meta})]
      (is (= [[:move-blocks [[[:block/uuid (:block/uuid child-3)]]
                             [:block/uuid (:block/uuid parent)]
                             {:parent-original nil
                              :logical-outdenting? nil
                              :sibling? true}]]]
             forward-outliner-ops))
      (is (= [[:move-blocks [[[:block/uuid (:block/uuid child-3)]]
                             [:block/uuid (:block/uuid child-2)]
                             {:sibling? true}]]]
             inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-direct-outdent-with-extra-moved-blocks-falls-back-to-transact-test
  (testing "direct outdent touching non-selected block ids remains transact placeholder"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child-1"}
                                              {:block/title "child-2"}
                                              {:block/title "child-3"}]}]}]})
          child-2 (db-test/find-block-by-content @conn "child-2")
          {:keys [tx-data db-after]} (run-direct-outdent conn child-2)
          tx-meta {:outliner-op :move-blocks
                   :outliner-ops [[:indent-outdent-blocks [[(:db/id child-2)]
                                                           false
                                                           {:parent-original nil
                                                            :logical-outdenting? nil}]]]}
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn db-after tx-data tx-meta)]
      (is (= op-construct/canonical-transact-op forward-outliner-ops))
      (is (nil? inverse-outliner-ops)))))

(deftest build-history-action-metadata-non-semantic-outliner-op-does-not-throw-test
  (testing "non-semantic outliner-op with transact placeholder should not fail strict semantic validation"
    (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
          tx-meta {:outliner-op :restore-recycled
                   :outliner-ops [[:transact nil]]}
          result (op-construct/build-history-action-metadata
                  {:db-before @conn
                   :db-after @conn
                   :tx-data []
                   :tx-meta tx-meta})]
      (is (= op-construct/canonical-transact-op
             (:db-sync/forward-outliner-ops result)))
      (is (nil? (:db-sync/inverse-outliner-ops result))))))
