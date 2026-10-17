(ns frontend.components.selection-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.selection :as selection]))

(deftest property-action-selected-blocks-omits-outliner-snapshot
  (testing "outliner toolbar does not pin async-loaded entities"
    (is (nil? (#'selection/property-action-selected-blocks
               true
               [{:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}]))))
  (testing "views keep their explicit row list"
    (let [rows [{:block/uuid #uuid "33333333-3333-3333-3333-333333333333"}]]
      (is (= rows (#'selection/property-action-selected-blocks false rows))))))

(deftest new-property-event-omits-stale-outliner-blocks
  (let [stale [{:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
               {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}]
        target :toolbar-button]
    (testing "Tags from the floating toolbar reads live selection at click time"
      (let [[event opts] (#'selection/new-property-event target true stale {:property-key "Tags"})]
        (is (= :editor/new-property event))
        (is (= "Tags" (:property-key opts)))
        (is (= target (:target opts)))
        (is (not (contains? opts :selected-blocks)))))
    (testing "Set property from the floating toolbar also omits the snapshot"
      (let [[event opts] (#'selection/new-property-event target true stale {})]
        (is (= :editor/new-property event))
        (is (not (contains? opts :selected-blocks)))))
    (testing "table/gallery actions still pass their selected rows"
      (let [[_ opts] (#'selection/new-property-event target false stale {:property-key "Tags"})]
        (is (= stale (:selected-blocks opts)))))))
