(ns logseq.cli.e2e.preflight
  (:require [babashka.fs :as fs]
            [logseq.cli.e2e.paths :as paths]
            [logseq.cli.e2e.shell :as shell]))

(def build-plan
  [{:cmd "clojure -M:cljs compile logseq-cli db-worker-node"}
   {:cmd "yarn db-worker-node:compile:bundle"}])

(defn missing-artifacts
  ([]
   (missing-artifacts (paths/required-artifacts) fs/exists?))
  ([artifacts file-exists?]
   (->> artifacts
        (remove file-exists?)
        vec)))

(defn run!
  [{:keys [skip-build run-command file-exists?]
    :or {run-command shell/run!
         file-exists? fs/exists?}}]
  (if skip-build
    {:status :skipped
     :commands []
     :missing-artifacts []}
    (do
      (doseq [{:keys [cmd]} build-plan]
        (run-command {:cmd cmd
                      :dir (paths/repo-root)}))
      (let [missing (missing-artifacts (paths/required-artifacts) file-exists?)]
        (when (seq missing)
          (throw (ex-info "Build preflight completed but required artifacts are missing"
                          {:missing-artifacts missing})))
        {:status :ok
         :commands build-plan
         :missing-artifacts []}))))
