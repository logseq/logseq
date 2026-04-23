(ns logseq.outliner.op-construct-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
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
                      (= [(:block/uuid empty-target)]
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

(deftest derive-history-outliner-ops-upsert-property-update-builds-schema-restore-inverse-test
  (testing "upsert-property on existing property builds inverse upsert-property restore op"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:p-many {:logseq.property/type :default}}
                 :pages-and-blocks []})
          property-id :user.property/p-many
          _ (d/transact! conn [[:db/add property-id :logseq.property/classes :logseq.class/Root]])
          before-property (d/entity @conn property-id)
          expected-schema (-> (db-property/get-property-schema (into {} before-property))
                              (update :logseq.property/classes
                                      (fn [classes]
                                        (some->> classes
                                                 (map (fn [class]
                                                        (if-let [class-uuid (:block/uuid class)]
                                                          [:block/uuid class-uuid]
                                                          (:db/ident class))))
                                                 set))))
          tx-meta {:outliner-op :upsert-property
                   :outliner-ops [[:upsert-property [property-id
                                                     {:logseq.property/type :node
                                                      :db/cardinality :many}
                                                     {}]]]}
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)]
      (is (= [[:upsert-property [property-id expected-schema {:property-name "p-many"}]]]
             inverse-outliner-ops))
      (is (every? (fn [class-ref]
                    (or (keyword? class-ref)
                        (and (vector? class-ref)
                             (= :block/uuid (first class-ref))
                             (uuid? (second class-ref)))))
                  (get-in inverse-outliner-ops [0 1 1 :logseq.property/classes]))))))

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
          (is (= parent-uuid
                 (get-in insert-op [1 1])))
          (is (= false (get-in insert-op [1 2 :sibling?])))
          (is (not= child-uuid
                    (get-in insert-op [1 1]))))))))

(deftest derive-history-outliner-ops-delete-blocks-with-stale-id-keeps-id-test
  (testing "delete-blocks derive-history keeps unresolved numeric ids in forward ops"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child"}]}]}]})
          child (db-test/find-block-by-content @conn "child")
          child-uuid (:block/uuid child)
          stale-id 99999999
          tx-meta {:outliner-op :delete-blocks
                   :outliner-ops [[:delete-blocks [[(:db/id child) stale-id] {}]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)]
      (is (= [[:delete-blocks [[child-uuid stale-id] {}]]]
             forward-outliner-ops)))))

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
      (is (= [[:delete-blocks [[child-uuid] {}]]]
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
      (is (= target-uuid
             (get-in forward-outliner-ops [0 1 1]))))))

(deftest derive-history-outliner-ops-save-block-resolves-retracted-ref-id-from-db-before-test
  (testing "save-block should canonicalize ref attrs using db-before when target ref is retracted in current tx"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "child"}]}]})
          child (db-test/find-block-by-content @conn "child")
          child-uuid (:block/uuid child)
          tag-uuid (random-uuid)
          _ (d/transact! conn [{:db/id -1
                                :block/uuid tag-uuid
                                :block/title "Tag"
                                :block/name "tag"
                                :block/tags :logseq.class/Tag}])
          tag-id (:db/id (d/entity @conn [:block/uuid tag-uuid]))
          tx-report (d/with @conn [[:db/retractEntity tag-id]] {})
          tx-meta {:outliner-op :save-block
                   :outliner-ops [[:save-block [{:block/uuid child-uuid
                                                 :block/tags #{tag-id}}
                                                {}]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn (:db-after tx-report) (:tx-data tx-report) tx-meta)]
      (is (= #{[:block/uuid tag-uuid]}
             (get-in forward-outliner-ops [0 1 0 :block/tags]))))))

(deftest derive-history-outliner-ops-insert-blocks-resolves-retracted-ref-id-from-tx-data-test
  (testing "insert-blocks should canonicalize block ref attrs when ref entity is retracted in current tx"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "target"}]}]})
          target (db-test/find-block-by-content @conn "target")
          target-id (:db/id target)
          tag-uuid (random-uuid)
          _ (d/transact! conn [{:db/id -1
                                :block/uuid tag-uuid
                                :block/title "Tag"
                                :block/name "tag"
                                :block/tags :logseq.class/Tag}])
          tag-id (:db/id (d/entity @conn [:block/uuid tag-uuid]))
          tx-report (d/with @conn [[:db/retractEntity tag-id]] {})
          tx-meta {:outliner-op :insert-blocks
                   :outliner-ops [[:insert-blocks [[{:block/uuid (random-uuid)
                                                     :block/title "new child"
                                                     :block/tags #{tag-id}}]
                                                   target-id
                                                   {:sibling? true}]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn (:db-after tx-report) (:tx-data tx-report) tx-meta)]
      (is (= #{[:block/uuid tag-uuid]}
             (get-in forward-outliner-ops [0 1 0 0 :block/tags]))))))

(deftest derive-history-outliner-ops-apply-template-undo-canonicalizes-template-block-refs-test
  (testing "apply-template undo explicit inverse should canonicalize nested template-block ref attrs"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "template"}
                            {:block/title "target"}]}]})
          template (db-test/find-block-by-content @conn "template")
          target (db-test/find-block-by-content @conn "target")
          template-uuid (:block/uuid template)
          target-uuid (:block/uuid target)
          inserted-uuid (random-uuid)
          tag-uuid (random-uuid)
          _ (d/transact! conn [{:db/id -1
                                :block/uuid tag-uuid
                                :block/title "Tag"
                                :block/name "tag"
                                :block/tags :logseq.class/Tag}])
          tag-id (:db/id (d/entity @conn [:block/uuid tag-uuid]))
          tx-report (d/with @conn [[:db/retractEntity tag-id]] {})
          tx-meta {:outliner-op :apply-template
                   :undo? true
                   :db-sync/inverse-outliner-ops
                   [[:apply-template [template-uuid
                                      target-uuid
                                      {:template-blocks [{:block/uuid inserted-uuid
                                                          :block/title "inserted"
                                                          :block/tags #{tag-id}}]
                                       :sibling? true}]]]}
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn (:db-after tx-report) (:tx-data tx-report) tx-meta)]
      (is (= #{[:block/uuid tag-uuid]}
             (get-in inverse-outliner-ops [0 1 2 :template-blocks 0 :block/tags]))))))

(deftest derive-history-outliner-ops-apply-template-captures-template-blocks-when-missing-in-op-test
  (testing "apply-template forward op should capture concrete template-blocks even if original op omitted them"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page"}
                   :blocks [{:block/title "template"
                             :build/children [{:block/title "template child 1"}
                                              {:block/title "template child 2"}]}
                            {:block/title "target"}]}]})
          template (db-test/find-block-by-content @conn "template")
          target (db-test/find-block-by-content @conn "target")
          inserted-child-1-uuid (random-uuid)
          inserted-child-2-uuid (random-uuid)
          tx-data [{:e 900001 :a :block/uuid :v inserted-child-1-uuid :added true}
                   {:e 900002 :a :block/uuid :v inserted-child-2-uuid :added true}]
          tx-meta {:outliner-op :apply-template
                   :outliner-ops [[:apply-template [(:db/id template)
                                                    (:db/id target)
                                                    {:sibling? true}]]]}
          {:keys [forward-outliner-ops]}
          (op-construct/derive-history-outliner-ops @conn @conn tx-data tx-meta)]
      (is (= :apply-template (ffirst forward-outliner-ops)))
      (is (= true (get-in forward-outliner-ops [0 1 2 :keep-uuid?])))
      (is (= [inserted-child-1-uuid inserted-child-2-uuid]
             (mapv :block/uuid (get-in forward-outliner-ops [0 1 2 :template-blocks])))))))

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
               (get-in today-insert-op [1 1])))
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
        child-b (db-test/find-block-by-content @conn "child-b")]
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
        (is (= [inserted-uuid]
               (vec (get-in inverse-outliner-ops [0 1 0]))))))

    (testing ":move-blocks"
      (let [{:keys [inverse-outliner-ops]}
            (op-construct/derive-history-outliner-ops
             @conn @conn [] {:outliner-op :move-blocks
                             :outliner-ops [[:move-blocks [[(:db/id child-b)]
                                                           (:db/id parent)
                                                           {:sibling? false}]]]})]
        (is (= :move-blocks (ffirst inverse-outliner-ops)))
        (is (= [(:block/uuid child-b)]
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
      (is (= [[:indent-outdent-blocks [[(:block/uuid child-3)]
                                       false
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             forward-outliner-ops))
      (is (= [[:indent-outdent-blocks [[(:block/uuid child-3)]
                                       true
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             inverse-outliner-ops)))))

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
      (is (= [[:indent-outdent-blocks [[(:block/uuid child-2)]
                                       false
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             forward-outliner-ops))
      (is (= [[:indent-outdent-blocks [[(:block/uuid child-2)]
                                       true
                                       {:parent-original nil
                                        :logical-outdenting? nil}]]]
             inverse-outliner-ops)))))
