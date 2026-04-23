(ns frontend.components.property.property-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.property :as property-component]))

(deftest sanitize-property-values-for-display-filters-recycled-entity-values-test
  (let [active-value {:db/id 101
                      :block/title "Active"}
        recycled-value {:db/id 102
                        :block/title "Recycled"
                        :logseq.property/deleted-at 1}
        {:keys [properties recycled-only-property-ids]}
        (#'property-component/sanitize-property-values-for-display
         {:user.property/node #{active-value recycled-value}
          :user.property/single recycled-value
          :user.property/scalar "ok"})]
    (is (= #{active-value}
           (:user.property/node properties)))
    (is (nil? (:user.property/single properties)))
    (is (= "ok" (:user.property/scalar properties)))
    (is (= #{:user.property/single}
           recycled-only-property-ids))))

(deftest sanitize-property-values-for-display-marks-all-recycled-coll-as-hidden-test
  (let [recycled-a {:db/id 201
                    :block/title "Recycled A"
                    :logseq.property/deleted-at 1}
        recycled-b {:db/id 202
                    :block/title "Recycled B"
                    :logseq.property/deleted-at 2}
        {:keys [properties recycled-only-property-ids]}
        (#'property-component/sanitize-property-values-for-display
         {:user.property/nodes [recycled-a recycled-b]})]
    (is (nil? (:user.property/nodes properties)))
    (is (= #{:user.property/nodes}
           recycled-only-property-ids))))

(deftest toggle-hidden-properties-visibility-test
  (let [block-uuid (random-uuid)]
    (is (false? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (true? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (false? (property-component/hidden-properties-visible? block-uuid)))))
