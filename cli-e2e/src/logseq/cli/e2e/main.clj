(ns logseq.cli.e2e.main
  (:require [clojure.set :as set]
            [clojure.string :as string]
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

(defn run!
  [{:keys [inventory cases skip-build run-command]
    :as opts}]
  (let [inventory (or inventory (manifests/load-inventory))
        cases (or cases (manifests/load-cases))
        run-command (or run-command shell/run!)
        run-case (or (:run-case opts) runner/run-case!)
        targeted-run? (or (:case opts) (seq (:include opts)))]
  (preflight/run! {:skip-build skip-build
                   :run-command run-command})
    (let [selected-cases (select-cases cases opts)
          coverage-result (when-not targeted-run?
                            (coverage/coverage-report inventory selected-cases))]
      (when (and coverage-result
                 (not (coverage/complete? coverage-result)))
        (throw (ex-info "Missing coverage"
                        {:coverage coverage-result
                         :message (report/format-missing-coverage coverage-result)})))
      {:status :ok
       :cases selected-cases
       :coverage coverage-result
       :results (mapv #(run-case % {:run-command run-command}) selected-cases)})))

(defn build!
  [opts]
  (preflight/run! opts))

(defn list-cases!
  [_opts]
  (doseq [{:keys [id]} (manifests/load-cases)]
    (println id)))

(defn test!
  [opts]
  (let [{:keys [results]} (run! opts)]
    (doseq [{:keys [id cmd]} results]
      (println (str id ": " cmd)))
    (println (str "Selected cases: " (count results)))))
