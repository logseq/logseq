(ns logseq.cli.e2e.main
  (:require [clojure.set :as set]
            [logseq.cli.e2e.cleanup :as cleanup]
            [logseq.cli.e2e.coverage :as coverage]
            [logseq.cli.e2e.manifests :as manifests]
            [logseq.cli.e2e.preflight :as preflight]
            [logseq.cli.e2e.report :as report]
            [logseq.cli.e2e.runner :as runner]
            [logseq.cli.e2e.shell :as shell]
            [logseq.cli.e2e.sync-fixture :as sync-fixture])
  (:import (java.util.concurrent Executors LinkedBlockingQueue TimeUnit)))

(defn select-cases
  [cases {:keys [case include]}]
  (cond
    case
    (filterv #(= case (:id %)) cases)

    (seq include)
    (let [include-tags (set (map keyword include))]
      (filterv (fn [{:keys [tags]}]
                 (not-empty (set/intersection include-tags (set tags))))
               cases))

    :else
    (vec cases)))

(def default-suite :non-sync)
(def default-jobs 1)
(def default-cli-jobs 4)

(defn- suite-from-opts
  [opts]
  (or (:suite opts) default-suite))

(defn- elapsed-ms
  [started-at]
  (long (/ (- (System/nanoTime) started-at) 1000000)))

(defn- format-duration
  [started-at]
  (format "%.2fs" (/ (double (- (System/nanoTime) started-at)) 1000000000.0)))

(defn- positive-jobs
  [jobs]
  (let [jobs (or jobs default-jobs)]
    (when-not (and (integer? jobs) (pos? jobs))
      (throw (ex-info "--jobs must be a positive integer"
                      {:jobs jobs})))
    jobs))

(defn run-selected-cases!
  [selected-cases run-case run-command {:keys [on-case-start on-case-success on-case-failure detailed-log? timings? jobs]}]
  (let [total (count selected-cases)
        _ (positive-jobs jobs)]
    (reduce (fn [acc [idx case]]
              (let [index (inc idx)
                    started-at (System/nanoTime)]
                (when on-case-start
                  (on-case-start {:index index
                                  :total total
                                  :case case}))
                (try
                  (let [result (run-case case {:run-command run-command
                                               :detailed-log? detailed-log?
                                               :timings? timings?})
                        payload {:index index
                                 :total total
                                 :case case
                                 :result result
                                 :elapsed-ms (elapsed-ms started-at)}]
                    (when on-case-success
                      (on-case-success payload))
                    (conj acc result))
                  (catch Exception error
                    (when on-case-failure
                      (on-case-failure {:index index
                                        :total total
                                        :case case
                                        :error error
                                        :elapsed-ms (elapsed-ms started-at)}))
                    (throw error)))))
            []
            (map-indexed vector selected-cases))))

(defn run-selected-cases-in-parallel!
  [selected-cases run-case run-command {:keys [on-case-start on-case-success on-case-failure detailed-log? timings? jobs]}]
  (let [total (count selected-cases)
        jobs (positive-jobs jobs)
        executor (Executors/newFixedThreadPool jobs)
        completions (LinkedBlockingQueue.)]
    (try
      (doseq [[idx case] (map-indexed vector selected-cases)]
        (let [index (inc idx)]
          (when on-case-start
            (on-case-start {:index index
                            :total total
                            :case case}))
          (.submit executor
                   ^Runnable
                   (fn []
                     (let [started-at (System/nanoTime)]
                       (.put completions
                             (try
                               (let [result (run-case case {:run-command run-command
                                                            :detailed-log? detailed-log?
                                                            :timings? timings?})]
                                 {:index index
                                  :total total
                                  :case case
                                  :result result
                                  :elapsed-ms (elapsed-ms started-at)})
                               (catch Exception error
                                 {:index index
                                  :total total
                                  :case case
                                  :error error
                                  :elapsed-ms (elapsed-ms started-at)}))))))))
      (loop [remaining total
             results []
             failure nil]
        (if (zero? remaining)
          (do
            (when failure
              (throw failure))
            (->> results
                 (sort-by :index)
                 (mapv :result)))
          (let [payload (.take completions)]
            (if-let [error (:error payload)]
              (do
                (when on-case-failure
                  (on-case-failure payload))
                (recur (dec remaining) results (or failure error)))
              (do
                (when on-case-success
                  (on-case-success payload))
                (recur (dec remaining) (conj results payload) failure))))))
      (finally
        (.shutdown executor)
        (.awaitTermination executor 1 TimeUnit/MINUTES)))))

(defn run!
  [{:keys [inventory cases skip-build run-command jobs]
    :as opts}]
  (let [run-command (or run-command shell/run!)
        run-case (or (:run-case opts) runner/run-case!)
        suite (suite-from-opts opts)
        sync-suite? (= suite :sync)
        jobs (positive-jobs jobs)
        targeted-run? (or (:case opts) (seq (:include opts)))
        on-preflight-start (:on-preflight-start opts)
        on-preflight-complete (:on-preflight-complete opts)
        on-cases-ready (:on-cases-ready opts)]
    (when on-preflight-start
      (on-preflight-start {:skip-build skip-build}))
    (let [preflight-result (preflight/run! {:skip-build skip-build
                                            :run-command run-command})
          inventory (or inventory (manifests/load-inventory suite))
          cases (or cases (manifests/load-cases suite))]
      (when on-preflight-complete
        (on-preflight-complete preflight-result))
      (let [selected-cases (select-cases cases opts)
            coverage-result (when-not targeted-run?
                              (coverage/coverage-report inventory selected-cases))]
        (when (and coverage-result
                   (not (coverage/complete? coverage-result)))
          (throw (ex-info "Missing coverage"
                          {:coverage coverage-result
                           :message (report/format-missing-coverage coverage-result)})))
        (when on-cases-ready
          (on-cases-ready {:total (count selected-cases)
                           :targeted-run? targeted-run?}))
        (let [suite-context (when sync-suite?
                              (sync-fixture/before-suite! {:run-command run-command}))
              sync-context (if suite-context
                             (assoc suite-context :e2ee-password (:e2ee-password opts))
                             suite-context)
              run-case* (if sync-suite?
                          (fn [case case-opts]
                            (run-case (sync-fixture/prepare-case case sync-context)
                                      case-opts))
                          run-case)]
          (try
            {:status :ok
             :cases selected-cases
             :coverage coverage-result
             :results ((if (and (not sync-suite?) (> jobs 1))
                         run-selected-cases-in-parallel!
                         run-selected-cases!)
                       selected-cases
                       run-case*
                       run-command
                       (assoc opts :jobs jobs))}
            (finally
              (when suite-context
                (sync-fixture/after-suite! suite-context {:run-command run-command})))))))))
(defn build!
  [opts]
  (preflight/run! opts))

(defn list-cases!
  [opts]
  (doseq [{:keys [id]} (manifests/load-cases (suite-from-opts opts))]
    (println id)))

(defn list-sync-cases!
  [opts]
  (list-cases! (assoc opts :suite :sync)))

(defn- print-cleanup-help!
  []
  (println "Usage: bb -f cli-e2e/bb.edn cleanup [options]")
  (println)
  (println "Options:")
  (println "  -h, --help           Show this help and exit")
  (println "      --dry-run        Scan and report only; do not kill/delete")
  (println)
  (println "Cleanups performed:")
  (println "  - Terminate cli-e2e db-worker-node processes")
  (println "  - Terminate db-sync server listeners on port 18080")
  (println "  - Remove cli-e2e temp graph directories")
  (flush))

(defn cleanup!
  [opts]
  (if (:help opts)
    (do
      (print-cleanup-help!)
      {:status :help})
    (let [dry-run? (boolean (:dry-run opts))
          cleanup-opts (cond-> {}
                         dry-run? (assoc :dry-run true))
          processes (cleanup/cleanup-db-worker-processes! cleanup-opts)
          db-sync-port-processes (cleanup/cleanup-db-sync-port-processes! cleanup-opts)
          temp-graphs (cleanup/cleanup-temp-graph-dirs! cleanup-opts)]
      (println "==> Running cli-e2e cleanup")
      (if dry-run?
        (do
          (println (format "[dry-run] db-worker-node processes: found %d, would kill %d"
                           (count (:found-pids processes))
                           (count (:would-kill-pids processes))))
          (println (format "[dry-run] db-sync server processes (port 18080): found %d, would kill %d"
                           (count (:found-pids db-sync-port-processes))
                           (count (:would-kill-pids db-sync-port-processes))))
          (println (format "[dry-run] temp graph directories: found %d, would remove %d"
                           (count (:found-dirs temp-graphs))
                           (count (:would-remove-dirs temp-graphs)))))
        (do
          (println (format "db-worker-node processes: found %d, killed %d, failed %d"
                           (count (:found-pids processes))
                           (count (:killed-pids processes))
                           (count (:failed-pids processes))))
          (println (format "db-sync server processes (port 18080): found %d, killed %d, failed %d"
                           (count (:found-pids db-sync-port-processes))
                           (count (:killed-pids db-sync-port-processes))
                           (count (:failed-pids db-sync-port-processes))))
          (println (format "temp graph directories: found %d, removed %d, failed %d"
                           (count (:found-dirs temp-graphs))
                           (count (:removed-dirs temp-graphs))
                           (count (:failed-dirs temp-graphs))))))
      (flush)
      {:status :ok
       :dry-run? dry-run?
       :processes processes
       :db-sync-port-processes db-sync-port-processes
       :temp-graphs temp-graphs})))

(defn- print-failure-details!
  [error]
  (let [data (ex-data error)]
    (println (str "      reason: " (.getMessage error)))
    (when-let [cmd (:cmd data)]
      (println (str "      cmd: " cmd)))
    (when-let [stream (:stream data)]
      (println (str "      stream: " stream)))
    (when-let [snippet (:snippet data)]
      (println (str "      snippet: " snippet)))
    (flush)))

(defn- format-step-label
  [{:keys [phase step-index step-total]}]
  (let [phase-name (name (or phase :command))]
    (format "%s %d/%d" phase-name (or step-index 1) (or step-total 1))))

(defn- print-case-timings!
  [timings]
  (when (seq timings)
    (println "      step timings:")
    (doseq [{:keys [elapsed-ms status cmd] :as timing} timings]
      (println (format "      - [%-12s] %6dms (%s) $ %s"
                       (format-step-label timing)
                       elapsed-ms
                       (name (or status :ok))
                       cmd)))
    (flush)))

(defn- print-slow-steps!
  [all-step-timings]
  (when (seq all-step-timings)
    (println "Slow steps (top 10):")
    (doseq [{:keys [case-id elapsed-ms cmd] :as timing}
            (->> all-step-timings
                 (sort-by :elapsed-ms >)
                 (take 10))]
      (println (format "  - %-45s [%-12s] %6dms $ %s"
                       case-id
                       (format-step-label timing)
                       elapsed-ms
                       cmd)))
    (flush)))

(defn- progress-prefix
  [{:keys [parallel? index total]} symbol]
  (if parallel?
    (str symbol " ")
    (format "[%d/%d] %s " index total symbol)))

(defn- print-test-help!
  [command-name suite]
  (let [sync-suite? (= suite :sync)]
    (println (str "Usage: bb -f cli-e2e/bb.edn " command-name " [options]"))
    (println)
    (println "Options:")
    (println "  -h, --help           Show this help and exit")
    (println "      --skip-build     Skip build preflight steps")
    (println "  -i, --include TAG    Run only cases with matching tag (repeatable)")
    (println "      --case ID        Run a single case by id")
    (println (format "      --jobs N         %s (Default: %d)"
                     (if sync-suite?
                       "Accepted for CLI consistency; sync cases still run serially"
                       "Run up to N non-sync cases in parallel")
                     default-cli-jobs))
    (when sync-suite?
      (println "      --e2ee-password VALUE  E2EE password for sync commands (Default: 11111)"))
    (println "      --verbose        Enable verbose output")
    (println "      --timings        Print per-step timings and slow-step summary")
    (println)
    (println "Examples:")
    (if sync-suite?
      (println (str "  bb -f cli-e2e/bb.edn " command-name))
      (println (str "  bb -f cli-e2e/bb.edn " command-name " --skip-build")))
    (when-not sync-suite?
      (println (str "  bb -f cli-e2e/bb.edn " command-name " --skip-build --jobs 4")))
    (println (str "  bb -f cli-e2e/bb.edn " command-name " -i smoke"))
    (if sync-suite?
      (println (str "  bb -f cli-e2e/bb.edn " command-name " --case sync-upload-download-mvp"))
      (println (str "  bb -f cli-e2e/bb.edn " command-name " --skip-build --case global-help")))
    (when sync-suite?
      (println (str "  bb -f cli-e2e/bb.edn " command-name " --e2ee-password 'my-secret'")))
    (flush)))

(defn- test-suite!
  [opts {:keys [suite command-name]
         :or {suite default-suite
              command-name "test"}}]
  (let [suite (or suite default-suite)
        opts (assoc opts :suite suite)]
    (if (:help opts)
      (do
        (print-test-help! command-name suite)
        {:status :help})
      (let [started-at (System/nanoTime)
            passed (atom 0)
            failed (atom 0)
            total-count (atom 0)
            timings? (boolean (:timings opts))
            all-step-timings (atom [])
            detailed-case-log? (some? (:case opts))
            parallel? (and (= suite :non-sync) (> (positive-jobs (:jobs opts)) 1))
            base-run-command (or (:run-command opts) shell/run!)
            run-command (if detailed-case-log?
                          (fn [{:keys [cmd phase step-index step-total] :as command-opts}]
                            (let [prefix (case phase
                                           :setup (format "    [setup %d/%d]" step-index step-total)
                                           :main (format "    [main %d/%d]" (or step-index 1) (or step-total 1))
                                           :cleanup (format "    [cleanup %d/%d]" step-index step-total)
                                           "    [command]")]
                              (println (str prefix " $ " cmd))
                              (flush)
                              (base-run-command (assoc command-opts :stream-output? true))))
                          base-run-command)]
        (println "==> Running cli-e2e cases")
        (when detailed-case-log?
          (println (format "==> Detailed case logging enabled (--case %s)" (:case opts))))
        (when timings?
          (println "==> Step timing enabled (--timings)"))
        (flush)
        (try
          (run! (assoc opts
                       :run-command run-command
                       :detailed-log? detailed-case-log?
                       :timings? timings?
                       :on-preflight-start (fn [_]
                                             (println "==> Build preflight: running...")
                                             (flush))
                       :on-preflight-complete (fn [{:keys [status]}]
                                                (println (case status
                                                           :skipped "==> Build preflight: skipped (--skip-build)"
                                                           "==> Build preflight: completed"))
                                                (flush))
                       :on-cases-ready (fn [{:keys [total]}]
                                         (reset! total-count total)
                                         (println (format "==> Prepared %d case(s), starting execution" total))
                                         (flush))
                       :on-case-start (fn [{:keys [index total case]}]
                                        (println (str (progress-prefix {:parallel? parallel?
                                                                        :index index
                                                                        :total total}
                                                                       "▶")
                                                      (:id case)))
                                        (flush))
                       :on-case-success (fn [{:keys [index total result elapsed-ms]}]
                                          (swap! passed inc)
                                          (println (format "%s%s (%dms)"
                                                           (progress-prefix {:parallel? parallel?
                                                                             :index index
                                                                             :total total}
                                                                            "✓")
                                                           (:id result)
                                                           elapsed-ms))
                                          (when timings?
                                            (let [case-timings (vec (:timings result))]
                                              (swap! all-step-timings into
                                                     (map #(assoc % :case-id (:id result)) case-timings))
                                              (print-case-timings! case-timings)))
                                          (flush))
                       :on-case-failure (fn [{:keys [index total case error elapsed-ms]}]
                                          (swap! failed inc)
                                          (println (format "%s%s (%dms)"
                                                           (progress-prefix {:parallel? parallel?
                                                                             :index index
                                                                             :total total}
                                                                            "✗")
                                                           (:id case)
                                                           elapsed-ms))
                                          (print-failure-details! error)
                                          (when timings?
                                            (let [case-timings (vec (:timings (ex-data error)))]
                                              (swap! all-step-timings into
                                                     (map #(assoc % :case-id (:id case)) case-timings))
                                              (print-case-timings! case-timings))))))
          (println (format "Summary: %d passed, %d failed" @passed @failed))
          (println (str "Selected cases: " @total-count))
          (println (str "Duration: " (format-duration started-at)))
          (when timings?
            (print-slow-steps! @all-step-timings))
          (catch Exception error
            (let [failed-count (max 1 @failed)]
              (println (format "Summary: %d passed, %d failed" @passed failed-count))
              (println (str "Selected cases: " (max @total-count failed-count)))
              (println (str "Duration: " (format-duration started-at)))
              (when timings?
                (print-slow-steps! @all-step-timings)))
            (throw error)))))))

(defn test!
  [opts]
  (test-suite! opts {:suite :non-sync
                     :command-name "test"}))

(defn test-sync!
  [opts]
  (test-suite! opts {:suite :sync
                     :command-name "test-sync"}))
