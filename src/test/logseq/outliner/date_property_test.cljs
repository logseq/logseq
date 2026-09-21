(ns logseq.outliner.date-property-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(deftest set-date-property-can-clear-to-empty-placeholder
  (testing "Date values can be cleared while the property remains on the block"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:due {:logseq.property/type :date}}
                 :pages-and-blocks
                 [{:page {:build/journal 20250203}}
                  {:page {:block/title "page1"}
                   :blocks [{:block/title "b1"
                             :build/properties {:due [:build/page {:build/journal 20250203}]}}]}]})
          block-uuid (:block/uuid (db-test/find-block-by-content @conn "b1"))
          empty-placeholder-id (:db/id (d/entity @conn :logseq.property/empty-placeholder))]
      (is (= 20250203
             (:block/journal-day (:user.property/due (d/entity @conn [:block/uuid block-uuid])))))
      (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/due :logseq.property/empty-placeholder)
      (let [updated (d/entity @conn [:block/uuid block-uuid])]
        (is (= empty-placeholder-id (:db/id (:user.property/due updated)))
            "Date property remains on the block")
        (is (= :logseq.property/empty-placeholder
               (:db/ident (:user.property/due updated)))
            "Date value is cleared to empty"))))

  (testing "Datetime values can be cleared while the property remains on the block"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:when {:logseq.property/type :datetime}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "b1"
                             :build/properties {:when 1700000000000}}]}]})
          block-uuid (:block/uuid (db-test/find-block-by-content @conn "b1"))]
      (is (= 1700000000000
             (:user.property/when (d/entity @conn [:block/uuid block-uuid]))))
      (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/when :logseq.property/empty-placeholder)
      (is (= :logseq.property/empty-placeholder
             (:user.property/when (d/entity @conn [:block/uuid block-uuid])))))))
