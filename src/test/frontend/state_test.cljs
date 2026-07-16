(ns frontend.state-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.rfx :as rfx]
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

(deftest get-state-reads-plain-state
  (let [original-state @state/state]
    (try
      (reset! state/state (assoc original-state
                                 :plain-value 1
                                 :nested-value {:a {:b 2}}
                                 :nested-path-value {:a {:b 4}}))
      (rfx/init! {:initial-value @state/state
                  :registry (atom {})})
      (is (= 1 (state/get-state :plain-value)))
      (is (= 2 (state/get-state [:nested-value :a :b])))
      (is (= 4 (state/get-state :nested-path-value :nested-path [:a :b])))
      (finally
        (reset! state/state original-state)
        (rfx/init! {:initial-value original-state
                    :registry (atom {})})))))

(deftest plain-state-accessors-use-rfx-app-db
  (let [original-state @state/state]
    (try
      (reset! state/state {:legacy-value 1
                           :nested {:value 2}})
      (rfx/init! {:initial-value {:legacy-value 10
                                  :nested {:value 20}}
                  :registry (atom {})})

      (is (= 10 (state/get-state :legacy-value)))
      (is (= 20 (state/get-state [:nested :value])))

      (state/set-state! :legacy-value 30)
      (is (= 30 (state/get-state :legacy-value)))
      (is (= 30 (:legacy-value (rfx/snapshot))))

      (state/update-state! [:nested :value] inc)
      (is (= 21 (state/get-state [:nested :value])))
      (is (= 21 (get-in (rfx/snapshot) [:nested :value])))
      (finally
        (reset! state/state original-state)
        (rfx/init! {:initial-value original-state
                    :registry (atom {})})))))

(deftest rfx-state-subscriptions-read-top-level-and-nested-paths
  (let [original-state @state/state]
    (try
      (rfx/init! {:initial-value {:route-match {:data {:name :home}}
                                  :ui/theme "light"}
                  :registry (atom {})})
      (state/register-rfx-state-subs!)

      (is (= {:data {:name :home}}
             (rfx/snapshot-sub [:route-match])))
      (is (= :home
             (rfx/snapshot-sub [:route-match :data :name])))
      (is (= "light"
             (rfx/snapshot-sub [:ui/theme])))
      (finally
        (reset! state/state original-state)
        (rfx/init! {:initial-value original-state
                    :registry (atom {})})
        (state/register-rfx-state-subs!)))))

(deftest rfx-state-subscriptions-read-plain-values
  (let [original-state @state/state]
    (try
      (rfx/init! {:initial-value {:editor/action :search
                                  :editor/content {:block-1 "hello"}}
                  :registry (atom {})})
      (state/register-rfx-state-subs!)

      (is (= :search
             (rfx/snapshot-sub [:editor/action])))
      (is (= "hello"
             (rfx/snapshot-sub [:editor/content :block-1])))
      (finally
        (reset! state/state original-state)
        (rfx/init! {:initial-value original-state
                    :registry (atom {})})
        (state/register-rfx-state-subs!)))))

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

(deftest edit-block-fn-queue-uses-plain-state
  (let [original-state @state/state
        calls (atom [])
        edit-block-f #(swap! calls conj :edit-block)]
    (try
      (state/replace-state! (assoc original-state :editor/edit-block-fn nil))
      (state/queue-edit-block-fn! edit-block-f)

      (let [queued-f (state/take-edit-block-fn!)]
        (is (= edit-block-f queued-f))
        (queued-f)
        (is (= [:edit-block] @calls))
        (is (= [] (state/get-state :editor/edit-block-fn))))
      (finally
        (state/replace-state! original-state)))))
