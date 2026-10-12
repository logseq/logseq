(ns frontend.worker.db.validate-mutation2-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(def ^:private initial-graph-db
  (delay
    (d/db-with (d/empty-db db-schema/schema)
               (sqlite-create-graph/build-db-initial-data ""))))

(defn- graph-conn
  []
  (d/conn-from-db @initial-graph-db))

(defn- add-entity!
  "The entity id of the new entity built from the map m."
  [conn m]
  (get (:tempids (d/transact! conn [(assoc m :db/id "e")])) "e"))

(defn- root-id
  [conn]
  (:db/id (d/entity @conn :logseq.class/Root)))

(defn- fix-tx
  "The tx-data fix-invalid-blocks! transacts for the entity eid reported with
  dispatch-key, or nil when it transacts nothing."
  [conn eid dispatch-key]
  (let [captured (atom nil)]
    (with-redefs [ldb/transact! (fn [_conn tx-data _opts] (reset! captured (vec tx-data)) nil)]
      (#'worker-db-validate/fix-invalid-blocks! conn [{:entity {:db/id eid} :dispatch-key dispatch-key}]))
    @captured))

(deftest fix-invalid-blocks-retracts-stray-attributes-test
  (doseq [[attr value] [[:logseq.property/parent :root]
                        [:hide? true]
                        [:public? true]
                        [:block/pre-block? true]
                        [:logseq.property.embedding/hnsw-label "label"]
                        [:logseq.property.embedding/hnsw-label-updated-at 1]
                        [:block/level 1]
                        [:block/format :markdown]]]
    (let [conn (graph-conn)
          eid (add-entity! conn {attr (if (= :root value) (root-id conn) value)})]
      (is (= [[:db/retract eid attr]] (fix-tx conn eid :other)) (str attr)))))

(deftest fix-invalid-blocks-deletes-legacy-hnsw-label-property-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:db/ident :logseq.property.embedding/hnsw-label})]
    (is (= [[:db/retractEntity :logseq.property.embedding/hnsw-label]]
           (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-order-of-classes-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/tags :logseq.class/Tag
                               :db/ident :user.class/ordered
                               :block/title "ordered"
                               :block/order "a0"
                               :logseq.property.class/extends (root-id conn)})]
    (is (= [[:db/retract eid :block/order]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-name-of-non-pages-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/name "stray" :block/title "stray"})]
    (is (= [[:db/retract eid :block/name]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-fills-missing-updated-at-of-normal-pages-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/name "p" :block/title "p" :block/tags :logseq.class/Page
                               :block/created-at 5})]
    (is (= [[:db/add eid :block/updated-at 5]] (fix-tx conn eid :normal-page)))
    (is (nil? (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-deletes-external-url-without-tags-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/title "External URL"})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-removes-tag-class-from-properties-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:db/ident :user.property/tagged
                               :block/name "tagged" :block/title "tagged"
                               :block/tags #{:logseq.class/Property :logseq.class/Tag}})]
    (is (= [[:db/retract eid :block/tags :logseq.class/Tag]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-turns-user-class-namespace-idents-into-tags-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:db/ident :user.class/untagged
                               :block/title "untagged" :block/parent (root-id conn)})]
    (is (= [[:db/add eid :block/tags :logseq.class/Tag]
            [:db/retract eid :block/tags :logseq.class/Page]]
           (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-kv-value-of-classes-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/tags :logseq.class/Tag :db/ident :user.class/kv
                               :block/title "kv" :block/parent (root-id conn)
                               :logseq.property.class/extends (root-id conn)
                               :kv/value 1})]
    (is (= [[:db/retract eid :kv/value]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-extends-of-properties-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/tags :logseq.class/Property :db/ident :user.property/ext
                               :block/title "ext" :block/name "ext"
                               :logseq.property.class/extends root})]
    (is (= [[:db/retract eid :logseq.property.class/extends root]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-adds-ident-to-classes-without-one-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/tags :logseq.class/Tag :block/title "My Class"
                               :block/parent (root-id conn)
                               :logseq.property.class/extends (root-id conn)})]
    (is (= [[:db/add eid :db/ident (db-class/create-user-class-ident-from-name @conn "My Class")]]
           (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-moves-description-property-values-under-their-property-test
  (let [conn (graph-conn)
        property-id (add-entity! conn {:block/title "description"})
        eid (add-entity! conn {:logseq.property/created-from-property property-id
                               :block/title "value" :block/parent (root-id conn)})]
    (is (= [[:db/add eid :block/page property-id]
            [:db/add eid :block/parent property-id]]
           (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-parent-of-built-in-idents-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:db/ident :logseq.test/built-in :logseq.property/built-in? true
                               :block/parent (root-id conn) :block/title "built-in"})]
    (is (= [[:db/retract eid :block/parent]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-deletes-whiteboard-shapes-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:logseq.property/ls-type :whiteboard-shape
                               :block/title "shape" :block/parent (root-id conn)})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-gives-pages-without-parent-their-page-as-parent-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/title "orphan" :block/page root})]
    (is (= [[:db/add eid :block/parent root]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-gives-blocks-without-uuid-one-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/title "no uuid" :block/page root :block/parent root
                               :block/order "a0" :block/created-at 1 :block/updated-at 1})
        tx (fix-tx conn eid :other)]
    (is (= 1 (count tx)))
    (is (= [:db/add eid :block/uuid] (subvec (first tx) 0 3)))
    (is (uuid? (nth (first tx) 3)))))

(deftest fix-invalid-blocks-deletes-entities-with-vector-values-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:logseq.property/value [1 2]
                               :block/title "v" :block/parent (root-id conn)})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-deletes-revised-entities-without-title-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/tx-id 1 :block/page root :block/parent root})
        no-tx-id (add-entity! conn {:block/updated-at 1 :block/page root :block/parent root})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))
    (is (nil? (fix-tx conn no-tx-id :other)))))

(deftest fix-invalid-blocks-leaves-complete-blocks-and-pages-alone-test
  (let [conn (graph-conn)
        root (root-id conn)
        with-uuid (add-entity! conn {:block/uuid (random-uuid) :block/title "ok" :block/page root
                                     :block/parent root :block/order "a0"
                                     :block/created-at 1 :block/updated-at 1})
        without-page (add-entity! conn {:block/title "no page" :block/parent root :block/order "a0"
                                        :block/created-at 1 :block/updated-at 1})
        parented-normal-page (add-entity! conn {:block/title "np" :block/parent root})
        built-in-user-class (add-entity! conn {:db/ident :user.class/builtin
                                               :logseq.property/built-in? true
                                               :block/name "builtin" :block/title "builtin"
                                               :block/tags :logseq.class/Page})]
    (is (nil? (fix-tx conn with-uuid :other)))
    (is (nil? (fix-tx conn without-page :other)))
    (is (nil? (fix-tx conn parented-normal-page :normal-page)))
    (is (nil? (fix-tx conn built-in-user-class :other)))))

(deftest fix-invalid-blocks-deletes-titled-entities-without-location-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/title "floating"})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-removes-path-refs-property-usages-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:db/ident :block/path-refs})
        user (add-entity! conn {:block/title "u" :block/page root :block/parent root :block/path-refs root})]
    (is (some #{[:db/retract user :block/path-refs]} (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-non-class-tags-test
  (let [conn (graph-conn)
        root (root-id conn)
        tag (add-entity! conn {:block/title "plain" :block/page root :block/parent root})
        eid (add-entity! conn {:block/title "t" :block/page root :block/parent root
                               :block/tags #{tag :logseq.class/Task}})]
    (is (= [[:db/retract eid :block/tags tag]] (vec (fix-tx conn eid :other))))))

(deftest fix-invalid-blocks-handles-normal-pages-with-page-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/title "np" :block/page root :block/parent root})]
    (is (= [[:db/retract eid :block/page]] (fix-tx conn eid :normal-page)))))

(deftest fix-invalid-blocks-deletes-titleless-blocks-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/page root :block/parent root})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :block)))))

(deftest fix-invalid-blocks-places-blocks-without-page-test
  (let [conn (graph-conn)
        root (root-id conn)
        page (add-entity! conn {:block/title "pg" :block/page root :block/parent root})
        grandparent (add-entity! conn {:block/title "gp" :block/page page :block/parent page})
        parent (add-entity! conn {:block/title "parent" :block/page page :block/parent grandparent})
        eid (add-entity! conn {:block/title "child" :block/parent parent})]
    (is (= [[:db/add eid :block/page page]] (fix-tx conn eid :block)))))

(deftest fix-invalid-blocks-places-blocks-without-page-under-latest-journal-test
  (let [conn (graph-conn)
        journal (add-entity! conn {:block/title "Oct 12th, 2026" :block/name "oct 12th, 2026"
                                   :block/journal-day 20261012 :block/tags :logseq.class/Journal})
        parent (add-entity! conn {:block/title "parent"})
        eid (add-entity! conn {:block/title "child" :block/parent parent})]
    (is (= [[:db/add eid :block/page journal]
            [:db/add eid :block/parent journal]]
           (fix-tx conn eid :block)))))

(deftest fix-invalid-blocks-deletes-entities-without-location-test
  (let [conn (graph-conn)
        eid (add-entity! conn {:block/uuid (random-uuid)})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-retracts-title-of-property-value-blocks-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/title "pv" :block/page root :block/parent root})]
    (is (= [[:db/retract eid :block/title]] (fix-tx conn eid :property-value-block)))
    (is (nil? (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-gives-classes-the-root-class-as-parent-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/tags :logseq.class/Tag :db/ident :user.class/noext
                               :block/title "noext" :block/parent root})]
    (is (= [[:db/add eid :logseq.property.class/extends :logseq.class/Root]] (fix-tx conn eid :other)))
    (is (nil? (fix-tx conn root :other)))))

(deftest fix-invalid-blocks-removes-page-tag-from-internal-page-classes-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/tags #{:logseq.class/Tag :logseq.class/Page}
                               :db/ident :user.class/paged
                               :block/title "paged" :block/parent root
                               :logseq.property.class/extends root})]
    (is (= [[:db/retract eid :block/tags :logseq.class/Page]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-deletes-remote-assets-without-type-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:logseq.property.asset/remote-metadata {:size 1}
                               :block/title "asset" :block/page root :block/parent root})]
    (is (= [[:db/retractEntity eid]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-rewrites-user-class-sized-columns-test
  (let [conn (graph-conn)
        root (root-id conn)
        _property (add-entity! conn {:db/ident :user.property/foo :block/name "foo" :block/title "Foo"
                                     :block/tags :logseq.class/Property})
        _class (add-entity! conn {:db/ident :user.class/foo :block/name "foo-class" :block/title "Foo"
                                  :block/tags :logseq.class/Tag
                                  :logseq.property.class/extends root})
        eid (add-entity! conn {:block/title "table" :block/page root :block/parent root
                               :logseq.property.table/sized-columns {:user.class/foo 100
                                                                     :block/title 50}})]
    (is (= [[:db/add eid :logseq.property.table/sized-columns {:user.property/foo 100
                                                               :block/title 50}]]
           (fix-tx conn eid :block)))))

(deftest fix-invalid-blocks-retracts-temp-attributes-test
  (let [conn (graph-conn)
        root (root-id conn)
        eid (add-entity! conn {:block/title "tmp" :block/page root :block/parent root
                               :block.temp/ast-title "x"})]
    (is (= [[:db/retract eid :block.temp/ast-title]] (fix-tx conn eid :other)))))

(deftest fix-invalid-blocks-moves-class-references-to-matching-properties-test
  (let [conn (graph-conn)
        root (root-id conn)
        property (add-entity! conn {:db/ident :user.property/foo :block/name "foo" :block/title "Foo"
                                    :block/tags :logseq.class/Property})
        class-with-property (add-entity! conn {:db/ident :user.class/foo :block/name "foo-class"
                                               :block/title "Foo" :block/tags :logseq.class/Tag
                                               :logseq.property.class/extends root})
        class-without-property (add-entity! conn {:db/ident :user.class/bar :block/name "bar-class"
                                                  :block/title "Bar" :block/tags :logseq.class/Tag
                                                  :logseq.property.class/extends root})
        group-by-view (add-entity! conn {:logseq.property.view/group-by-property class-with-property})
        pinned-view (add-entity! conn {:logseq.property.table/pinned-columns class-without-property})
        captured (atom nil)]
    (with-redefs [ldb/transact! (fn [_conn tx-data opts] (reset! captured [(vec tx-data) opts]) nil)]
      (#'worker-db-validate/fix-invalid-blocks! conn []))
    (is (= [[[:db/retract group-by-view :logseq.property.view/group-by-property class-with-property]
             [:db/add group-by-view :logseq.property.view/group-by-property property]
             [:db/retract pinned-view :logseq.property.table/pinned-columns class-without-property]]
            {:fix-db? true}]
           @captured))))

(deftest fix-invalid-blocks-moves-user-class-attributes-to-matching-properties-test
  (let [conn (graph-conn)
        root (root-id conn)
        _property (add-entity! conn {:db/ident :user.property/foo :block/name "foo" :block/title "Foo"
                                     :block/tags :logseq.class/Property})
        _class (add-entity! conn {:db/ident :user.class/foo :block/name "foo-class" :block/title "Foo"
                                  :block/tags :logseq.class/Tag :logseq.property.class/extends root})
        _other-class (add-entity! conn {:db/ident :user.class/bar :block/name "bar-class" :block/title "Bar"
                                        :block/tags :logseq.class/Tag :logseq.property.class/extends root})
        with-matching (add-entity! conn {:user.class/foo 7})
        with-other (add-entity! conn {:user.class/bar 8})
        captured (atom nil)]
    (with-redefs [ldb/transact! (fn [_conn tx-data _opts] (reset! captured (vec tx-data)) nil)]
      (#'worker-db-validate/fix-invalid-blocks! conn []))
    (is (= #{[:db/retract with-matching :user.class/foo 7]
             [:db/add with-matching :user.property/foo 7]
             [:db/retract with-other :user.class/bar 8]}
           (set @captured)))
    (is (= 3 (count @captured)))))

(deftest fix-non-closed-values-retracts-values-outside-closed-values-test
  (let [conn (graph-conn)
        property (add-entity! conn {:db/ident :user.property/closed :block/name "closed" :block/title "closed"
                                    :block/tags :logseq.class/Property})
        allowed (add-entity! conn {:block/title "allowed" :block/closed-value-property property})
        stray (add-entity! conn {:block/title "stray"})
        placeholder (:db/id (d/entity @conn :logseq.property/empty-placeholder))
        with-allowed (add-entity! conn {:user.property/closed allowed})
        with-stray (add-entity! conn {:user.property/closed stray})
        with-placeholder (add-entity! conn {:user.property/closed placeholder})
        captured (atom nil)]
    (with-redefs [ldb/transact! (fn [_conn tx-data opts] (reset! captured [(vec tx-data) opts]) nil)]
      (#'worker-db-validate/fix-non-closed-values! conn))
    (is (some? with-allowed))
    (is (some? with-placeholder))
    (is (= [[[:db/retract with-stray :user.property/closed stray]] {:fix-db? true}]
           @captured))))

(deftest fix-icon-wrong-type-retracts-ref-type-and-icon-values-test
  (let [conn (graph-conn)
        icon (:db/id (d/entity @conn :logseq.property/icon))
        holder (add-entity! conn {:logseq.property/icon {:type :emoji :id "smile"}})
        captured (atom nil)]
    (with-redefs [ldb/transact! (fn [_conn tx-data opts] (reset! captured [(vec tx-data) opts]) nil)]
      (#'worker-db-validate/fix-icon-wrong-type! conn)
      (is (nil? @captured))
      (d/transact! conn [[:db/add icon :db/valueType :db.type/ref]])
      (#'worker-db-validate/fix-icon-wrong-type! conn))
    (let [[tx-data opts] @captured]
      (is (= {:fix-db? true} opts))
      (is (= [:db/retract icon :db/valueType] (first tx-data)))
      (is (some #{holder} (map second (rest tx-data))))
      (is (every? #(= [:db/retract :logseq.property/icon] [(first %) (nth % 2)]) (rest tx-data)))
      (is (= (set (map :e (d/datoms @conn :avet :logseq.property/icon)))
             (set (map second (rest tx-data))))))))

(deftest fix-extends-cardinality-sets-many-once-test
  (let [conn (graph-conn)
        extends (:db/id (d/entity @conn :logseq.property.class/extends))
        captured (atom nil)]
    (d/transact! conn [[:db/retract extends :db/cardinality :db.cardinality/many]])
    (with-redefs [ldb/transact! (fn [_conn tx-data opts] (reset! captured [(vec tx-data) opts]) nil)]
      (#'worker-db-validate/fix-extends-cardinality! conn)
      (is (= [[{:db/ident :logseq.property.class/extends
                :db/cardinality :db.cardinality/many
                :db/index true}]
              {:fix-db? true}]
             @captured))
      (reset! captured nil)
      (d/transact! conn [[:db/add extends :db/cardinality :db.cardinality/many]])
      (#'worker-db-validate/fix-extends-cardinality! conn)
      (is (nil? @captured)))))

(deftest fix-missing-internal-page-parent-orders-advances-order-allocator-test
  (let [conn (graph-conn)
        child-uuid (random-uuid)]
    (d/transact! conn [{:db/id "parent"
                        :block/uuid (random-uuid)
                        :block/title "Country"
                        :block/name "country"
                        :block/tags :logseq.class/Page}
                       {:block/uuid (random-uuid)
                        :block/title "Overview"
                        :block/parent "parent"
                        :block/page "parent"
                        :block/order "bzz"}
                       {:block/uuid child-uuid
                        :block/title "Australia"
                        :block/name "australia"
                        :block/tags :logseq.class/Page
                        :block/parent "parent"}])
    (with-redefs [db-order/*max-key (atom "a0")]
      (#'worker-db-validate/fix-missing-internal-page-parent-orders! conn)
      (let [repaired-order (:block/order (d/entity @conn [:block/uuid child-uuid]))]
        (is (pos? (compare repaired-order "bzz")))
        (is (pos? (compare (db-order/gen-key) repaired-order)))))))

(deftest validate-db-reports-and-broadcasts-invalid-blocks-test
  (let [conn (graph-conn)
        root (root-id conn)
        invalid (add-entity! conn {:block/title "" :block/page root :block/parent root
                                   :block/order "a0" :block/created-at 1 :block/updated-at 2})
        broadcasts (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [k payload] (swap! broadcasts conj [k payload]))]
      (let [valid-result (worker-db-validate/validate-db (graph-conn) :fix false)
            result (worker-db-validate/validate-db conn :fix false)
            errors (:errors result)]
        (is (seq errors))
        (is (contains? valid-result :errors))
        (is (contains? valid-result :invalid-entity-ids))
        (is (some #{invalid} (:invalid-entity-ids result)))
        (is (= (vec (distinct (map #(:db/id (:entity %)) errors)))
               (vec (:invalid-entity-ids result))))
        (let [[_ _ notification-after-valid & _] @broadcasts
              invalid-broadcasts (take-last 2 @broadcasts)]
          (is (= :notification (first notification-after-valid)))
          (is (= [:log [:db-invalid :error {:msg "Validation errors" :errors errors}]]
                 (first invalid-broadcasts)))
          (is (= :notification (first (second invalid-broadcasts)))))))))
