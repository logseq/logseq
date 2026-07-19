(ns frontend.components.property.property-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.property :as property-component]
            [frontend.components.property.value :as property-value]
            [frontend.db.async :as db-async]
            [frontend.handler.property :as property-handler]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(deftest removing-status-from-task-view-preserves-task-tag-test
  (async done
         (let [block-id (random-uuid)
               calls* (atom [])
               block {:block/uuid block-id}
               status-property {:db/ident :logseq.property/status}
               on-chosen (#'property-component/property-input-on-chosen
                          block (atom nil) (atom nil) nil
                          {:remove-property? true
                           :view-parent {:db/ident :logseq.class/Task}})]
           (p/with-redefs [db-async/<get-block (fn [& _] (p/resolved status-property))
                           property-value/batch-operation? (constantly false)
                           property-value/get-operating-blocks (fn [_] [block])
                           property-handler/batch-remove-block-property!
                           (fn [& args] (swap! calls* conj args))
                           shui/popup-hide! (constantly nil)]
             (-> (on-chosen {:value :logseq.property/status})
                 (p/then (fn []
                           (is (= [[[block-id]
                                   :logseq.property/status
                                   {:preserve-task-tag? true}]]
                                  @calls*))))
                 (p/catch (fn [error]
                            (is false (str error))))
                 (p/finally done))))))

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

(deftest bundled-display-properties-match-the-render-context-test
  (let [payload-fn (some-> (resolve 'frontend.components.property/bundled-display-properties) deref)
        default-payload {:kind :default}
        page-payload {}
        block {:block.temp/display-properties default-payload
               :block.temp/page-display-properties page-payload}]
    (is (fn? payload-fn))
    (when payload-fn
      (is (= default-payload (payload-fn block {} false)))
      (is (= default-payload
             (payload-fn block {:page-title? false
                                :publishing? false
                                :state-hide-empty-properties? false}
                         false)))
      (is (= page-payload (payload-fn block {:page-title? true} false))
          "An explicit empty page payload is complete.")
      (is (nil? (payload-fn (dissoc block :block.temp/page-display-properties)
                            {:page-title? true}
                            false))
          "Page-title rendering must not reuse the semantically different default payload.")
      (is (nil? (payload-fn block {:page-title? true :publishing? true} false)))
      (is (nil? (payload-fn block {:gallery-view? true} false)))
      (is (nil? (payload-fn block {} true))
          "Showing empty and hidden properties requires a fresh derivation."))))

(deftest bundled-bidirectional-properties-preserve-empty-payloads-test
  (let [payload-fn (some-> (resolve 'frontend.components.property/bundled-bidirectional-properties) deref)]
    (is (fn? payload-fn))
    (when payload-fn
      (is (= [true []]
             (payload-fn {:block.temp/bidirectional-properties []})))
      (is (= [true nil]
             (payload-fn {:block.temp/bidirectional-properties nil}))
          "Presence, not truthiness, defines a complete worker payload.")
      (is (= [false nil] (payload-fn {}))))))
