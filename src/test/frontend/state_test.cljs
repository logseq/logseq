(ns frontend.state-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]))

(defn- caret-pos-when-editor-content-changes
  [initial-content updated-content new-pos]
  (let [block-id (random-uuid)
        input-id (str "edit-block-" block-id)
        input #js {:id input-id
                   :value initial-content
                   :selectionStart 2
                   :selectionEnd 2}
        editor-content (:editor/content @state/state)
        last-saved-cursor (:editor/last-saved-cursor @state/state)
        watch-key (keyword (str "caret-pos-" block-id))
        observed-pos (atom nil)]
    (set! (.-setSelectionRange input)
          (fn [start end]
            (set! (.-selectionStart input) start)
            (set! (.-selectionEnd input) end)))
    (add-watch editor-content watch-key
               (fn [_ _ _ content-by-block]
                 (when (= updated-content (get content-by-block block-id))
                   (reset! observed-pos (cursor/pos input)))))
    (try
      (with-redefs [state/get-edit-block (constantly {:block/uuid block-id})
                    gdom/getElement (constantly input)
                    util/set-change-value
                    (fn [node value & [caret-pos]]
                      ;; Match the browser value setter, which moves the caret to the end.
                      (set! (.-value node) value)
                      (.setSelectionRange node (count value) (count value))
                      (when (number? caret-pos)
                        (.setSelectionRange node caret-pos caret-pos))
                      ;; Match the synchronous React change handler.
                      (state/set-edit-content! input-id value false))]
        (state/set-block-content-and-last-pos! input-id updated-content new-pos))
      {:observed-pos @observed-pos
       :final-pos (cursor/pos input)}
      (finally
        (remove-watch editor-content watch-key)
        (swap! editor-content dissoc block-id)
        (swap! last-saved-cursor dissoc block-id)))))

(deftest set-block-content-exposes-new-caret-before-content-change
  (testing "Caret before trailing page-reference brackets"
    (is (= {:observed-pos 8 :final-pos 8}
           (caret-pos-when-editor-content-changes "[[]]" "[[foobar]]" 8))))

  (testing "Caret at the end of the updated content"
    (is (= {:observed-pos 6 :final-pos 6}
           (caret-pos-when-editor-content-changes "" "foobar" 6)))))

(deftest merge-configs
  (let [global-config
        {:shortcuts {:ui/toggle-theme "t z"}
         :ui/enable-tooltip? true}
        local-config {:ui/enable-tooltip? false}]
    (is (= local-config
           (dissoc (state/merge-configs global-config local-config) :shortcuts))
        "Later config overrides all non-map values")
    (is (= {:start-of-week 6 :shortcuts {:ui/toggle-theme "t z"}}
           (select-keys (state/merge-configs {:start-of-week 6}
                                             global-config
                                             local-config)
                        [:start-of-week :shortcuts]))
        "Earlier configs set default values"))

  (is (= {:shortcuts {:ui/toggle-theme "t z"
                      :ui/toggle-brackets "t b"
                      :editor/up ["ctrl+p" "up"]}}
         (state/merge-configs {:shortcuts {:ui/toggle-theme "t z"}}
                              {:shortcuts {:ui/toggle-brackets "t b"}}
                              {:shortcuts {:editor/up ["ctrl+p" "up"]}}))
      "Map values get merged across configs"))

(deftest get-state-reads-plain-and-atom-state
  (let [original-state @state/state]
    (try
      (reset! state/state (assoc original-state
                                 :plain-value 1
                                 :nested-value {:a {:b 2}}
                                 :atom-value (atom 3)
                                 :nested-atom-value (atom {:a {:b 4}})))
      (is (= 1 (state/get-state :plain-value)))
      (is (= 2 (state/get-state [:nested-value :a :b])))
      (is (= 3 (state/get-state :atom-value)))
      (is (= 4 (state/get-state :nested-atom-value :path-in-sub-atom [:a :b])))
      (finally
        (reset! state/state original-state)))))

(deftest get-editor-info-includes-selection-when-not-editing-test
  (let [selected-ids [(random-uuid) (random-uuid)]]
    (with-redefs [state/get-edit-block (constantly nil)
                  state/get-selection-block-ids (constantly selected-ids)
                  state/get-selection-direction (constantly :down)]
      (is (= {:selected-block-uuids selected-ids
              :selection-direction :down}
             (state/get-editor-info))))))

(deftest get-editor-info-returns-nil-when-not-editing-and-no-selection-test
  (with-redefs [state/get-edit-block (constantly nil)
                state/get-selection-block-ids (constantly nil)
                state/get-selection-direction (constantly nil)]
    (is (nil? (state/get-editor-info)))))
