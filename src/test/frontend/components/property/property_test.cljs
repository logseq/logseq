(ns frontend.components.property.property-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.property :as property-component]
            [frontend.db :as db]
            [frontend.state :as state]
            [logseq.melange.bridge.db.entity :as entity-util]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.outliner.property :as outliner-property]))

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

(deftest display-properties-keeps-other-position-properties-for-page-properties-test
  (let [property-id :user.property/date
        property {:db/id 2
                  :db/ident property-id
                  :logseq.property/type :date}
        block {:db/id 1
               :block/uuid (random-uuid)
               :block/properties {property-id "Jun 23rd, 2026"}
               :page? true}]
    (with-redefs [db/get-db (constantly ::db)
                  db/entity (fn [id]
                              (when (= id property-id)
                                property))
                  melange-property/get-class-ordered-properties (constantly [])
                  entity-util/page? :page?
                  outliner-property/get-block-classes-properties (constantly {:all-classes []
                                                                              :classes-properties []})
                  outliner-property/property-with-other-position? (constantly true)
                  state/get-config (constantly {})]
      (is (= [[property-id "Jun 23rd, 2026"]]
             (vec (:full-properties
                   (#'property-component/display-properties block {:page-title? true} false)))))
      (is (empty?
           (:full-properties
            (#'property-component/display-properties block {:in-block-container? true} false)))))))

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
