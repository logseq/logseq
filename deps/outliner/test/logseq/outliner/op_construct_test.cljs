(ns logseq.outliner.op-construct-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
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
      (is (= [[:transact nil]] forward-outliner-ops))
      (is (nil? inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-handles-replace-empty-target-insert-inverse-test
  (testing "replace-empty-target insert keeps source uuid and inverse deletes target placeholder"
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
      (is (= parent-uuid
             (get-in forward-outliner-ops [0 1 0 0 :block/uuid])))
      (is (= true (get-in forward-outliner-ops [0 1 2 :keep-uuid?])))
      (is (some #(and (= :delete-blocks (first %))
                      (= [[:block/uuid (:block/uuid empty-target)]]
                         (vec (get-in % [1 0]))))
                (remove nil? inverse-outliner-ops)))
      (is (not-any? #(= :save-block (first %))
                    (remove nil? inverse-outliner-ops))))))

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

(deftest derive-history-outliner-ops-delete-blocks-inverse-avoids-self-target-test
  (testing "delete-blocks inverse falls back to parent target when left sibling resolves to self"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child"}]}]}]})
          child (db-test/find-block-by-content @conn "child")
          child-id (:db/id child)
          child-uuid (:block/uuid child)
          parent-uuid (some-> child :block/parent :block/uuid)
          tx-meta {:outliner-op :delete-blocks
                   :outliner-ops [[:delete-blocks [[child-id] {}]]]}]
      ;; Simulate stale sibling lookup returning the same entity as the deleted root.
      (with-redefs [ldb/get-left-sibling (fn [_] child)]
        (let [{:keys [inverse-outliner-ops]}
              (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)
              insert-op (first inverse-outliner-ops)]
          (is (= :insert-blocks (first insert-op)))
          (is (= [:block/uuid parent-uuid]
                 (get-in insert-op [1 1])))
          (is (= false (get-in insert-op [1 2 :sibling?])))
          (is (not= [:block/uuid child-uuid]
                    (get-in insert-op [1 1]))))))))

(deftest derive-history-outliner-ops-delete-blocks-with-stale-id-throws-test
  (testing "delete-blocks derive-history throws when semantic ids include numeric db/id"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child"}]}]}]})
          child (db-test/find-block-by-content @conn "child")
          stale-id 99999999
          tx-meta {:outliner-op :delete-blocks
                   :outliner-ops [[:delete-blocks [[(:db/id child) stale-id] {}]]]}]
      (is (thrown? js/Error
                   (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta))))))

(deftest derive-history-outliner-ops-delete-blocks-prefers-retracted-tx-data-ids-test
  (testing "delete-blocks derive-history should prefer tx-data retractEntity ids over stale selection ids"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child"}]}]}]})
          child (db-test/find-block-by-content @conn "child")
          child-id (:db/id child)
          child-uuid (:block/uuid child)
          stale-id 99999999
          tx-report (d/with @conn [[:db/retractEntity child-id]] {})
          tx-meta {:outliner-op :delete-blocks
                   :outliner-ops [[:delete-blocks [[child-id stale-id] {}]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn (:db-after tx-report) (:tx-data tx-report) tx-meta)]
      (is (= [[:delete-blocks [[[:block/uuid child-uuid]] {}]]]
             forward-outliner-ops)))))

(deftest derive-history-outliner-ops-move-blocks-resolves-target-id-from-tx-data-test
  (testing "move-blocks should resolve stale numeric target id using tx-data block uuid"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "child"}]}]})
          child (db-test/find-block-by-content @conn "child")
          stale-target-id 9999999
          target-uuid (random-uuid)
          tx-data [{:e stale-target-id :a :block/uuid :v target-uuid :added false}]
          tx-meta {:outliner-op :move-blocks
                   :outliner-ops [[:move-blocks [[(:db/id child)] stale-target-id {:sibling? true}]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn tx-data tx-meta)]
      (is (= [:block/uuid target-uuid]
             (get-in forward-outliner-ops [0 1 1]))))))

(deftest derive-history-outliner-ops-delete-closed-value-resolves-value-id-from-tx-data-test
  (testing "delete-closed-value should resolve stale numeric value block id using tx-data block uuid"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:status {:logseq.property/type :default}}
                 :pages-and-blocks []})
          property-page (d/entity @conn :user.property/status)
          property-id (:db/id property-page)
          stale-value-id 8888888
          value-uuid (random-uuid)
          tx-data [{:e stale-value-id :a :block/uuid :v value-uuid :added false}]
          tx-meta {:outliner-op :delete-closed-value
                   :outliner-ops [[:delete-closed-value [property-id stale-value-id]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn tx-data tx-meta)]
      (is (= [:block/uuid value-uuid]
             (get-in forward-outliner-ops [0 1 1]))))))

(deftest derive-history-outliner-ops-builds-delete-page-inverse-for-class-property-and-today-page-test
  (testing "delete-page inverse restores hard-retracted class/property/today pages with stable db/ident"
    (let [today (date-time-util/ms->journal-day (js/Date.))
          conn (db-test/create-conn-with-blocks
                {:classes {:Movie {}}
                 :properties {:rating {:logseq.property/type :number}}
                 :pages-and-blocks [{:page {:build/journal today}
                                     :blocks [{:block/title "today child"}]}]})
          class-page (ldb/get-page @conn "Movie")
          property-page (d/entity @conn :user.property/rating)
          today-page (db-test/find-journal-by-journal-day @conn today)
          today-child (db-test/find-block-by-content @conn "today child")
          class-inverse (:inverse-outliner-ops
                         (op-construct/derive-history-outliner-ops
                          @conn @conn [] {:outliner-op :delete-page
                                          :outliner-ops [[:delete-page [(:block/uuid class-page) {}]]]}))
          property-inverse (:inverse-outliner-ops
                            (op-construct/derive-history-outliner-ops
                             @conn @conn [] {:outliner-op :delete-page
                                             :outliner-ops [[:delete-page [(:block/uuid property-page) {}]]]}))
          today-inverse (:inverse-outliner-ops
                         (op-construct/derive-history-outliner-ops
                          @conn @conn [] {:outliner-op :delete-page
                                          :outliner-ops [[:delete-page [(:block/uuid today-page) {}]]]}))]
      (is (some #(= :create-page (first %)) class-inverse))
      (is (some #(= :save-block (first %)) class-inverse))
      (is (= (:db/ident class-page)
             (get-in (some #(when (= :save-block (first %)) %) class-inverse)
                     [1 0 :db/ident])))

      (is (some #(= :upsert-property (first %)) property-inverse))
      (is (some #(= :save-block (first %)) property-inverse))
      (is (= (:db/ident property-page)
             (get-in (some #(when (= :save-block (first %)) %) property-inverse)
                     [1 0 :db/ident])))

      (is (not-any? #(= :restore-recycled (first %)) today-inverse))
      (let [today-insert-op (some #(when (= :insert-blocks (first %)) %) today-inverse)]
        (is (some? today-insert-op))
        (is (= (:block/uuid today-page)
               (second (get-in today-insert-op [1 1]))))
        (is (= (:block/uuid today-child)
               (get-in today-insert-op [1 0 0 :block/uuid])))))))

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
        (is (= (:block/uuid child-a)
               (get-in inverse-outliner-ops [0 1 0 :block/uuid])))))

    (testing ":insert-blocks"
      (let [inserted-uuid (random-uuid)
            tx-data [{:e 999999 :a :block/uuid :v inserted-uuid :added true}]
            {:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn tx-data {:outliner-op :insert-blocks
                                  :outliner-ops [[:insert-blocks [[{:block/uuid inserted-uuid
                                                                    :block/title "new"}]
                                                                  (:db/id parent)
                                                                  {:sibling? false}]]]})]
        (is (= :delete-blocks (ffirst inverse-outliner-ops)))
        (is (= [[:block/uuid inserted-uuid]]
               (vec (get-in inverse-outliner-ops [0 1 0]))))))

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

(deftest build-history-action-metadata-direct-outdent-builds-indent-outdent-forward-and-inverse-test
  (testing "direct outdent keeps canonical indent-outdent forward and inverse ops"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child-1"}
                                              {:block/title "child-2"}
                                              {:block/title "child-3"}]}]}]})
          child-3 (db-test/find-block-by-content @conn "child-3")
          {:keys [tx-data db-after]} (run-direct-outdent conn child-3)
          tx-meta {:outliner-op :move-blocks
                   :outliner-ops [[:indent-outdent-blocks [[(:db/id child-3)]
                                                           false
                                                           {:parent-original nil
                                                            :logical-outdenting? nil}]]]}
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn db-after tx-data tx-meta)]
      (is (= [[:indent-outdent-blocks [[[:block/uuid (:block/uuid child-3)]]
                                       false
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             forward-outliner-ops))
      (is (= [[:indent-outdent-blocks [[[:block/uuid (:block/uuid child-3)]]
                                       true
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             inverse-outliner-ops)))))

(deftest derive-history-outliner-ops-property-history-blocks-undo-cleanup-test
  (testing ":set-block-property inverse deletes newly created property history blocks"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:pnum {:logseq.property/type :number
                                     :db/cardinality :db.cardinality/one}}
                 :pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "task"
                             :build/properties {:pnum 1}}]}]})
          block (db-test/find-block-by-content @conn "task")
          block-id (:db/id block)
          block-ref [:block/uuid (:block/uuid block)]
          property-id (:db/id (d/entity @conn :user.property/pnum))
          history-uuid (random-uuid)
          {:keys [db-after tx-data]}
          (d/with @conn
                  [[:db/add block-id :user.property/pnum 2]
                   {:db/id -1
                    :block/uuid history-uuid
                    :logseq.property.history/block block-id
                    :logseq.property.history/property property-id
                    :logseq.property.history/scalar-value 2}]
                  {})
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn
           db-after
           tx-data
           {:outliner-op :set-block-property
            :outliner-ops [[:set-block-property [block-id :user.property/pnum 2]]]})]
      (is (= :delete-blocks (ffirst inverse-outliner-ops)))
      (is (= #{[:block/uuid history-uuid]}
             (set (get-in inverse-outliner-ops [0 1 0]))))
      (is (= [:set-block-property [block-ref :user.property/pnum 1]]
             (second inverse-outliner-ops)))))

  (testing ":batch-set-property inverse deletes all newly created property history blocks"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:pnum {:logseq.property/type :number
                                     :db/cardinality :db.cardinality/one}}
                 :pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "task-1"
                             :build/properties {:pnum 1}}
                            {:block/title "task-2"}]}]})
          block-1 (db-test/find-block-by-content @conn "task-1")
          block-2 (db-test/find-block-by-content @conn "task-2")
          block-1-id (:db/id block-1)
          block-2-id (:db/id block-2)
          block-1-ref [:block/uuid (:block/uuid block-1)]
          block-2-ref [:block/uuid (:block/uuid block-2)]
          property-id (:db/id (d/entity @conn :user.property/pnum))
          history-uuid-1 (random-uuid)
          history-uuid-2 (random-uuid)
          {:keys [db-after tx-data]}
          (d/with @conn
                  [[:db/add block-1-id :user.property/pnum 2]
                   [:db/add block-2-id :user.property/pnum 2]
                   {:db/id -1
                    :block/uuid history-uuid-1
                    :logseq.property.history/block block-1-id
                    :logseq.property.history/property property-id
                    :logseq.property.history/scalar-value 2}
                   {:db/id -2
                    :block/uuid history-uuid-2
                    :logseq.property.history/block block-2-id
                    :logseq.property.history/property property-id
                    :logseq.property.history/scalar-value 2}]
                  {})
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn
           db-after
           tx-data
           {:outliner-op :batch-set-property
            :outliner-ops [[:batch-set-property [[block-1-id block-2-id]
                                                 :user.property/pnum
                                                 2
                                                 {}]]]})]
      (is (= :delete-blocks (ffirst inverse-outliner-ops)))
      (is (= #{[:block/uuid history-uuid-1]
               [:block/uuid history-uuid-2]}
             (set (get-in inverse-outliner-ops [0 1 0]))))
      (is (= [:set-block-property [block-1-ref :user.property/pnum 1]]
             (second inverse-outliner-ops)))
      (is (= [:remove-block-property [block-2-ref :user.property/pnum]]
             (nth inverse-outliner-ops 2))))))

(deftest derive-history-outliner-ops-direct-outdent-with-extra-moved-blocks-keeps-semantic-ops-test
  (testing "direct outdent keeps semantic indent-outdent op and inverse"
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
      (is (= [[:indent-outdent-blocks [[[:block/uuid (:block/uuid child-2)]]
                                       false
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             forward-outliner-ops))
      (is (= [[:indent-outdent-blocks [[[:block/uuid (:block/uuid child-2)]]
                                       true
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             inverse-outliner-ops)))))

(deftest build-history-action-metadata-non-semantic-outliner-op-does-not-throw-test
  (testing "non-semantic outliner-op with transact placeholder should not fail strict semantic validation"
    (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
          tx-meta {:outliner-op :restore-recycled
                   :outliner-ops [[:transact nil]]}
          result (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)]
      (is (= [[:transact nil]]
             (:forward-outliner-ops result)))
      (is (nil? (:inverse-outliner-ops result))))))
