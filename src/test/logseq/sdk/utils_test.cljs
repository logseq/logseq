(ns logseq.sdk.utils-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.sdk.utils :as sdk-utils]))

(deftest property-reference-values-use-db-ids
  (let [block-ref {:db/id 2 :block/uuid (random-uuid) :block/title "ref"}
        result (#'sdk-utils/property-refs->ids
                {:db/id 1
                 :block/refs [block-ref]
                 :block/tags [block-ref]
                 :logseq.property.class/extends [block-ref]
                 :plugin.property.example/query block-ref})]
    (is (= [block-ref] (:block/refs result)))
    (is (= [2] (:block/tags result)))
    (is (= [2] (:logseq.property.class/extends result)))
    (is (= 2 (:plugin.property.example/query result)))))

(deftest result-to-js-keeps-block-tag-ids
  (let [tag {:db/id 4
             :db/ident :logseq.class/Page
             :block/uuid (random-uuid)
             :block/title "Page"}
        result (js->clj (sdk-utils/result->js
                         {:db/id 1
                          :block/uuid (random-uuid)
                          :block/title "page"
                          :block/tags [tag]})
                        :keywordize-keys true)]
    (is (= [4] (:tags result)))))
