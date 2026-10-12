(ns logseq.db.frontend.malli-schema-mutation2-test
  "Second-run mutation survivors in logseq.db.frontend.malli-schema."
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [malli.core :as m]
            [malli.error :as me]))

(def ^:private history-base
  {:block/uuid #uuid "11111111-1111-4111-8111-111111111111"
   :block/created-at 1
   :logseq.property.history/block 2
   :logseq.property.history/property 3})

(def ^:private closed-value-base
  {:block/uuid #uuid "11111111-1111-4111-8111-111111111111"
   :block/created-at 1
   :block/updated-at 2
   :block/parent 3
   :block/order "a0"
   :block/page 4
   :logseq.property/created-from-property 5})

(deftest property-history-block-needs-a-ref-value-or-a-scalar-value
  (is (m/validate db-malli-schema/property-history-block
                  (assoc history-base :logseq.property.history/ref-value 7)))
  (is (m/validate db-malli-schema/property-history-block
                  (assoc history-base :logseq.property.history/scalar-value false))
      "A scalar value alone is enough")
  (is (= {:logseq.property.history/ref-value
          [":logseq.property.history/ref-value or :logseq.property.history/scalar-value required"]}
         (me/humanize (m/explain db-malli-schema/property-history-block history-base)))
      "The error is reported under :logseq.property.history/ref-value"))

(deftest closed-value-block-needs-a-title-or-a-value
  (is (m/validate db-malli-schema/closed-value-block
                  (assoc closed-value-base :block/title "t"))
      "No :db/ident and no :block/closed-value-property is needed")
  (is (m/validate db-malli-schema/closed-value-block
                  (assoc closed-value-base :logseq.property/value "v"))
      "A value alone is enough")
  (is (not (m/validate db-malli-schema/closed-value-block
                       (assoc closed-value-base :block/title "t" :logseq.property/value true)))
      "A value must be a string or a double")
  (is (= {:logseq.property/value [":block/title or :logseq.property/value required"]}
         (me/humanize (m/explain db-malli-schema/closed-value-block closed-value-base)))
      "The error is reported under :logseq.property/value"))

(deftest normal-block-errors-are-grouped-under-normal-block
  (is (= {:block/parent {"normal-block" ["missing required key"]}
          :block/order {"normal-block" ["missing required key"]}
          :block/page {"normal-block" ["missing required key"]}
          :block/uuid {"normal-block" ["missing required key"]}
          :block/created-at {"normal-block" ["missing required key"]}
          :block/updated-at {"normal-block" ["missing required key"]}}
         (me/humanize (m/explain db-malli-schema/normal-block {:block/title "x"})))))
