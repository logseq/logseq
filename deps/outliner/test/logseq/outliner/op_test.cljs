(ns logseq.outliner.op-test
  (:require [clojure.string :as string]
            [cljs.test :refer [deftest is testing]]
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
          block-uuid (:block/uuid block)]
      (outliner-op/apply-ops!
       conn
       [[:upsert-property [:plugin.property._test_plugin/x1 {:logseq.property/type :checkbox
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x1}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x1 true]]
        [:upsert-property [:plugin.property._test_plugin/x2 {:logseq.property/type :url
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x2}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x2 "https://logseq.com"]]
        [:upsert-property [:plugin.property._test_plugin/x3 {:logseq.property/type :number
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x3}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x3 1]]
        [:upsert-property [:plugin.property._test_plugin/x4 {:logseq.property/type :number
                                                             :db/cardinality :db.cardinality/many}
                           {:property-name :x4}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x4 1]]
        [:upsert-property [:plugin.property._test_plugin/x5 {:logseq.property/type :json
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x5}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x5 "{\"foo\":\"bar\"}"]]
        [:upsert-property [:plugin.property._test_plugin/x6 {:logseq.property/type :page
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x6}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x6 "Page x"]]
        [:upsert-property [:plugin.property._test_plugin/x7 {:logseq.property/type :page
                                                             :db/cardinality :db.cardinality/many}
                           {:property-name :x7}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x7 "Page y"]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x7 "Page z"]]
        [:upsert-property [:plugin.property._test_plugin/x8 {:logseq.property/type :default
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x8}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x8 "some content"]]]
       {})
      (let [block' (d/entity @conn [:block/uuid block-uuid])]
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

(deftest remove-block-property-op-rejects-lookup-ref-block-id-test
  (testing "remove-block-property rejects lookup-ref block ids"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-uuid (:block/uuid block)]
      (outliner-property/set-block-property! conn
                                             [:block/uuid block-uuid]
                                             :logseq.property/order-list-type
                                             "number")
      (is (some? (:logseq.property/order-list-type
                  (d/entity @conn [:block/uuid block-uuid]))))
      (is (thrown? js/Error
                   (outliner-op/apply-ops!
                    conn
                    [[:remove-block-property [[:block/uuid block-uuid]
                                              :logseq.property/order-list-type]]]
                    {}))))))

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

(deftest apply-template-op-resolves-dynamic-variables-test
  (testing "apply-template resolves dynamic variables in block title and property values"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Target Page"}
                   :blocks [{:block/title "target block"}]}
                  {:page {:block/title "Templates"}
                   :blocks [{:block/title "template root"
                             :build/children [{:block/title "page is <% current page %>"}
                                              {:block/title "time block"
                                               :build/properties {:log-time "<%time%>"}}]}]}]
                 :properties {:log-time {:logseq.property/type :default}}})
          template-root (db-test/find-block-by-content @conn "template root")
          target-block (db-test/find-block-by-content @conn "target block")
          template-blocks (->> (ldb/get-block-and-children @conn (:block/uuid template-root)
                                                           {:include-property-block? true})
                               rest)
          blocks-to-insert (cons (assoc (into {} (first template-blocks))
                                        :db/id (:db/id (first template-blocks))
                                        :logseq.property/used-template (:db/id template-root))
                                 (map (fn [block]
                                        (assoc (into {} block) :db/id (:db/id block)))
                                      (rest template-blocks)))
          _ (outliner-op/apply-ops! conn
                                    [[:apply-template [(:block/uuid template-root)
                                                       (:block/uuid target-block)
                                                       {:template-blocks blocks-to-insert}]]]
                                    {})
          page-var-block (db-test/find-block-by-content @conn "page is [[Target Page]]")
          time-block (some->> (d/q '[:find [?b ...]
                                     :in $ ?title ?page-title
                                     :where
                                     [?b :block/title ?title]
                                     [?b :block/page ?page]
                                     [?page :block/title ?page-title]]
                                   @conn "time block" "Target Page")
                             first
                             (d/entity @conn))
          time-value (some (fn [[property-id value]]
                             (when (= "log-time" (name property-id))
                               value))
                           (db-test/readable-properties time-block))]
      (is (some? page-var-block))
      (is (string? time-value))
      (is (not (string/blank? time-value)))
      (is (not (string/includes? time-value "<%"))))))

(deftest apply-ops-requires-uuid-block-ids-and-keyword-property-ids-test
  (testing "ops reject integer eids and accept UUID/keyword identifiers"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-id (:db/id block)
          block-uuid (:block/uuid block)
          property-kw :plugin.property._test_plugin/normalized-prop]
      (outliner-property/upsert-property! conn property-kw
                                          {:logseq.property/type :checkbox
                                           :db/cardinality :db.cardinality/one}
                                          {:property-name :normalized-prop})
      (let [property-id (:db/id (d/entity @conn property-kw))]
        (outliner-op/apply-ops!
         conn
         [[:set-block-property [block-uuid property-kw true]]]
         {})
        (is (true? (property-kw (d/entity @conn [:block/uuid block-uuid]))))
        (is (thrown? js/Error
                     (outliner-op/apply-ops!
                      conn
                      [[:set-block-property [block-id property-kw true]]]
                      {})))
        (is (thrown? js/Error
                     (outliner-op/apply-ops!
                      conn
                      [[:set-block-property [block-uuid property-id true]]]
                      {})))))))
