(ns frontend.modules.outliner.pipeline-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.db.subs :as db-subs]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.state :as state]))

(deftest sync-change-event-does-not-skip-local-hooks
  (let [source (.toString
                (fs/readFileSync
                 (node-path/join (.cwd js/process)
                                 "src/main/frontend/handler/events.cljs")
                 "utf8"))]
    (is (not (string/includes? source "(when-not local-outliner-op?"))
        "The direct worker response replaces UI publication, not transaction hooks.")
    (is (string/includes? source "(pipeline/invoke-hooks data)"))))

(deftest compact-worker-broadcast-applies-the-exact-delta-once-and-keeps-page-events-test
  (let [original-state @state/state
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
      (reset! state/state {:client-id "client"})
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
        (reset! state/state original-state)))))

(deftest renderer-delta-entry-points-do-not-reference-the-legacy-transaction-marker-test
  (doseq [relative-path ["src/main/frontend/db/transact.cljs"
                         "src/main/frontend/modules/outliner/pipeline.cljs"]]
    (let [source (.toString
                  (fs/readFileSync
                   (node-path/join (.cwd js/process) relative-path)
                   "utf8"))]
      (is (not (string/includes? source ":db/latest-transacted-entity-uuids"))
          (str relative-path " must not read or write the removed renderer marker.")))))
