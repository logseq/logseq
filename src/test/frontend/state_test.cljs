(ns frontend.state-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.state :as state]))

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
