(ns frontend.state-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.rfx :as rfx]
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
        editor-content (state/get-state :editor/content)
        last-saved-cursor (state/get-state :editor/last-saved-cursor)
        watch-key (keyword (str "caret-pos-" block-id))
        observed-pos (atom nil)]
    (set! (.-setSelectionRange input)
          (fn [start end]
            (set! (.-selectionStart input) start)
            (set! (.-selectionEnd input) end)))
    (add-watch state/state watch-key
               (fn [_ _ _ db]
                 (when (= updated-content (get-in db [:editor/content block-id]))
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
        (remove-watch state/state watch-key)
        (state/set-state! :editor/content editor-content)
        (state/set-state! :editor/last-saved-cursor last-saved-cursor)))))

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

(deftest container-id-is-stable-for-an-equal-render-context
  (let [original-state @state/state
        context {:db/id 42 :journals? true}]
    (try
      (let [initial-state (assoc original-state
                                 :ui/container-id 0
                                 :ui/cached-key->container-id {})]
        (reset! state/state initial-state)
        (rfx/init! {:initial-value initial-state
                    :registry (atom {})})
        (is (= 1 (state/get-container-id context)))
        (is (= 1 (state/get-container-id (into {} context)))
            "A page rerender must keep editor subscriptions on the same container.")
        (is (= {context 1}
               (state/get-state :ui/cached-key->container-id))))
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

(deftest sync-block-conflicts-bulk-state-replaces-one-repo-test
  (let [original-state @state/state
        repo-a "graph-a"
        repo-b "graph-b"
        block-a (str (random-uuid))
        block-b (str (random-uuid))
        old-conflicts [{:value "old"}]
        new-conflicts [{:value "new"}]
        initial-state (assoc original-state
                             :sync/block-conflicts
                             {repo-a {block-a old-conflicts}
                              repo-b {block-b old-conflicts}})]
    (try
      (reset! state/state initial-state)
      (rfx/init! {:initial-value initial-state
                  :registry (atom {})})
      (let [result (try
                     (apply state/set-sync-block-conflicts!
                            [repo-a {block-b new-conflicts}])
                     :ok
                     (catch :default _error
                       :unsupported))]
        (is (= :ok result)
            "Sync conflict hydration must support one bulk replacement per graph.")
        (when (= :ok result)
          (is (= {repo-a {block-b new-conflicts}
                  repo-b {block-b old-conflicts}}
                 (state/get-state :sync/block-conflicts))
              "Hydration replaces stale entries for one graph and preserves other graphs.")
          (apply state/set-sync-block-conflicts! [repo-a {}])
          (is (= {}
                 (state/get-state [:sync/block-conflicts repo-a]))
              "An empty hydration result clears stale conflicts after graph reset.")
          (is (thrown? js/Error
                       (apply state/set-sync-block-conflicts! [repo-a nil]))
              "Missing worker data must fail instead of silently clearing state.")))
      (finally
        (reset! state/state original-state)
        (rfx/init! {:initial-value original-state
                    :registry (atom {})})))))

(deftest delete-repo-clears-only-that-repos-sync-conflicts-test
  (let [original-state @state/state
        repo-a {:url "graph-a"}
        repo-b {:url "graph-b"}
        block-id (str (random-uuid))
        conflicts [{:value "conflict"}]
        initial-state (assoc original-state
                             :me {:repos [repo-a repo-b]}
                             :sync/block-conflicts
                             {(:url repo-a) {block-id conflicts}
                              (:url repo-b) {block-id conflicts}})]
    (try
      (reset! state/state initial-state)
      (rfx/init! {:initial-value initial-state
                  :registry (atom {})})
      (state/delete-repo! repo-a)
      (is (= [repo-b]
             (state/get-state [:me :repos])))
      (is (= {(:url repo-b) {block-id conflicts}}
             (state/get-state :sync/block-conflicts))
          "Removing a graph must remove its hydrated conflicts without touching another graph.")
      (finally
        (reset! state/state original-state)
        (rfx/init! {:initial-value original-state
                    :registry (atom {})})))))

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
