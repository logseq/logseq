(ns logseq.tasks.dev.lint-test-deps
  "Runs lint/test tasks for selected deps with readable progress output."
  (:require [babashka.process :refer [shell]]))

(def ^:private dep-plan
  [{:dep "deps/common"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            {:runner :cmd :name "yarn test (-e long)" :cmd "yarn test -e long"}]}
   {:dep "deps/db"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            {:runner :bb :name "lint:rules" :cmd "lint:rules"}
            {:runner :cmd :name "yarn test (-e long)" :cmd "yarn test -e long"}]}
   {:dep "deps/db-sync"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            ;; {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            ;; {:runner :bb :name "lint:minimize-public-vars" :cmd "lint:minimize-public-vars"}
            ]}
   {:dep "."
    :steps [{:runner :bb :name "dev:db-sync-test" :cmd "dev:db-sync-test"}]}
   {:dep "deps/outliner"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            {:runner :bb :name "lint:minimize-public-vars" :cmd "lint:minimize-public-vars"}
            {:runner :cmd :name "yarn test (-e long)" :cmd "yarn test -e long"}]}
   {:dep "deps/graph-parser"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            ;; {:runner :bb :name "lint:minimize-public-vars" :cmd "lint:minimize-public-vars"}
            {:runner :cmd :name "yarn test (-e long)" :cmd "yarn test -e long"}]}
   {:dep "deps/cli"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            {:runner :bb :name "lint:minimize-public-vars" :cmd "lint:minimize-public-vars"}
            {:runner :cmd :name "yarn test (-e long)" :cmd "yarn test -e long"}]}
   {:dep "deps/publish"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            {:runner :skip :name "tests" :reason "no test script in deps/publish/package.json"}]}
   {:dep "deps/publishing"
    :steps [{:runner :bb :name "lint:large-vars" :cmd "lint:large-vars"}
            {:runner :bb :name "lint:carve" :cmd "lint:carve"}
            {:runner :bb :name "lint:ns-docstrings" :cmd "lint:ns-docstrings"}
            {:runner :bb :name "lint:minimize-public-vars" :cmd "lint:minimize-public-vars"}]}])

(defn- run-step!
  [dep {:keys [runner name cmd reason]}]
  (case runner
    :skip
    (do
      (println (str "\n==> [" dep "] " name " (skip)"))
      (println (str "SKIP[" dep "] " name " - " reason))
      {:dep dep :task name :exit 0 :skipped true})

    :bb
    (do
      (println (str "\n==> [" dep "] bb " cmd))
      (let [result (shell {:dir dep :continue true} (str "bb " cmd))
            success? (zero? (:exit result))]
        (println (str (if success? "OK  " "ERR ")
                      "[" dep "] "
                      name
                      (when-not success?
                        (str " (exit " (:exit result) ")"))))
        {:dep dep :task name :exit (:exit result)}))

    :cmd
    (do
      (println (str "\n==> [" dep "] " cmd))
      (let [result (shell {:dir dep :continue true} cmd)
            success? (zero? (:exit result))]
        (println (str (if success? "OK  " "ERR ")
                      "[" dep "] "
                      name
                      (when-not success?
                        (str " (exit " (:exit result) ")"))))
        {:dep dep :task name :exit (:exit result)}))))

(defn run
  "Lint and test selected deps projects with per-step progress and summary."
  [& _]
  (println "Starting deps lint/test suite...")
  (let [results (vec
                 (mapcat (fn [{:keys [dep steps]}]
                           (map #(run-step! dep %) steps))
                         dep-plan))
        skipped-count (count (filter :skipped results))
        failures (filter #(pos? (:exit %)) results)]
    (println "\nSummary:")
    (println (str "  Total tasks: " (count results)))
    (println (str "  Passed: " (- (count results) skipped-count (count failures))))
    (println (str "  Skipped: " skipped-count))
    (println (str "  Failed: " (count failures)))
    (when (seq failures)
      (println "\nFailed tasks:")
      (doseq [{:keys [dep task exit]} failures]
        (println (str "  - [" dep "] " task " (exit " exit ")")))
      (System/exit 1))
    (println "\nAll deps lint/test tasks passed.")))
