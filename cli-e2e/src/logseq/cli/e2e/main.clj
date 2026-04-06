(ns logseq.cli.e2e.main
  (:require [clojure.set :as set]
            [logseq.cli.e2e.cleanup :as cleanup]
            [logseq.cli.e2e.coverage :as coverage]
            [logseq.cli.e2e.manifests :as manifests]
            [logseq.cli.e2e.preflight :as preflight]
            [logseq.cli.e2e.report :as report]
            [logseq.cli.e2e.runner :as runner]
            [logseq.cli.e2e.shell :as shell]))

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

(defn- suite-from-opts
  [opts]
  (or (:suite opts) default-suite))

(defn- elapsed-ms
  [started-at]
  (long (/ (- (System/nanoTime) started-at) 1000000)))

(defn- format-duration
  [started-at]
  (format "%.2fs" (/ (double (- (System/nanoTime) started-at)) 1000000000.0)))

(defn- run-selected-cases!
  [selected-cases run-case run-command {:keys [on-case-start on-case-success on-case-failure detailed-log?]}]
  (let [total (count selected-cases)]
    (reduce (fn [acc [idx case]]
              (let [index (inc idx)
                    started-at (System/nanoTime)]
                (when on-case-start
                  (on-case-start {:index index
                                  :total total
                                  :case case}))
                (try
                  (let [result (run-case case {:run-command run-command
                                               :detailed-log? detailed-log?})
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

(defn run!
  [{:keys [inventory cases skip-build run-command]
    :as opts}]
  (let [run-command (or run-command shell/run!)
        run-case (or (:run-case opts) runner/run-case!)
        suite (suite-from-opts opts)
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
        {:status :ok
         :cases selected-cases
         :coverage coverage-result
         :results (run-selected-cases! selected-cases run-case run-command opts)}))))
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
          temp-graphs (cleanup/cleanup-temp-graph-dirs! cleanup-opts)]
      (println "==> Running cli-e2e cleanup")
      (if dry-run?
        (do
          (println (format "[dry-run] db-worker-node processes: found %d, would kill %d"
                           (count (:found-pids processes))
                           (count (:would-kill-pids processes))))
          (println (format "[dry-run] temp graph directories: found %d, would remove %d"
                           (count (:found-dirs temp-graphs))
                           (count (:would-remove-dirs temp-graphs)))))
        (do
          (println (format "db-worker-node processes: found %d, killed %d, failed %d"
                           (count (:found-pids processes))
                           (count (:killed-pids processes))
                           (count (:failed-pids processes))))
          (println (format "temp graph directories: found %d, removed %d, failed %d"
                           (count (:found-dirs temp-graphs))
                           (count (:removed-dirs temp-graphs))
                           (count (:failed-dirs temp-graphs))))))
      (flush)
      {:status :ok
       :dry-run? dry-run?
       :processes processes
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

(defn- print-test-help!
  [command-name]
  (println (str "Usage: bb -f cli-e2e/bb.edn " command-name " [options]"))
  (println)
  (println "Options:")
  (println "  -h, --help           Show this help and exit")
  (println "      --skip-build     Skip build preflight steps")
  (println "  -i, --include TAG    Run only cases with matching tag (repeatable)")
  (println "      --case ID        Run a single case by id")
  (println "      --verbose        Enable verbose output")
  (println)
  (println "Examples:")
  (println (str "  bb -f cli-e2e/bb.edn " command-name " --skip-build"))
  (println (str "  bb -f cli-e2e/bb.edn " command-name " --skip-build -i smoke"))
  (println (str "  bb -f cli-e2e/bb.edn " command-name " --skip-build --case global-help"))
  (flush))

(defn- test-suite!
  [opts {:keys [suite command-name]
         :or {suite default-suite
              command-name "test"}}]
  (let [suite (or suite default-suite)
        opts (assoc opts :suite suite)]
    (if (:help opts)
      (do
        (print-test-help! command-name)
        {:status :help})
      (let [started-at (System/nanoTime)
            passed (atom 0)
            failed (atom 0)
            total-count (atom 0)
            detailed-case-log? (some? (:case opts))
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
        (flush)
        (try
          (run! (assoc opts
                       :run-command run-command
                       :detailed-log? detailed-case-log?
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
                                        (println (format "[%d/%d] ▶ %s" index total (:id case)))
                                        (flush))
                       :on-case-success (fn [{:keys [index total result elapsed-ms]}]
                                          (swap! passed inc)
                                          (println (format "[%d/%d] ✓ %s (%dms)"
                                                           index
                                                           total
                                                           (:id result)
                                                           elapsed-ms))
                                          (flush))
                       :on-case-failure (fn [{:keys [index total case error elapsed-ms]}]
                                          (swap! failed inc)
                                          (println (format "[%d/%d] ✗ %s (%dms)"
                                                           index
                                                           total
                                                           (:id case)
                                                           elapsed-ms))
                                          (print-failure-details! error))))
          (println (format "Summary: %d passed, %d failed" @passed @failed))
          (println (str "Selected cases: " @total-count))
          (println (str "Duration: " (format-duration started-at)))
          (catch Exception error
            (let [failed-count (max 1 @failed)]
              (println (format "Summary: %d passed, %d failed" @passed failed-count))
              (println (str "Selected cases: " (max @total-count failed-count)))
              (println (str "Duration: " (format-duration started-at))))
            (throw error)))))))

(defn test!
  [opts]
  (test-suite! opts {:suite :non-sync
                     :command-name "test"}))

(defn test-sync!
  [opts]
  (test-suite! opts {:suite :sync
                     :command-name "test-sync"}))
