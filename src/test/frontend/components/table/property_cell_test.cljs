(ns frontend.components.table.property-cell-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.table.property-cell :as property-cell]))

(deftest editable-should-follow-table-policy
  (is (true? (property-cell/editable?
              {}
              {:db/ident :user.property/title
               :logseq.property/type :string})))
  (is (false? (property-cell/editable?
               {}
               {:db/ident :block/created-at
                :logseq.property/type :datetime})))
  (is (false? (property-cell/editable?
               {}
               {:db/ident :logseq.property.asset/size
                :logseq.property/type :raw-number})))
  (is (false? (property-cell/editable?
               {:class-ident :logseq.class/Asset}
               {:db/ident :logseq.property.asset/type
                :logseq.property/type :string})))
  (is (true? (property-cell/editable?
              {:class-ident :logseq.class/Asset}
              {:db/ident :user.property/description
               :logseq.property/type :string})))
  (is (false? (property-cell/editable?
               {:readonly-property-idents #{:user.property/locked}}
               {:db/ident :user.property/locked
                :logseq.property/type :string}))))
