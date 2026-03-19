(ns logseq.outliner.op-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.property :as outliner-property]))

(deftest toggle-reaction-op
  (testing "toggles reactions via outliner ops"
    (let [user-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          now 1234]
      (ldb/transact! conn
                     [{:block/uuid user-uuid
                       :block/name "user"
                       :block/title "user"
                       :block/created-at now
                       :block/updated-at now
                       :block/tags #{:logseq.class/Page}}]
                     {})
      (let [block (db-test/find-block-by-content @conn "Block")
            target-uuid (:block/uuid block)]
        (outliner-op/apply-ops! conn
                                [[:toggle-reaction [target-uuid "+1" user-uuid]]]
                                {})
        (let [block-entity (d/entity @conn [:block/uuid target-uuid])
              reactions (:logseq.property.reaction/_target block-entity)
              reaction (first reactions)]
          (is (= 1 (count reactions)))
          (is (uuid? (:block/uuid reaction)))
          (is (= "+1" (:logseq.property.reaction/emoji-id reaction)))
          (is (= (:db/id (d/entity @conn [:block/uuid user-uuid]))
                 (:db/id (:logseq.property/created-by-ref reaction)))))
        (outliner-op/apply-ops! conn
                                [[:toggle-reaction [target-uuid "+1" user-uuid]]]
                                {})
        (let [block-entity (d/entity @conn [:block/uuid target-uuid])]
          (is (empty? (:logseq.property.reaction/_target block-entity))))))))

(deftest apply-ops-plugin-property-sequence-test
  (testing "plugin property ops remain visible after a single apply-ops! batch"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-id (:db/id block)]
      (outliner-op/apply-ops!
       conn
       [[:upsert-property [:plugin.property._test_plugin/x1 {:logseq.property/type :checkbox
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x1}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x1 true]]
        [:upsert-property [:plugin.property._test_plugin/x2 {:logseq.property/type :url
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x2}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x2 "https://logseq.com"]]
        [:upsert-property [:plugin.property._test_plugin/x3 {:logseq.property/type :number
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x3}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x3 1]]
        [:upsert-property [:plugin.property._test_plugin/x4 {:logseq.property/type :number
                                                             :db/cardinality :db.cardinality/many}
                           {:property-name :x4}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x4 1]]
        [:upsert-property [:plugin.property._test_plugin/x5 {:logseq.property/type :json
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x5}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x5 "{\"foo\":\"bar\"}"]]
        [:upsert-property [:plugin.property._test_plugin/x6 {:logseq.property/type :page
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x6}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x6 "Page x"]]
        [:upsert-property [:plugin.property._test_plugin/x7 {:logseq.property/type :page
                                                             :db/cardinality :db.cardinality/many}
                           {:property-name :x7}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x7 "Page y"]]
        [:set-block-property [block-id :plugin.property._test_plugin/x7 "Page z"]]
        [:upsert-property [:plugin.property._test_plugin/x8 {:logseq.property/type :default
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x8}]]
        [:set-block-property [block-id :plugin.property._test_plugin/x8 "some content"]]]
       {})
      (let [block' (d/entity @conn block-id)]
        (is (true? (:plugin.property._test_plugin/x1 block')))
        (is (= "https://logseq.com"
               (:block/title (:plugin.property._test_plugin/x2 block'))))
        (is (= 1
               (:logseq.property/value (:plugin.property._test_plugin/x3 block'))))
        (is (= #{1}
               (set (map :logseq.property/value (:plugin.property._test_plugin/x4 block')))))
        (is (= "{\"foo\":\"bar\"}" (:plugin.property._test_plugin/x5 block')))
        (is (= "page x"
               (:block/name (:plugin.property._test_plugin/x6 block'))))
        (is (= #{"page y" "page z"}
               (set (map :block/name (:plugin.property._test_plugin/x7 block')))))
        (is (= "some content"
               (:block/title (:plugin.property._test_plugin/x8 block'))))))))

(deftest direct-plugin-many-page-property-appends-values-test
  (testing "direct property operations keep both page values"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-id (:db/id block)
          property-id :plugin.property._test_plugin/x7]
      (outliner-property/upsert-property! conn property-id
                                          {:logseq.property/type :page
                                           :db/cardinality :db.cardinality/many}
                                          {:property-name :x7})
      (outliner-property/set-block-property! conn block-id property-id "Page y")
      (outliner-property/set-block-property! conn block-id property-id "Page z")
      (is (= #{"page y" "page z"}
             (set (map :block/name
                       (:plugin.property._test_plugin/x7 (d/entity @conn block-id)))))))))
