(ns mobile.selection-toolbar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [mobile.components.selection-toolbar :as selection-toolbar]))

(deftest selection-actions-include-reaction
  (testing "selected block can open the reaction picker from the mobile selection bar"
    (let [block-uuid (random-uuid)
          block-node #js {}
          events (atom [])
          closed? (atom false)]
      (with-redefs [selection-toolbar/selected-blocks (constantly [{:block/uuid block-uuid}])
                    state/get-selection-blocks (constantly [block-node])
                    state/pub-event! (fn [event]
                                       (swap! events conj event)
                                       nil)
                    editor-handler/clear-selection! #(reset! closed? true)
                    state/set-state! (fn [& _args])
                    selection-toolbar/dismiss-action-bar! (fn [])]
        (let [actions (#'selection-toolbar/selection-actions)
              action (some #(when (= "reaction" (:id %)) %) actions)]
          (is (some? action))
          (is (= (t :mobile.toolbar/reaction) (:label action)))
          (when action
            ((:handler action))
            (is (= [[:editor/new-reaction {:block {:block/uuid block-uuid}
                                            :target block-node}]]
                   @events))
            (is (true? @closed?))))))))

(deftest selection-actions-include-reaction-for-multiple-blocks
  (testing "selected blocks can open the reaction picker from the mobile selection bar"
    (let [block-uuid-1 (random-uuid)
          block-uuid-2 (random-uuid)
          block-node #js {}
          events (atom [])
          closed? (atom false)]
      (with-redefs [selection-toolbar/selected-blocks (constantly [{:block/uuid block-uuid-1}
                                                                    {:block/uuid block-uuid-2}])
                    state/get-selection-blocks (constantly [block-node])
                    state/pub-event! (fn [event]
                                       (swap! events conj event)
                                       nil)
                    editor-handler/clear-selection! #(reset! closed? true)
                    state/set-state! (fn [& _args])
                    selection-toolbar/dismiss-action-bar! (fn [])]
        (let [actions (#'selection-toolbar/selection-actions)
              action (some #(when (= "reaction" (:id %)) %) actions)]
          (is (some? action))
          (when action
            ((:handler action))
            (is (= [[:editor/new-reaction {:blocks [{:block/uuid block-uuid-1}
                                                     {:block/uuid block-uuid-2}]
                                            :target block-node}]]
                   @events))
            (is (true? @closed?))))))))
