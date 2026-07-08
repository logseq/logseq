(ns frontend.components.property.value-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.components.property.value :as property-value]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [promesa.core :as p]))

(deftest deleting-status-from-task-view-preserves-task-tag-test
  (let [calls* (atom [])
        block {:db/id 1}
        property {:db/ident :logseq.property/status}]
    (with-redefs [editor-handler/move-cross-boundary-up-down (constantly nil)
                  property-handler/remove-block-property!
                  (fn [& args] (swap! calls* conj args))]
      (#'property-value/delete-block-property!
       block property {:view-parent {:db/ident :logseq.class/Task}})
      (is (= [[1
               :logseq.property/status
               {:preserve-task-tag? true}]]
             @calls*)))))

(deftest resolve-journal-page-for-date-returns-existing-page-test
  (async done
         (let [existing-page {:db/id 100
                              :block/journal-day 20250102}
               created?* (atom false)]
           (-> (#'property-value/<resolve-journal-page-for-date
                (js/Date. "2025-01-02T00:00:00Z")
                (constantly "test-repo")
                (fn [_repo _title _opts]
                  (p/resolved existing-page))
                (fn [_title _opts]
                  (reset! created?* true)
                  (p/resolved {:db/id 999
                               :block/journal-day 20250102}))
                (constantly "Jan 2nd, 2025"))
               (p/then (fn [page]
                         (is (= existing-page page))
                         (is (false? @created?*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest resolve-journal-page-for-date-creates-page-when-missing-test
  (async done
         (let [created-page {:db/id 200
                             :block/journal-day 20250102}
               created-calls* (atom [])]
           (-> (#'property-value/<resolve-journal-page-for-date
                (js/Date. "2025-01-02T00:00:00Z")
                (constantly "test-repo")
                (fn [_repo _title _opts]
                  (p/resolved nil))
                (fn [title opts]
                  (swap! created-calls* conj [title opts])
                  (p/resolved created-page))
                (constantly "Jan 2nd, 2025"))
               (p/then (fn [page]
                         (is (= created-page page))
                         (is (= [["Jan 2nd, 2025" {:redirect? false}]] @created-calls*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest resolved-property-value-for-render-skips-default-for-placeholder-row-test
  (let [property {:db/ident :logseq.property/status
                  :logseq.property/default-value {:db/id 3
                                                  :db/ident :logseq.property/status.todo
                                                  :block/title "Todo"}}
        placeholder-block {:db/id 1}]
    (is (nil? (#'property-value/resolved-property-value-for-render placeholder-block property false)))))

(deftest resolved-property-value-for-render-uses-default-for-loaded-block-test
  (let [property {:db/ident :logseq.property/status
                  :logseq.property/default-value {:db/id 3
                                                  :db/ident :logseq.property/status.todo
                                                  :block/title "Todo"}}
        loaded-block {:db/id 1
                      :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}]
    (is (= (:logseq.property/default-value property)
           (#'property-value/resolved-property-value-for-render loaded-block property false)))))

(deftest bottom-property-edit-pointer-dismiss-handler-test
  (let [edit-button (js-obj "closest" (fn [selector]
                                        (when (= selector ".bottom-property-edit-icon")
                                          #js {})))
        other-target (js-obj "closest" (constantly nil))
        prevent-default-called? (atom false)
        edit-event (js-obj "target" edit-button
                           "preventDefault" #(reset! prevent-default-called? true))
        other-event (js-obj "target" other-target)]
    (is (false? (#'property-value/prevent-bottom-property-edit-pointer-dismiss edit-event)))
    (is (true? @prevent-default-called?))
    (is (nil? (#'property-value/prevent-bottom-property-edit-pointer-dismiss other-event)))))

(deftest date-page-link-stops-click-propagation-in-bottom-properties-test
  (is (fn? (:on-click (#'property-value/date-page-link-props true))))
  (is (nil? (:on-click (#'property-value/date-page-link-props false)))))

(deftest direct-value-picker-type-test
  (is (true? (property-value/direct-value-picker-type? :date)))
  (is (true? (property-value/direct-value-picker-type? :datetime)))
  (is (true? (property-value/direct-value-picker-type? :asset)))
  (is (false? (property-value/direct-value-picker-type? :default))))

(deftest asset-picker-layout-is-viewport-constrained-test
  (is (= "min(640px, calc(100vw - 32px))"
         (:width property-value/asset-picker-grid-style)))
  (is (= "100%" (:max-width property-value/asset-picker-grid-style)))
  (is (= "repeat(auto-fill, minmax(140px, 1fr))"
         (:grid-template-columns property-value/asset-picker-items-grid-style))))

(defn- class-set
  [class-str]
  (set (string/split (or class-str "") #"\s+")))

(deftest block-multiple-node-values-stay-in-one-row-test
  (let [opts {:other-position? true
              :show-popup! identity}]
    (is (contains? (class-set (property-value/multiple-values-trigger-class opts))
                   "min-w-0"))
    (is (contains? (class-set (property-value/multiple-values-trigger-class opts))
                   "flex-nowrap"))
    (is (contains? (class-set (property-value/multiple-values-trigger-class opts))
                   "multi-values-nowrap"))
    (is (contains? (class-set (property-value/multiple-value-item-class opts))
                   "shrink-0"))))

(deftest expanded-multiple-node-values-can-wrap-test
  (let [opts {:expanded? true
              :other-position? true
              :show-popup! identity}]
    (is (contains? (class-set (property-value/multiple-values-trigger-class opts))
                   "flex-wrap"))
    (is (contains? (class-set (property-value/multiple-values-trigger-class opts))
                   "multi-values-expanded"))
    (is (not (contains? (class-set (property-value/multiple-values-trigger-class opts))
                        "flex-nowrap")))
    (is (not (contains? (class-set (property-value/multiple-value-item-class opts))
                        "shrink-0")))))

(deftest page-multiple-node-values-can-wrap-test
  (let [opts {:page-property? true
              :show-popup! identity}]
    (is (contains? (class-set (property-value/multiple-values-trigger-class opts))
                   "flex-wrap"))
    (is (not (contains? (class-set (property-value/multiple-values-trigger-class opts))
                        "flex-nowrap")))
    (is (not (contains? (class-set (property-value/multiple-value-item-class opts))
                        "shrink-0")))))

(deftest non-positioned-multiple-node-values-can-wrap-test
  (is (contains? (class-set (property-value/multiple-values-trigger-class {}))
                 "flex-wrap"))
  (is (not (contains? (class-set (property-value/multiple-values-trigger-class {}))
                      "flex-nowrap"))))

(deftest asset-selected-ids-test
  (let [property {:db/ident :asset}]
    (is (= #{1}
           (#'property-value/asset-selected-ids {:asset {:db/id 1}} property)))
    (is (= #{1 2}
           (#'property-value/asset-selected-ids {:asset #{{:db/id 1} {:db/id 2}}} property)))
    (is (= #{}
           (#'property-value/asset-selected-ids {} property)))))

(deftest assets-selected-first-test
  (let [assets [{:db/id 1 :block/title "one"}
                {:db/id 2 :block/title "two"}
                {:db/id 3 :block/title "three"}]]
    (is (= [2 1 3]
           (mapv :db/id (#'property-value/assets-selected-first assets #{2}))))
    (is (= [1 3 2]
           (mapv :db/id (#'property-value/assets-selected-first assets #{1 3})))
        "Selected assets stay in their original relative order")))

(deftest add-initial-node-choice-dedupes-existing-db-id-test
  (let [existing {:value {:db/id 100
                          :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                  :label "Existing node"}
        duplicate {:value {:db/id 100
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                   :label "Existing node"}]
    (is (= [existing]
           (#'property-value/add-initial-node-choice [existing] duplicate)))))

(deftest add-initial-node-choice-dedupes-existing-uuid-test
  (let [existing {:value {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                  :label "Existing node"}
        duplicate {:value {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                   :label "Existing node"}]
    (is (= [existing]
           (#'property-value/add-initial-node-choice [existing] duplicate)))))

(deftest add-initial-node-choice-dedupes-existing-raw-entity-test
  (let [existing {:db/id 100
                  :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                  :block/title "Existing node"}
        duplicate {:value {:db/id 100
                           :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                   :label "Existing node"}]
    (is (= [existing]
           (#'property-value/add-initial-node-choice [existing] duplicate)))))

(deftest add-initial-node-choice-keeps-distinct-node-with-same-label-test
  (let [existing {:value {:db/id 100
                          :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                  :label "Shared title"}
        new-choice {:value {:db/id 101
                            :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                    :label "Shared title"}]
    (is (= [existing new-choice]
           (#'property-value/add-initial-node-choice [existing] new-choice)))))

(deftest node-option-title-resolves-search-result-uuid-refs-test
  (let [ref-uuid #uuid "11111111-2222-3333-4444-555555555555"
        search-result {:db/id 1
                       :block/title (str "Alpha [[" ref-uuid "]] Gamma")}
        full-node (assoc search-result
                         :block/refs [{:block/uuid ref-uuid
                                       :block/title "Beta"}])
        property {:logseq.property/classes [{:db/id 2}]}]
    (with-redefs [db/entity (fn [id]
                              (when (= id (:db/id search-result))
                                full-node))]
      (is (= "Alpha [[Beta]] Gamma"
             (:title (#'property-value/node-option-info property search-result))))
      (is (= "Alpha [[Beta]] Gamma"
             (:label-value (#'property-value/node-option-info property search-result)))))))

(deftest scoped-class-nodes-skips-broad-node-property-preload-test
  (let [calls* (atom [])
        property {:logseq.property/type :node}
        page-class {:db/id 1
                    :db/ident :logseq.class/Page}
        tag-class {:db/id 2
                   :db/ident :logseq.class/Tag}]
    (with-redefs [model/get-class-objects (fn [_repo class-id]
                                            (swap! calls* conj class-id)
                                            [{:db/id 100
                                              :block/title "Page 100"}])
                  model/get-structured-children (fn [_repo _class-id] [])]
      (is (= []
             (#'property-value/scoped-class-nodes
              "repo" property [page-class tag-class] nil)))
      (is (= [] @calls*)))))

(deftest scoped-class-nodes-filters-search-results-by-scoped-classes-test
  (let [calls* (atom [])
        property {:logseq.property/type :node}
        topic-class {:db/id 10
                     :db/ident :user.class/Topic}
        matching-parent {:db/id 100
                         :block/title "Parent topic"
                         :block/tags [10]}
        matching-child {:db/id 101
                        :block/title "Child topic"
                        :block/tags [11]}
        matching-wrapped {:value {:db/id 103
                                  :block/title "Wrapped topic"
                                  :block/tags [10]}
                          :label "Wrapped topic"}
        matching-entity-tags {:db/id 104
                              :block/title "Entity-shaped topic"
                              :block/tags [topic-class]}
        unrelated {:db/id 102
                   :block/title "Other"
                   :block/tags [20]}]
    (with-redefs [model/get-class-objects (fn [_repo class-id]
                                            (swap! calls* conj class-id)
                                            [])
                  model/get-structured-children (fn [_repo class-id]
                                                  (case class-id
                                                    10 [11]
                                                    []))]
      (is (= [matching-parent matching-child matching-wrapped matching-entity-tags]
             (#'property-value/scoped-class-nodes
              "repo" property [topic-class] [matching-parent matching-child matching-wrapped matching-entity-tags unrelated])))
      (is (= [] @calls*)))))

(deftest scoped-class-nodes-preloads-narrow-node-property-choices-test
  (let [property {:logseq.property/type :node}
        topic-class {:db/id 10
                     :db/ident :user.class/Topic}
        choices [{:db/id 100
                  :block/title "Topic 100"}]]
    (with-redefs [model/get-class-objects (fn [_repo class-id]
                                            (when (= 10 class-id)
                                              choices))
                  model/get-structured-children (fn [_repo _class-id] [])]
      (is (= choices
             (#'property-value/scoped-class-nodes
              "repo" property [topic-class] nil))))))

(deftest scoped-class-nodes-preloads-tag-only-node-property-choices-test
  (let [property {:logseq.property/type :node}
        tag-class {:db/id 2
                   :db/ident :logseq.class/Tag}
        choices [{:db/id 100
                  :block/title "Tag 100"}]]
    (with-redefs [model/get-class-objects (fn [_repo class-id]
                                            (when (= 2 class-id)
                                              choices))
                  model/get-structured-children (fn [_repo _class-id] [])]
      (is (= choices
             (#'property-value/scoped-class-nodes
              "repo" property [tag-class] nil))))))

(deftest scoped-class-nodes-keeps-hydrated-broad-scope-initial-choices-test
  (let [property {:logseq.property/type :node}
        page-class {:db/id 1
                    :db/ident :logseq.class/Page}
        matching-choice {:value {:db/id 100
                                 :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                         :label "Existing page"}
        unrelated-choice {:value {:db/id 101
                                  :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                          :label "Unrelated block"}]
    (with-redefs [db/entity (fn [id]
                              (case id
                                100 {:db/id 100
                                     :block/title "Existing page"
                                     :block/tags [1]}
                                101 {:db/id 101
                                     :block/title "Unrelated block"}
                                nil))
                  model/get-structured-children (fn [_repo _class-id] [])]
      (is (= [matching-choice]
             (#'property-value/scoped-class-nodes
              "repo" property [page-class] [matching-choice unrelated-choice]))))))

(deftest load-initial-node-choices-loads-existing-values-for-broad-page-scope-test
  (async done
         (let [property {:db/ident :user.property/p1
                         :logseq.property/type :node
                         :logseq.property/classes [{:db/id 1
                                                    :db/ident :logseq.class/Page}]}
               existing-values [{:value {:db/id 100
                                         :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                                 :label "page 1"}
                                {:value {:db/id 101
                                 :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                                 :label "page 2"}]
               queried-properties* (atom [])]
           (with-redefs [db-async/<get-property-values (fn [property-ident]
                                                         (swap! queried-properties* conj property-ident)
                                                         (p/resolved existing-values))
                         db-async/<get-tag-objects (fn [_repo _class-id]
                                                     (p/resolved []))]
             (-> (#'property-value/<load-initial-node-choices "repo" property (:logseq.property/classes property))
                 (p/then (fn [result]
                           (is (= [:user.property/p1] @queried-properties*))
                           (is (= existing-values result))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))
