(ns frontend.worker.db.metadata-cache-test
  (:require [clojure.string :as string]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.metadata-cache :as metadata-cache]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.handler.property :as property-handler]
            [logseq.db.test.helper :as db-test]))

(defn- conn-with-metadata
  [property-title class-title]
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:db/ident :logseq.class/Root}
                       {:db/ident :logseq.class/Property}
                       {:db/ident :logseq.class/Tag}
                       {:db/ident :user.property/color
                        :block/uuid (random-uuid)
                        :block/title property-title
                        :block/order "a"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :default
                        :db/cardinality :db.cardinality/one}
                       {:db/ident :user.class/Topic
                        :block/uuid (random-uuid)
                        :block/title class-title
                        :block/name (string/lower-case class-title)
                        :block/tags :logseq.class/Tag
                        :logseq.property.class/extends :logseq.class/Root
                        :logseq.property.class/properties :user.property/color}])
    conn))

(deftest metadata-cache-builds-immutable-property-and-class-indexes-test
  (metadata-cache/reset-for-tests!)
  (let [conn (conn-with-metadata "Color" "Topic")
        metadata (metadata-cache/build-metadata @conn)
        property (get-in metadata [:properties-by-ident :user.property/color])
        class (get-in metadata [:classes-by-ident :user.class/Topic])
        class-properties
        (:classes-properties
         (metadata-cache/block-class-properties
          metadata
          {:block/tags [(:db/id class)]}))]
    (is (= "Color" (:block/title property)))
    (is (integer? (:db/id property)))
    (is (= "Topic" (:block/title class)))
    (is (integer? (:db/id class)))
    (is (= :user.class/Topic
           (:db/ident (metadata-cache/class metadata (:db/id class)))))
    (is (= [:logseq.class/Root]
           (:extends class)))
    (is (= [:user.property/color]
           (:property-idents class)))
    (is (= [:user.property/color]
           (:all-property-idents class)))
    (is (= [:user.property/color]
           (mapv :db/ident class-properties)))))

(deftest metadata-cache-keeps-unordered-class-properties-after-ordered-properties-test
  (let [conn (conn-with-metadata "Color" "Topic")]
    (d/transact! conn
                 [{:db/ident :user.property/unordered
                   :block/uuid (random-uuid)
                   :block/title "Unordered"
                   :block/tags :logseq.class/Property
                   :logseq.property/type :default
                   :db/cardinality :db.cardinality/one}
                  [:db/add :user.class/Topic
                   :logseq.property.class/properties
                   :user.property/unordered]])
    (is (= [:user.property/color :user.property/unordered]
           (get-in (metadata-cache/build-metadata @conn)
                   [:classes-by-ident :user.class/Topic :property-idents])))))

(deftest metadata-cache-reuses-a-startup-entry-and-separates-graphs-test
  (metadata-cache/reset-for-tests!)
  (let [conn-a (conn-with-metadata "Color A" "Topic A")
        conn-b (conn-with-metadata "Color B" "Topic B")
        generation-a (metadata-cache/initialize! "repo-a" @conn-a)
        metadata-a (metadata-cache/metadata-for-db @conn-a)
        metadata-a-again (metadata-cache/metadata-for-db @conn-a)
        generation-b (metadata-cache/initialize! "repo-b" @conn-b)]
    (is (= 1 generation-a))
    (is (= 1 generation-b))
    (is (identical? metadata-a metadata-a-again))
    (is (= "Color A"
           (get-in metadata-a [:properties-by-ident :user.property/color :block/title])))
    (is (= "Color B"
           (get-in (metadata-cache/metadata-for-db @conn-b)
                   [:properties-by-ident :user.property/color :block/title])))
    (metadata-cache/clear! "repo-a")
    (is (not (identical? metadata-a
                         (metadata-cache/metadata-for-db @conn-a))))
    (is (= "Color B"
           (get-in (metadata-cache/metadata-for-db @conn-b)
                   [:properties-by-ident :user.property/color :block/title])))))

(deftest metadata-cache-rebuilds-an-evicted-active-graph-once-test
  (metadata-cache/reset-for-tests!)
  (let [conns (mapv (fn [index]
                      (conn-with-metadata (str "Color " index)
                                          (str "Topic " index)))
                    (range 9))
        first-db @(first conns)
        _ (metadata-cache/initialize! "repo-0" first-db)
        first-metadata (metadata-cache/metadata-for-db first-db)]
    (doseq [index (range 1 9)]
      (metadata-cache/initialize! (str "repo-" index) @(get conns index)))
    (let [rebuilt (metadata-cache/metadata-for-db first-db)]
      (is (not (identical? first-metadata rebuilt)))
      (is (= "Color 0"
             (get-in rebuilt
                     [:properties-by-ident :user.property/color :block/title])))
      (is (identical? rebuilt (metadata-cache/metadata-for-db first-db))))))

(deftest metadata-cache-refreshes-once-for-one-metadata-transaction-test
  (metadata-cache/reset-for-tests!)
  (let [conn (conn-with-metadata "Color" "Topic")
        repo "repo-refresh"
        _ (metadata-cache/initialize! repo @conn)
        report (d/transact! conn [{:db/ident :user.property/priority
                                   :block/uuid (random-uuid)
                                   :block/title "Priority"
                                   :block/order "b"
                                   :block/tags :logseq.class/Property
                                   :logseq.property/type :default
                                   :db/cardinality :db.cardinality/one}
                                  [:db/add [:block/uuid (:block/uuid (d/entity @conn :user.class/Topic))]
                                   :logseq.property.class/properties
                                   :user.property/priority]])]
    (metadata-cache/refresh! repo (:db-after report) report)
    (is (= [:user.property/color :user.property/priority]
           (:property-idents
            (get-in (metadata-cache/metadata-for-db @conn)
                    [:classes-by-ident :user.class/Topic]))))))

(deftest metadata-cache-ignores-unrelated-transactions-test
  (metadata-cache/reset-for-tests!)
  (let [conn (conn-with-metadata "Color" "Topic")
        repo "repo-unrelated"
        _ (metadata-cache/initialize! repo @conn)
        metadata-before (metadata-cache/metadata-for-db @conn)
        report (d/transact! conn [{:block/uuid (random-uuid)
                                   :block/title "ordinary block"
                                   :block/tags :user.class/Topic}])]
    (metadata-cache/refresh! repo (:db-after report) report)
    (is (identical? metadata-before (metadata-cache/metadata-for-db @conn)))
    (is (= "Color"
           (get-in (metadata-cache/metadata-for-db @conn)
                   [:properties-by-ident :user.property/color :block/title])))))

(deftest property-handler-reads-definition-from-metadata-cache-test
  (let [conn (db-test/create-conn)
        cached-property {:db/id 42
                         :db/ident :user.property/cached
                         :block/title "Cached property"
                         :block/uuid (random-uuid)}]
    (with-redefs [metadata-cache/metadata-for-db
                  (constantly {:properties-by-id {42 cached-property}})]
      (is (= cached-property
             (select-keys (property-handler/display-property-map @conn 42)
                          [:db/id :db/ident :block/title :block/uuid]))))))

(deftest db-listener-refreshes-metadata-cache-on-committed-transaction-test
  (metadata-cache/reset-for-tests!)
  (let [conn (conn-with-metadata "Color" "Topic")
        repo "repo-listener"
        _ (metadata-cache/initialize! repo @conn)]
    (db-listener/listen-db-changes! repo conn :handler-keys [:metadata-cache])
    (d/transact! conn [{:db/ident :user.property/priority
                        :block/uuid (random-uuid)
                        :block/title "Priority"
                        :block/tags :logseq.class/Property}])
    (is (= "Priority"
           (get-in (metadata-cache/metadata-for-db @conn)
                   [:properties-by-ident :user.property/priority :block/title])))))
