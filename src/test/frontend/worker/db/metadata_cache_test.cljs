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
        class (get-in metadata [:classes-by-ident :user.class/Topic])]
    (is (= "Color" (:block/title property)))
    (is (integer? (:db/id property)))
    (is (= "Topic" (:block/title class)))
    (is (= [:logseq.class/Root]
           (:extends class)))
    (is (= [:user.property/color]
           (:property-idents class)))))

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
    (is (= 2 (:builds (metadata-cache/stats))))
    (metadata-cache/clear! "repo-a")
    (is (nil? (metadata-cache/cached-metadata-for-db @conn-a)))
    (is (some? (metadata-cache/cached-metadata-for-db @conn-b)))))

(deftest metadata-cache-refreshes-once-for-one-metadata-transaction-test
  (metadata-cache/reset-for-tests!)
  (let [conn (conn-with-metadata "Color" "Topic")
        repo "repo-refresh"
        _ (metadata-cache/initialize! repo @conn)
        builds-before (:builds (metadata-cache/stats))
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
    (is (= (inc builds-before) (:builds (metadata-cache/stats))))
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
    (is (= 1 (:builds (metadata-cache/stats))))))

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
    (is (= 2 (:builds (metadata-cache/stats))))))
