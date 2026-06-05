(ns frontend.state-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.state.config :as state-config]
            [frontend.state.core :as state-core]
            [frontend.state.editor :as state-editor]
            [frontend.state.graph :as state-graph]
            [frontend.state.init :as state-init]
            [frontend.state.search :as state-search]
            [frontend.state.sidebar :as state-sidebar]
            [frontend.state.sync :as state-sync]))

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

(deftest state-core-module-shares-the-existing-app-state
  (let [original-state @state/state]
    (try
      (is (identical? state/state state-core/state))
      (is (= @state/state (state-init/initial-state)))
      (state-core/replace-state! {:module-value 1
                                  :nested {:value 2}})

      (is (= 1 (state/get-state :module-value)))
      (is (= 2 (state-core/get-state [:nested :value])))

      (state-core/set-state! :module-value 3)
      (is (= 3 (state/get-state :module-value)))
      (is (= 3 (:module-value (rfx/snapshot))))

      (state-core/update-state! [:nested :value] inc)
      (is (= 3 (state/get-state [:nested :value])))
      (is (= 3 (get-in (rfx/snapshot) [:nested :value])))
      (finally
        (state/replace-state! original-state)))))

(deftest state-domain-modules-preserve-config-and-graph-accessors
  (let [original-state @state/state
        repo "logseq-local-test-graph"]
    (try
      (state/replace-state! (assoc original-state
                                   :git/current-repo repo
                                   :config {repo {:ui/enable-tooltip? false}}))

      (is (= (state/merge-configs {:shortcuts {:ui/toggle-theme "t z"}}
                                  {:shortcuts {:ui/toggle-brackets "t b"}})
             (state-config/merge-configs {:shortcuts {:ui/toggle-theme "t z"}}
                                         {:shortcuts {:ui/toggle-brackets "t b"}})))
      (is (= repo (state-graph/get-current-repo)))
      (is (false? (:ui/enable-tooltip? (state-config/get-config repo))))
      (finally
        (state/replace-state! original-state)))))

(deftest state-editor-module-preserves-editor-info
  (let [selected-ids [(random-uuid) (random-uuid)]]
    (with-redefs [state/get-edit-block (constantly nil)
                  state/get-selection-block-ids (constantly selected-ids)
                  state/get-selection-direction (constantly :up)]
      (is (= {:selected-block-uuids selected-ids
              :selection-direction :up}
             (state-editor/get-editor-info))))))

(deftest state-sidebar-and-search-modules-share-state-mutations
  (let [original-state @state/state]
    (try
      (state/replace-state! (assoc original-state
                                   :search/result nil
                                   :search/mode nil
                                   :ui/sidebar-open? false
                                   :sidebar/blocks '()))

      (state-search/set-search-result! {:items [1 2]})
      (is (= {:items [1 2]} (state/get-state :search/result)))

      (state-search/set-search-mode! :global {:action :search})
      (is (= :global (state/get-state :search/mode)))
      (is (= {:action :search} (state/get-state :search/args)))

      (state-sidebar/hide-right-sidebar!)
      (is (false? (state/get-state :ui/sidebar-open?)))
      (finally
        (state/replace-state! original-state)))))

(deftest state-sync-module-preserves-nested-conflict-writes
  (let [original-state @state/state
        repo "logseq-local-test-graph"
        block-id (random-uuid)
        conflicts [{:id 1}]]
    (try
      (state/replace-state! (assoc original-state :sync/block-conflicts {}))
      (state-sync/set-sync-block-conflicts! repo block-id conflicts)
      (is (= conflicts
             (get-in (state/get-state :sync/block-conflicts)
                     [repo (str block-id)])))
      (finally
        (state/replace-state! original-state)))))
