(ns logseq.tasks.dev-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is run-tests]]
            [logseq.tasks.dev :as dev]
            [logseq.tasks.dev.lint :as dev-lint]))

(deftest lint-and-test-starts-tests-while-lint-is-running
  (let [lint-started (promise)
        test-started (promise)
        release-tasks (promise)
        parallel-test-args (atom nil)]
    (with-redefs [dev-lint/dev (fn []
                                 (deliver lint-started true)
                                 @test-started
                                 @release-tasks)
                  dev/parallel-test (fn [& args]
                                      (reset! parallel-test-args args)
                                      (deliver test-started true)
                                      @lint-started
                                      @release-tasks)]
      (let [runner (future (dev/lint-and-test))]
        (is (deref lint-started 1000 false))
        (is (deref test-started 100 false))
        (deliver test-started true)
        (deliver release-tasks true)
        @runner
        (is (= ["-e" "long" "-e" "fix-me"] @parallel-test-args))))))

(def test-namespaces
  ["frontend.alpha-test"
   "frontend.beta-test"
   "frontend.gamma-test"
   "frontend.delta-test"
   "frontend.epsilon-test"])

(deftest run-test-namespaces-batches-namespaces-across-workers
  (let [started-node-runs (atom [])]
    (with-redefs [dev/test-jobs 2
                  dev/test-batches-per-job 1
                  dev/run-shell (fn [& args]
                                  (let [cmd-args (mapv str args)]
                                    (if (some #{"--list-namespaces"} cmd-args)
                                      {:out (string/join "\n" test-namespaces)}
                                      (swap! started-node-runs conj cmd-args))))]
      (dev/run-test-namespaces)
      (is (= 2 (count @started-node-runs)))
      (is (= (set test-namespaces)
             (->> @started-node-runs
                  (mapcat identity)
                  (filter (set test-namespaces))
                  set))))))

(deftest run-test-namespaces-isolates-stateful-namespaces
  (let [namespaces ["frontend.alpha-test"
                    "frontend.components.block.drop-boundary-test"
                    "frontend.handler.editor-test"
                    "frontend.worker.db-core-test"]
        started-node-runs (atom [])]
    (with-redefs [dev/test-jobs 2
                  dev/test-batches-per-job 1
                  dev/run-shell (fn [& args]
                                  (let [cmd-args (mapv str args)]
                                    (if (some #{"--list-namespaces"} cmd-args)
                                      {:out (string/join "\n" namespaces)}
                                      (swap! started-node-runs conj cmd-args))))]
      (dev/run-test-namespaces)
      (is (= 4 (count @started-node-runs)))
      (doseq [isolated-ns ["frontend.components.block.drop-boundary-test"
                           "frontend.handler.editor-test"
                           "frontend.worker.db-core-test"]]
        (is (= 1 (count (filter #(some #{isolated-ns} %) @started-node-runs))))
        (is (= 1 (->> @started-node-runs
                      (some #(when (some #{isolated-ns} %) %))
                      (filter (set namespaces))
                      count)))))))

(deftest run-test-namespaces-runs-performance-tests-after-parallel-tests
  (let [namespaces ["frontend.alpha-test"
                    "frontend.db.query-dsl-test"
                    "frontend.worker.search-test"]
        completed-runs (atom [])
        parallel-finished? (atom false)]
    (with-redefs [dev/test-jobs 2
                  dev/test-batches-per-job 1
                  dev/run-shell (fn [& args]
                                  (let [cmd-args (mapv str args)]
                                    (if (some #{"--list-namespaces"} cmd-args)
                                      {:out (string/join "\n" namespaces)}
                                      (let [selected (filter (set namespaces) cmd-args)]
                                        (when (some #{"frontend.alpha-test"} selected)
                                          (reset! parallel-finished? true))
                                        (when (some dev/serial-test-namespaces selected)
                                          (is @parallel-finished?))
                                        (swap! completed-runs into selected)))))]
      (dev/run-test-namespaces)
      (is (= namespaces @completed-runs)))))

(deftest run-test-namespaces-handles-an-empty-selection
  (let [node-runs (atom 0)]
    (with-redefs [dev/test-jobs 2
                  dev/test-batches-per-job 1
                  dev/run-shell (fn [& args]
                                  (if (some #{"--list-namespaces"} (map str args))
                                    {:out ""}
                                    (swap! node-runs inc)))]
      (dev/run-test-namespaces)
      (is (zero? @node-runs)))))

(deftest parallel-test-runs-test-namespaces-concurrently
  (let [compile-ran? (atom false)
        listed-namespaces? (atom false)
        started-node-runs (atom [])
        release-node-runs (promise)
        wait-for-started-runs (fn [n]
                                (loop [remaining-attempts 20]
                                  (when (and (< (count @started-node-runs) n)
                                             (pos? remaining-attempts))
                                    (Thread/sleep 50)
                                    (recur (dec remaining-attempts)))))]
    (with-redefs [dev/test-jobs 2
                  dev/test-batches-per-job 1
                  dev/run-shell (fn [& args]
                                  (let [cmd-text (string/join " " (map str args))]
                                    (cond
                                      (string/includes? cmd-text "pnpm cljs:test")
                                      (reset! compile-ran? true)

                                      (string/includes? cmd-text "--list-namespaces")
                                      (do
                                        (is (string/includes? cmd-text "^(?!logseq.db-sync.).*"))
                                        (reset! listed-namespaces? true)
                                        {:out (string/join "\n" test-namespaces)})

                                      (string/includes? cmd-text "static/tests.js")
                                      (do
                                        (swap! started-node-runs conj args)
                                        @release-node-runs))))]
      (let [runner (future (dev/parallel-test "-e" "long" "-e" "fix-me"))]
        (wait-for-started-runs dev/test-jobs)
        (is @compile-ran?)
        (is @listed-namespaces?)
        (is (= dev/test-jobs (count @started-node-runs)))
        (is (every? #(some #{"-n"} (map str %)) @started-node-runs))
        (is (every? #(= ["-e" "long" "-e" "fix-me"]
                        (take-last 4 (mapv str %)))
                    @started-node-runs))
        (deliver release-node-runs true)
        @runner
        (is (= dev/test-jobs (count @started-node-runs)))
        (is (= (set test-namespaces)
               (->> @started-node-runs
                    (mapcat #(map str %))
                    (filter (set test-namespaces))
                    set)))))))

(deftest parallel-test-reraises-namespace-failure-after-running-namespaces
  (let [started-node-runs (atom [])
        release-node-runs (promise)
        wait-for-started-runs (fn [n]
                                (loop [remaining-attempts 20]
                                  (when (and (< (count @started-node-runs) n)
                                             (pos? remaining-attempts))
                                    (Thread/sleep 50)
                                    (recur (dec remaining-attempts)))))]
    (with-redefs [dev/test-jobs 2
                  dev/test-batches-per-job 1
                  dev/run-shell (fn [& args]
                                  (let [cmd-text (string/join " " (map str args))]
                                    (cond
                                      (string/includes? cmd-text "--list-namespaces")
                                      (do
                                        (is (string/includes? cmd-text "^(?!logseq.db-sync.).*"))
                                        {:out (string/join "\n" test-namespaces)})

                                      (string/includes? cmd-text "static/tests.js")
                                      (let [run-number (count (swap! started-node-runs conj args))]
                                        @release-node-runs
                                        (when (= 2 run-number)
                                          (throw (ex-info "namespace failed" {})))))))]
      (let [runner (future
                     (try
                       (dev/parallel-test "-e" "long" "-e" "fix-me")
                       :passed
                       (catch Throwable e
                         e)))]
        (wait-for-started-runs dev/test-jobs)
        (is (= dev/test-jobs (count @started-node-runs)))
        (deliver release-node-runs true)
        (let [result @runner]
          (is (= dev/test-jobs (count @started-node-runs)))
          (is (instance? clojure.lang.ExceptionInfo result))
          (is (= "namespace failed" (ex-message result))))))))

(defn -main
  [& _]
  (let [{:keys [fail error]} (run-tests 'logseq.tasks.dev-test)]
    (System/exit (+ fail error))))
