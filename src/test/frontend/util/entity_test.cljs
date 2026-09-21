(ns frontend.util.entity-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.entity :as entity]))

(deftest as-block-map-wraps-view-row-uuids-test
  (let [page-uuid #uuid "22222222-2222-2222-2222-222222222222"]
    (is (= {:block/uuid page-uuid}
           (entity/as-block-map page-uuid)))
    (is (= {:uuid page-uuid :block/uuid page-uuid}
           (entity/as-block-map {:uuid page-uuid})))
    (is (= {:block/uuid page-uuid :block/title "gooxox"}
           (entity/as-block-map {:block/uuid page-uuid :block/title "gooxox"})))
    (is (= 42 (entity/as-block-map 42)))))

(deftest predicates-read-plain-worker-payload-tags
  (testing "page predicates use plain map tags"
    (is (entity/internal-page? {:block/tags [{:db/ident :logseq.class/Page}]}))
    (is (entity/journal? {:block/tags [:logseq.class/Journal]}))
    (is (entity/class? {:block/tags [{:db/ident :logseq.class/Tag}]}))
    (is (entity/property? {:block/tags [:logseq.class/Property]}))
    (is (entity/page? {:block/tags [:logseq.class/Journal]}))
    (is (= #{:page :class}
           (entity/get-entity-types
            {:block/tags [:logseq.class/Page {:db/ident :logseq.class/Tag}]}))))
  (testing "non page payloads and ids are not pages"
    (is (not (entity/page? {:block/tags [:logseq.class/Task]})))
    (is (not (entity/page? 1)))
    (is (not (entity/page? nil)))))

(deftest library-outline-child-uuids-keeps-pages-only
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        journal-uuid #uuid "22222222-2222-2222-2222-222222222222"
        block-uuid #uuid "33333333-3333-3333-3333-333333333333"]
    (is (= [page-uuid journal-uuid]
           (entity/library-outline-child-uuids
            [{:block/uuid page-uuid
              :block/tags [{:db/ident :logseq.class/Page}]}
             {:block/uuid block-uuid
              :block/title "hello"}
             nil
             {:block/uuid journal-uuid
              :block/tags [:logseq.class/Journal]}])))
    (is (= [] (entity/library-outline-child-uuids
               [{:block/uuid block-uuid :block/title "world"}])))))

(deftest url-property-value-predicate-test
  (testing "URL-type property values are identified from created-from-property"
    (is (entity/url-property-value?
         {:block/title "https://logseq.com"
          :logseq.property/created-from-property {:logseq.property/type :url}}))
    (is (not (entity/url-property-value?
              {:block/title "text value"
               :logseq.property/created-from-property {:logseq.property/type :default}})))
    (is (not (entity/url-property-value? {:block/title "ordinary block"})))
    (is (not (entity/url-property-value? nil)))))

(deftest default-value-block-predicate-test
  (testing "A property default-value block is identified from its parent"
    (let [property {:db/id 5
                    :block/tags [:logseq.class/Property]
                    :logseq.property/default-value {:db/id 10}}
          default-value {:db/id 10
                         :block/title "hello world"
                         :block/parent property
                         :logseq.property/created-from-property property}]
      (is (entity/default-value-block? default-value))
      (is (entity/leaf-property-value? default-value))))
  (testing "Closed values and ordinary text property values are not default-value blocks"
    (is (not (entity/default-value-block?
              {:db/id 11
               :block/closed-value-property {:db/id 5}
               :block/parent {:db/id 5
                              :block/tags [:logseq.class/Property]
                              :logseq.property/default-value {:db/id 10}}
               :logseq.property/created-from-property {:db/id 5
                                                       :block/tags [:logseq.class/Property]}})))
    (is (not (entity/default-value-block?
              {:db/id 12
               :block/title "text value"
               :block/parent {:db/id 1 :block/tags [:logseq.class/Page]}
               :logseq.property/created-from-property {:db/id 5
                                                       :block/tags [:logseq.class/Property]
                                                       :logseq.property/type :default}})))
    (is (not (entity/default-value-block? nil)))
    (is (not (entity/leaf-property-value?
              {:block/title "text value"
               :logseq.property/created-from-property {:logseq.property/type :default}})))))
