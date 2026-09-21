(ns frontend.components.property.value-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.components.property.value :as property-value]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.block :as block-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(deftest alias-node-selection-preserves-entity-id-semantics-test
  (async done
         (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
               block {:db/id 1
                      :block/uuid block-uuid
                      :block/alias []}
               property {:db/ident :block/alias
                         :db/valueType :db.type/ref
                         :db/cardinality :db.cardinality/many}
               calls* (atom [])]
           (-> (p/with-redefs [state/get-current-repo (constantly "test")
                               state/get-selection-block-ids (constantly [])
                               state/get-state (constantly nil)
                               db-async/<get-block (fn [_repo _block-ref _opts]
                                                     (p/resolved block))
                               db-property-handler/batch-set-property!
                               (fn [block-ids property-ident value opts]
                                 (swap! calls* conj [(vec block-ids) property-ident value opts])
                                 (p/resolved nil))]
               (#'property-value/add-or-remove-property-value
                  block property 42 false {}))
               (p/then (fn [_]
                         (is (= [[[block-uuid]
                                  :block/alias
                                  42
                                  {:entity-id? true}]]
                                @calls*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest alias-value-click-opens-property-selector-test
  (let [popup-event* (atom nil)
        event #js {:preventDefault (fn [])
                   :stopPropagation (fn [])}
        open-selector! (#'property-value/alias-value-on-pointer-down
                        {:db/ident :block/alias}
                        #(reset! popup-event* %))]
    (is (fn? open-selector!))
    (open-selector! event)
    (is (= event @popup-event*))))

(deftest property-write-id-prefers-ident-test
  (is (= :logseq.property/default-value
         (#'property-value/property-write-id
          {:db/ident :logseq.property/default-value
           :db/id 42}))
      "Ident-backed built-in editors should write with ident, not a transient db/id.")
  (is (= 7
         (#'property-value/property-write-id {:db/id 7}))
      "Properties without ident still write with db/id."))

(deftest default-value-property-hides-nested-block-children-test
  (is (true? (#'property-value/default-value-property-ident?
              {:db/ident :logseq.property/default-value})))
  (is (false? (#'property-value/default-value-property-ident?
               {:db/ident :user.property/p1}))))

(deftest unset-default-value-opens-block-editor-when-entity-exists-test
  (let [property {:db/ident :logseq.property/default-value}]
    (is (true? (#'property-value/unset-default-value? property nil)))
    (is (true? (#'property-value/unset-default-value?
                property
                {:db/ident :logseq.property/empty-placeholder})))
    (is (false? (#'property-value/unset-default-value?
                 property
                 {:db/id 10}))
        "A created default-value entity must use the block editor even without :block/title.")
    (is (false? (#'property-value/unset-default-value?
                 {:db/ident :user.property/p1}
                 nil)))))

(deftest empty-placeholder-identity-maps-as-empty-test
  (is (true? (#'property-value/empty-placeholder-value?
              :logseq.property/empty-placeholder)))
  (is (true? (#'property-value/empty-placeholder-value?
              {:db/id 9
               :db/ident :logseq.property/empty-placeholder}))
      "Canonical rows inline empty-placeholder as a shallow identity, not the keyword.")
  (is (false? (#'property-value/empty-placeholder-value?
               {:db/id 10
                :db/ident :logseq.property/priority.low}))))

(deftest canonical-property-without-closed-values-still-selects-priority-test
  (let [property {:db/ident :logseq.property/priority
                  :logseq.property/type :default}
        empty-value {:db/id 9
                     :db/ident :logseq.property/empty-placeholder}
        high-value {:db/id 10
                    :db/ident :logseq.property/priority.high
                    :logseq.property/icon {:type :tabler-icon :id "priorityLvlHigh"}}]
    (is (false? (property-value/select-type? {} property))
        "use-block property snapshots omit :property/closed-values.")
    (is (true? (#'property-value/property-value-select-type? {} property empty-value))
        "No priority must still take the select/dashed-icon path.")
    (is (false? (#'property-value/closed-choice-value? high-value))
        "An icon alone is display metadata; the property decides whether it is a closed choice.")
    (is (true? (#'property-value/property-value-select-type? {} property high-value))
        "Closed choices keep their icon on the value ref.")
    (is (false? (#'property-value/closed-choice-value? empty-value)))
    (is (false? (#'property-value/property-value-select-type?
                 {}
                 {:db/ident :user.property/reactive-priority
                  :logseq.property/type :default}
                 empty-value))
        "Empty text properties must not become 0-width nested select blocks.")))

(deftest icon-bearing-page-values-are-not-closed-choices-test
  (let [page-value {:db/id 11
                    :block/uuid (random-uuid)
                    :block/title "Icon page"
                    :block/name "icon page"
                    :logseq.property/icon {:type :tabler-icon :id "star"}}]
    (is (false? (#'property-value/closed-choice-value? page-value))
        "A page/node icon is display metadata, not closed-choice identity.")))

(deftest closed-values-need-worker-load-even-when-snapshot-has-ids-test
  (is (#'property-value/closed-values-need-worker-load?
       {:property/closed-values
        [{:db-ident :logseq.property.view/type.table}
         {:db-ident :logseq.property.view/type.list}]})
      "Compact ident-only snapshots still load the full set.")
  (is (#'property-value/closed-values-need-worker-load?
       {:property/closed-values
        [{:db/id 1 :block/title "Todo"}]})
      "A snapshot that only has the current choice still reloads all choices.")
  (is (not (#'property-value/closed-values-need-worker-load? {}))))

(deftest date-property-value-present-test
  (is (true? (#'property-value/date-property-value-present?
              {:db/id 1 :block/journal-day 20250101})))
  (is (true? (#'property-value/date-property-value-present? 1700000000000)))
  (is (false? (#'property-value/date-property-value-present? nil)))
  (is (false? (#'property-value/date-property-value-present?
               :logseq.property/empty-placeholder)))
  (is (false? (#'property-value/date-property-value-present?
               {:db/id 9 :db/ident :logseq.property/empty-placeholder}))))

(deftest clear-date-property-value-keeps-property-test
  (let [calls* (atom [])
        block {:db/id 1
               :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
        property {:db/ident :user.property/due
                  :logseq.property/type :date}]
    (with-redefs [state/get-selection-block-ids (constantly [])
                  state/get-selection-blocks (constantly [])
                  state/get-state (constantly nil)
                  property-handler/batch-set-block-property!
                  (fn [ids ident value]
                    (swap! calls* conj [ids ident value]))]
      (#'property-value/clear-date-property-value! block property)
      (is (= [[[(:block/uuid block)]
               :user.property/due
               :logseq.property/empty-placeholder]]
             @calls*)
          "Clearing a date writes empty-placeholder so the property stays on the node."))))

(deftest date-picker-delete-clears-value-instead-of-removing-property-test
  (let [cleared?* (atom false)
        event #js {}]
    (#'property-value/date-picker-handle-delete!
     event
     {:block {:db/id 1}
      :property {:db/ident :user.property/due}
      :del-btn? true
      :on-delete (fn [_] (reset! cleared?* true))})
    (is (true? @cleared?*)
        "Backspace on a set date must clear the value, not drop the property.")))

(deftest date-picker-delete-on-empty-value-removes-property-test
  (let [cleared?* (atom false)
        removed-args* (atom nil)
        event #js {}
        block {:db/id 1}
        property {:db/ident :user.property/due}
        opts {:block block
              :property property
              :del-btn? false
              :on-delete (fn [_] (reset! cleared?* true))
              :view-parent {:db/ident :logseq.class/Task}}]
    (with-redefs [editor-handler/move-cross-boundary-up-down (constantly nil)
                  property-handler/remove-block-property!
                  (fn [& args] (reset! removed-args* args))]
      (#'property-value/date-picker-handle-delete! event opts)
      (is (false? @cleared?*))
      (is (= [1 :user.property/due {:preserve-task-tag? true}]
             @removed-args*)))))

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

(deftest scoped-class-nodes-skips-broad-node-property-preload-test
  (let [property {:logseq.property/type :node}
        page-class {:db/id 1
                    :db/ident :logseq.class/Page}
        tag-class {:db/id 2
                   :db/ident :logseq.class/Tag}]
    (is (= []
           (#'property-value/scoped-class-nodes
            property [page-class tag-class] nil {})))))

(deftest property-value-selected-detects-current-ref-value-test
  (is (true? (#'property-value/property-value-selected?
              [{:db/id 4
                :db/ident :logseq.class/Page}]
              4)))
  (is (false? (#'property-value/property-value-selected?
               [{:db/id 5
                 :db/ident :logseq.class/Tag}]
               4))))

(deftest property-multiple-values-treats-tags-as-many-test
  (is (true? (#'property-value/property-multiple-values?
              {:db/ident :block/tags})))
  (is (false? (#'property-value/property-multiple-values?
               {:db/ident :block/title}))))

(deftest get-operating-blocks-ignores-single-selected-block-test
  (let [target {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
        selected {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}]
    (with-redefs [state/get-selection-block-ids (constantly [(:block/uuid selected)])
                  state/get-selection-blocks (constantly [selected])
                  state/get-state (constantly nil)
                  block-handler/get-top-level-blocks identity]
      (is (= [target]
             (property-value/get-operating-blocks target))))))

(deftest get-operating-blocks-uses-current-multi-selection-test
  (let [target {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
        selected {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}]
    (with-redefs [state/get-selection-block-ids (constantly (map :block/uuid [target selected]))
                  state/get-selection-blocks (constantly [target selected])
                  state/get-state (constantly nil)
                  block-handler/get-top-level-blocks identity]
      (is (= [target selected]
             (property-value/get-operating-blocks target))))))

(deftest get-operating-blocks-prefers-view-selection-test
  (let [target {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
        stale-selected {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
        view-selected {:block/uuid #uuid "33333333-3333-3333-3333-333333333333"}]
    (with-redefs [state/get-selection-block-ids (constantly [(:block/uuid target) (:block/uuid stale-selected)])
                  state/get-selection-blocks (constantly [target stale-selected])
                  state/get-state (fn [key]
                                    (when (= key :view/selected-blocks)
                                      [view-selected]))
                  block-handler/get-top-level-blocks identity]
      (is (= [view-selected]
             (property-value/get-operating-blocks target))))))

(deftest get-operating-blocks-wraps-view-selection-uuids-test
  (let [target {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
        page-a #uuid "22222222-2222-2222-2222-222222222222"
        page-b #uuid "33333333-3333-3333-3333-333333333333"]
    (with-redefs [state/get-selection-block-ids (constantly [])
                  state/get-selection-blocks (constantly [])
                  state/get-state (fn [key]
                                    (when (= key :view/selected-blocks)
                                      [page-a page-b]))
                  block-handler/get-top-level-blocks identity]
      (is (= [{:block/uuid page-a} {:block/uuid page-b}]
             (property-value/get-operating-blocks target))))))

(deftest operating-block-ids-accepts-view-row-identities-test
  (let [page-a #uuid "22222222-2222-2222-2222-222222222222"
        page-b #uuid "33333333-3333-3333-3333-333333333333"]
    (is (= [page-a page-b]
           (#'property-value/operating-block-ids [page-a page-b]))
        "All-pages view rows are raw UUIDs.")
    (is (= [page-a page-b]
           (#'property-value/operating-block-ids [{:block/uuid page-a}
                                                  {:uuid page-b}]))
        "Worker maps may expose :uuid instead of :block/uuid.")))

(deftest batch-set-tags-uses-view-selection-uuids-test
  (async done
         (let [page-a #uuid "22222222-2222-2222-2222-222222222222"
               page-b #uuid "33333333-3333-3333-3333-333333333333"
               tag-id 1005
               block {:block/uuid page-a
                      :block/tags []}
               property {:db/ident :block/tags
                         :db/valueType :db.type/ref
                         :db/cardinality :db.cardinality/many}
               calls* (atom [])]
           (-> (p/with-redefs [state/get-current-repo (constantly "test")
                               state/get-selection-block-ids (constantly [])
                               state/get-state (fn [key]
                                                 (when (= key :view/selected-blocks)
                                                   [page-a page-b]))
                               db-async/<get-block (fn [_repo _block-ref _opts]
                                                     (p/resolved block))
                               db-property-handler/batch-set-property!
                               (fn [block-ids property-ident value opts]
                                 (swap! calls* conj [(vec block-ids) property-ident value opts])
                                 (p/resolved nil))]
                 (#'property-value/add-or-remove-property-value
                  block property tag-id false {}))
               (p/then (fn [_]
                         (is (= [[[page-a page-b]
                                  :block/tags
                                  tag-id
                                  {:entity-id? true}]]
                                @calls*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest scoped-class-nodes-filters-search-results-by-scoped-classes-test
  (let [property {:logseq.property/type :node}
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
    (is (= [matching-parent matching-child matching-wrapped matching-entity-tags]
           (#'property-value/scoped-class-nodes
            property
            [topic-class]
            [matching-parent matching-child matching-wrapped matching-entity-tags unrelated]
            {10 [11]})))))

(deftest scoped-class-nodes-keeps-hydrated-broad-scope-initial-choices-test
  (let [property {:logseq.property/type :node}
        page-class {:db/id 1
                    :db/ident :logseq.class/Page}
        matching-choice {:value {:db/id 100
                                 :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                                 :block/tags [1]}
                         :label "Existing page"}
        unrelated-choice {:value {:db/id 101
                                  :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                          :label "Unrelated block"}]
    (is (= [matching-choice]
           (#'property-value/scoped-class-nodes
            property [page-class] [matching-choice unrelated-choice] {})))))

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
           (-> (#'property-value/<load-initial-node-choices
                "repo"
                property
                (:logseq.property/classes property)
                (fn [property-ident]
                  (swap! queried-properties* conj property-ident)
                  (p/resolved existing-values))
                (fn [_repo _class-id]
                  (p/resolved [])))
               (p/then (fn [result]
                         (is (= [:user.property/p1] @queried-properties*))
                         (is (= existing-values result))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest load-initial-node-choices-loads-scoped-tag-objects-test
  (async done
         (let [property {:db/ident :user.property/p1
                         :logseq.property/type :node}
               classes [{:db/id 10
                         :db/ident :user.class/Topic}
                        {:db/id 11
                         :db/ident :user.class/Task}]
               topic-choices [{:db/id 100
                               :block/title "Topic"}]
               task-choices [{:db/id 101
                              :block/title "Task"}]
               queried-classes* (atom [])]
           (-> (#'property-value/<load-initial-node-choices
                "repo"
                property
                classes
                (fn [_property-ident]
                  (p/resolved []))
                (fn [_repo class-id]
                  (swap! queried-classes* conj class-id)
                  (p/resolved
                   (case class-id
                     10 topic-choices
                     11 task-choices))))
               (p/then (fn [result]
                         (is (= [10 11] @queried-classes*))
                         (is (= (concat topic-choices task-choices) result))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(defn- <create-scoped-page-value
  "Runs <create-page-if-not-exists! for a node property scoped to #Kestrel
   against `conn` and returns [chosen-id create-calls]"
  [conn page-name]
  (let [kestrel (db-test/find-page-by-title @conn "Kestrel")
        heron (db-test/find-page-by-title @conn "Heron")
        property {:db/ident :user.property/employer
                  :logseq.property/type :node
                  :logseq.property/classes [kestrel]}
        create-calls* (atom [])]
    (p/let [id (p/with-redefs [state/get-current-repo (constantly "test")
                               state/<invoke-db-worker
                               (fn [api _repo [query & inputs]]
                                 (is (= :thread-api/q api))
                                 (p/resolved (apply d/q query @conn inputs)))
                               db-async/<get-block
                               (fn [_repo page-name' _opts]
                                 (p/resolved (ldb/get-page @conn page-name')))
                               page-handler/<create!
                               (fn [title opts]
                                 (swap! create-calls* conj [title opts])
                                 (p/resolved {:db/id 999}))]
                 (#'property-value/<create-page-if-not-exists!
                  {:db/id 1} property [kestrel]
                  {:extends-by-class-id {}
                   :structured-children-by-class-id (if heron
                                                      {(:db/id kestrel) [(:db/id heron)]}
                                                      {})}
                  page-name))]
      [id @create-calls*])))

(deftest create-page-value-skips-same-name-page-outside-property-classes-test
  (async done
         (let [conn (db-test/create-conn-with-blocks
                     {:classes {:Kestrel {} :Lantern {}}
                      :pages-and-blocks [{:page {:block/title "Juniper" :build/tags [:Lantern]}}]})
               kestrel (db-test/find-page-by-title @conn "Kestrel")]
           (-> (<create-scoped-page-value conn "Juniper")
               (p/then (fn [[id create-calls]]
                         (is (= 999 id)
                             "A same-name page tagged with another class is not reused")
                         (is (= [["Juniper" {:redirect? false
                                             :tags [(:block/uuid kestrel)]}]]
                                create-calls)
                             "The new page is tagged with the property class")
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest create-page-value-reuses-same-name-page-with-property-class-test
  (async done
         (let [conn (db-test/create-conn-with-blocks
                     {:classes {:Kestrel {}
                                :Heron {:build/class-extends [:Kestrel]}
                                :Lantern {}}
                      :pages-and-blocks [{:page {:block/title "Juniper" :build/tags [:Lantern]}}
                                         {:page {:block/title "Juniper" :build/tags [:Heron]}}]})
               heron-page-id (d/q '[:find ?p .
                                    :where
                                    [?p :block/title "Juniper"]
                                    [?p :block/tags ?t]
                                    [?t :block/title "Heron"]]
                                  @conn)]
           (-> (<create-scoped-page-value conn "juniper")
               (p/then (fn [[id create-calls]]
                         (is (= heron-page-id id)
                             "A same-name page tagged with a class extending the property class is reused")
                         (is (empty? create-calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest parse-positive-int-test
  (is (= 1 (#'property-value/parse-positive-int "1")))
  (is (= 12 (#'property-value/parse-positive-int " 12 ")))
  (is (nil? (#'property-value/parse-positive-int "0")))
  (is (nil? (#'property-value/parse-positive-int "-2")))
  (is (nil? (#'property-value/parse-positive-int "1.5")))
  (is (nil? (#'property-value/parse-positive-int "")))
  (is (nil? (#'property-value/parse-positive-int nil))))

(deftest select-ref-id-test
  (is (= 83 (#'property-value/select-ref-id 83)))
  (is (= 83 (#'property-value/select-ref-id {:db/id 83})))
  (is (= 83 (#'property-value/select-ref-id {:value 83})))
  (is (= 83 (#'property-value/select-ref-id "83")))
  (is (= 83 (#'property-value/select-ref-id #js {:value 83})))
  (is (= 83 (#'property-value/select-ref-id #js {:value "83"})))
  (is (= 83 (#'property-value/select-ref-id #js {:label "Status" :value 83})))
  (is (nil? (#'property-value/select-ref-id "83abc")))
  (is (nil? (#'property-value/select-ref-id "Status")))
  (is (nil? (#'property-value/select-ref-id nil))))

(deftest property-select-label-test
  (is (= "Priority" (#'property-value/property-select-label {:block/title "Priority"})))
  (is (nil? (#'property-value/property-select-label {:db/id 83}))))

(deftest repeat-frequency-value-test
  (is (= 1 (#'property-value/repeat-frequency-value {})))
  (is (= 3 (#'property-value/repeat-frequency-value
            {:logseq.property.repeat/recur-frequency 3})))
  (is (= 4 (#'property-value/repeat-frequency-value
            {:logseq.property.repeat/recur-frequency {:logseq.property/value 4}}))))

(deftest repeat-unit-value-id-test
  (let [day {:db/id 21 :db/ident :logseq.property.repeat/recur-unit.day}
        week {:db/id 22 :db/ident :logseq.property.repeat/recur-unit.week}
        property {:property/closed-values [day week]
                  :logseq.property/default-value day}]
    (is (= 22 (#'property-value/repeat-unit-value-id
               {:logseq.property.repeat/recur-unit week}
               property)))
    (is (= 21 (#'property-value/repeat-unit-value-id {} property)))
    (is (= 21 (#'property-value/repeat-unit-value-id
               {}
               (dissoc property :logseq.property/default-value))))))

(deftest repeat-unit-choices-hide-time-units-for-date-properties-test
  (let [minute {:db/id 1 :db/ident :logseq.property.repeat/recur-unit.minute}
        hour {:db/id 2 :db/ident :logseq.property.repeat/recur-unit.hour}
        day {:db/id 3 :db/ident :logseq.property.repeat/recur-unit.day}
        week {:db/id 4 :db/ident :logseq.property.repeat/recur-unit.week}
        property {:property/closed-values [minute hour day week]}
        idents (fn [block property-type]
                 (map :db/ident
                      (#'property-value/repeat-unit-choices
                       block
                       {:logseq.property/type property-type}
                       property)))]
    (is (= [:logseq.property.repeat/recur-unit.day
            :logseq.property.repeat/recur-unit.week]
           (idents {} :date)))
    (is (= [:logseq.property.repeat/recur-unit.minute
            :logseq.property.repeat/recur-unit.hour
            :logseq.property.repeat/recur-unit.day
            :logseq.property.repeat/recur-unit.week]
           (idents {} :datetime)))
    (is (= [:logseq.property.repeat/recur-unit.minute
            :logseq.property.repeat/recur-unit.day
            :logseq.property.repeat/recur-unit.week]
           (idents {:logseq.property.repeat/recur-unit minute} :date))
        "Keep a persisted minute/hour unit visible until the user changes it")))

(deftest repeat-unit-choices-use-compact-or-worker-idents-test
  (let [minute {:db/id 1 :db-ident :logseq.property.repeat/recur-unit.minute}
        hour {:db/id 2 :db/ident :logseq.property.repeat/recur-unit.hour}
        day {:db/id 3 :db/ident :logseq.property.repeat/recur-unit.day}
        property {:property/closed-values [minute hour day]}]
    (is (= [day]
           (#'property-value/repeat-unit-choices
            {}
            {:logseq.property/type :date}
            property)))))

(deftest repeat-setting-clears-stale-when-selection-test
  (let [stale-when-id 90
        calls* (atom [])
        hook-index* (atom 0)
        block {:db/id 1
               :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
               :logseq.property.repeat/repeated? true}
        status-property {:db/id 10
                         :db/ident :logseq.property/status
                         :property/closed-values
                         [{:db/id 11
                           :block/title "Done"
                           :logseq.property/choice-checkbox-state true}]}
        repeat-properties {:recur-frequency-property {:db/id 20
                                                      :db/ident :logseq.property.repeat/recur-frequency}
                           :recur-unit-property {:db/id 21
                                                 :db/ident :logseq.property.repeat/recur-unit
                                                 :property/closed-values
                                                 [{:db/id 22
                                                   :db/ident :logseq.property.repeat/recur-unit.day
                                                   :block/title "Day"}]}
                           :repeat-type-property {:db/id 30
                                                  :db/ident :logseq.property.repeat/repeat-type
                                                  :logseq.property/type :default}
                           :status-property status-property
                           :status-done {:db/id 11
                                         :block/title "Done"}
                           :full-properties [status-property]}]
    (with-redefs [state/get-current-repo (constantly "test")
                  db-hooks/use-block (constantly block)
                  property-value/property-value (fn [& _args] [:span])
                  hooks/use-memo (fn [f _deps] (f))
                  hooks/use-effect! (fn [f deps]
                                      (when (= deps [nil])
                                        (f)))
                  hooks/use-state (fn [init]
                                    (case (swap! hook-index* inc)
                                      1 [init (fn [_])]
                                      2 [stale-when-id #(swap! calls* conj [:when-id %])]
                                      3 [repeat-properties (fn [_])]
                                      [init (fn [_])]))]
      (render-static
       (property-value/repeat-setting block {:db/id 40
                                             :db/ident :logseq.property/scheduled
                                             :logseq.property/type :date}))
      (is (some #{[:when-id nil]} @calls*)
          "When the block no longer has a checked-property, stale local selection is cleared."))))

(deftest repeat-every-controls-clears-stale-unit-selection-test
  (let [stale-unit-id 90
        calls* (atom [])
        hook-index* (atom 0)
        block {:db/id 1
               :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
        week {:db/id 22
              :db/ident :logseq.property.repeat/recur-unit.week
              :block/title "Week"}
        recur-frequency-property {:db/id 20
                                  :db/ident :logseq.property.repeat/recur-frequency}
        recur-unit-property {:db/id 21
                             :db/ident :logseq.property.repeat/recur-unit
                             :property/closed-values [week]}]
    (with-redefs [hooks/use-memo (fn [f _deps] (f))
                  hooks/use-effect! (fn [f deps]
                                      (when (= deps [nil])
                                        (f)))
                  hooks/use-state (fn [init]
                                    (case (swap! hook-index* inc)
                                      1 [init (fn [_])]
                                      2 [stale-unit-id #(swap! calls* conj [:unit-id %])]
                                      [init (fn [_])]))]
      (render-static
       (property-value/repeat-every-controls
        block
        {:db/id 40
         :db/ident :logseq.property/scheduled
         :logseq.property/type :date}
        recur-frequency-property
        recur-unit-property))
      (is (some #{[:unit-id nil]} @calls*)
          "When the block no longer has a recur unit, stale local selection is cleared."))))
