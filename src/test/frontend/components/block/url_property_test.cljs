(ns frontend.components.block.url-property-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]
            [frontend.components.page :as page]
            [frontend.util.entity :as entity]))

(deftest url-property-validation-effect-deps-include-title-test
  (let [property {:db/id 2 :logseq.property/type :url}
        invalid {:db/id 1
                 :block/title "not-a-url"
                 :logseq.property/created-from-property property}
        valid (assoc invalid :block/title "https://logseq.com")]
    (is (= [1 2 "not-a-url"]
           (#'block/url-property-validation-effect-deps invalid)))
    (is (= [1 2 "https://logseq.com"]
           (#'block/url-property-validation-effect-deps valid)))
    (is (not= (#'block/url-property-validation-effect-deps invalid)
              (#'block/url-property-validation-effect-deps valid))
        "Changing the title must change effect deps so invalid URLs re-validate.")))

(deftest zoomed-url-property-value-hides-sub-block-ux-test
  (testing "URL property values hide leftover children and the add-block control"
    (let [url-value {:block/title "https://logseq.com"
                     :logseq.property/created-from-property {:logseq.property/type :url}}
          text-value {:block/title "text value"
                      :logseq.property/created-from-property {:logseq.property/type :default}}]
      (is (entity/url-property-value? url-value))
      (is (true? (#'page/hide-block-route-add-button? url-value false)))
      (is (false? (#'page/hide-block-route-add-button? text-value false)))
      (is (true? (#'page/hide-block-route-add-button? text-value true))))))
