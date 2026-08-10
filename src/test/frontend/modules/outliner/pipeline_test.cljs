(ns frontend.modules.outliner.pipeline-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.subs :as db-subs]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.state :as state]))

(deftest compact-worker-broadcast-applies-the-exact-delta-once-and-keeps-page-events-test
  (let [original-state (state/get-state)
        state-calls (atom [])
        applied-deltas (atom [])
        published-events (atom [])
        repo "broadcast-render-delta-test"
        delta {:graph-id repo
               :rev 7
               :blocks {}
               :deleted {}
               :children {}
               :affected-keys #{[:graph]}}
        rename-data {:old-name "before" :new-name "after"}
        tx-meta {:client-id "client"
                 :outliner-op :rename-page
                 :data rename-data}]
    (try
      (state/replace-state! {:client-id "client"})
      (with-redefs [db-subs/apply-delta! (fn [value]
                                           (swap! applied-deltas conj value)
                                           true)
                    state/get-current-repo (constantly repo)
                    state/get-current-page (constantly nil)
                    state/set-state! (fn [& args]
                                       (swap! state-calls conj args))
                    state/pub-event! (fn [event]
                                       (swap! published-events conj event))]
        (pipeline/invoke-hooks {:repo repo
                                :tx-meta tx-meta
                                :delta delta})
        (is (= 1 (count @applied-deltas)))
        (is (identical? delta (first @applied-deltas))
            "The broadcast entry point must pass the worker-owned delta through untouched.")
        (is (not-any? #(= :db/latest-transacted-entity-uuids (first %))
                      @state-calls))
        (is (= [[:page/renamed repo rename-data]] @published-events)
            "Page lifecycle events remain a narrow non-renderer side effect."))
      (finally
        (state/replace-state! original-state)))))

(deftest deleted-blocks-are-removed-from-the-sidebar-test
  (let [original-state (state/get-state)
        removed-ids (atom nil)
        repo "sidebar-tombstone-test"
        deleted-uuid (random-uuid)
        delta {:graph-id repo
               :rev 9
               :blocks {}
               :deleted {deleted-uuid {:rev 9 :db/id 42}}
               :children {}
               :affected-keys #{}}
        tx-meta {:client-id "client"}]
    (try
      (state/replace-state! {:client-id "client"})
      (with-redefs [db-subs/apply-delta! (constantly true)
                    state/get-current-repo (constantly repo)
                    state/get-current-page (constantly nil)
                    state/sidebar-remove-deleted-block! (fn [ids]
                                                          (reset! removed-ids ids))]
        (pipeline/invoke-hooks {:repo repo
                                :tx-meta tx-meta
                                :delta delta})
        (is (= [42] @removed-ids)
            "Deleted block tombstones drop the matching sidebar entries."))
      (finally
        (state/replace-state! original-state)))))
