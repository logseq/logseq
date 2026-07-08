(ns frontend.components.property.property-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.property :as property-component]))

(deftest toggle-hidden-properties-visibility-test
  (let [block-uuid (random-uuid)]
    (is (false? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (true? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (false? (property-component/hidden-properties-visible? block-uuid)))))

(deftest show-property-panel-edit-button-test
  (is (false? (#'property-component/show-property-panel-edit-button?
               {:logseq.property/type :date}
               {}))
      "Date edit button should be hidden outside bottom properties")
  (is (false? (#'property-component/show-property-panel-edit-button?
               {:logseq.property/type :datetime}
               {}))
      "Datetime edit button should be hidden outside bottom properties")
  (is (true? (#'property-component/show-property-panel-edit-button?
              {:logseq.property/type :datetime}
              {:property-position :block-below}))
      "Datetime edit button should be shown for bottom properties"))

(deftest show-property-panel-bullet-for-closed-value-test
  (is (true?
       (boolean
        (#'property-component/show-property-panel-bullet?
         {:logseq.property/type :default
          :property/closed-values [{:db/id 1}]}
         {:db/id 1}))))
  (is (false?
       (#'property-component/show-property-panel-bullet?
        {:logseq.property/type :default}
        {:db/id 1}))))
