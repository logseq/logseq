(ns frontend.modules.outliner.pipeline-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.db.react :as react]
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

(deftest handled-local-response-skips-only-direct-response-work
  (let [original-state @state/state
        state-calls (atom [])
        refresh-calls (atom [])
        affected-keys [[:frontend.worker.react/block 1]
                       [:frontend.worker.react/journals]
                       [:frontend.worker.react/refs 2]
                       [:custom :query]]
        repo "test"
        tx-meta {:client-id "client"
                 :ui/handled-by-response? true}]
    (try
      (reset! state/state {:client-id "client"})
      (with-redefs [state/get-current-repo (constantly repo)
                    state/get-current-page (constantly nil)
                    state/set-state! (fn [& args]
                                       (swap! state-calls conj args))
                    react/refresh! (fn [& args]
                                     (swap! refresh-calls conj args))]
        (pipeline/invoke-hooks {:repo repo
                                :tx-meta tx-meta
                                :affected-keys affected-keys
                                :blocks []})
        (is (not-any? #(= :db/latest-transacted-entity-uuids (first %))
                      @state-calls))
        (is (some #(= :editor/start-pos (first %)) @state-calls))
        (is (= [[repo [[:frontend.worker.react/refs 2]
                       [:custom :query]]]]
               @refresh-calls)))
      (finally
        (reset! state/state original-state)))))
