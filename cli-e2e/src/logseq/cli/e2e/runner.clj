(ns logseq.cli.e2e.runner
  (:require [babashka.fs :as fs]
            [cheshire.core :as json]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [logseq.cli.e2e.paths :as paths]
            [logseq.cli.e2e.shell :as shell]))

(defn shell-escape
  [value]
  (let [text (str value)]
    (if (re-find #"[^\w@%+=:,./-]" text)
      (str "'" (string/replace text #"'" "'\"'\"'") "'")
      text)))

(def template-pattern #"\{\{([^}]+)\}\}")

(defn- render-string
  [template context]
  (string/replace template
                  template-pattern
                  (fn [[_ key]]
                    (let [lookup-key (keyword (string/trim key))]
                      (when-not (contains? context lookup-key)
                        (throw (ex-info "Missing case template value"
                                        {:template template
                                         :key lookup-key
                                         :context context})))
                      (str (get context lookup-key))))))

(defn- render-value
  [value context]
  (cond
    (string? value) (render-string value context)
    (map? value) (into {}
                       (map (fn [[k v]]
                              [k (render-value v context)]))
                       value)
    (vector? value) (mapv #(render-value % context) value)
    (seq? value) (doall (map #(render-value % context) value))
    :else value))

(defn render-case
  [case context]
  (render-value case context))

(defn- ensure-contains!
  [id cmd output snippets stream]
  (doseq [snippet (or snippets [])]
    (when-not (string/includes? output snippet)
      (throw (ex-info (str stream " did not contain expected text")
                      {:id id
                       :cmd cmd
                       :snippet snippet
                       :output output
                       :stream stream})))))

(defn- ensure-not-contains!
  [id cmd output snippets stream]
  (doseq [snippet (or snippets [])]
    (when (string/includes? output snippet)
      (throw (ex-info (str stream " contained forbidden text")
                      {:id id
                       :cmd cmd
                       :snippet snippet
                       :output output
                       :stream stream})))))

(defn- ensure-equals!
  [id cmd actual expected label]
  (when (and (some? expected)
             (not= expected actual))
    (throw (ex-info (str label " did not match")
                    {:id id
                     :cmd cmd
                     :expected expected
                     :actual actual}))))

(defn- ensure-json-paths!
  [id cmd output expected-paths]
  (when expected-paths
    (let [payload (json/parse-string output true)]
      (doseq [[path expected] expected-paths]
        (let [actual (get-in payload path)]
          (when-not (= expected actual)
            (throw (ex-info "stdout JSON path did not match"
                            {:id id
                             :cmd cmd
                             :path path
                             :expected expected
                             :actual actual
                             :payload payload}))))))))

(defn- ensure-edn-paths!
  [id cmd output expected-paths]
  (when expected-paths
    (let [payload (edn/read-string output)]
      (doseq [[path expected] expected-paths]
        (let [actual (get-in payload path)]
          (when-not (= expected actual)
            (throw (ex-info "stdout EDN path did not match"
                            {:id id
                             :cmd cmd
                             :path path
                             :expected expected
                             :actual actual
                             :payload payload}))))))))

(defn assert-result!
  [{:keys [id expect]} {:keys [cmd exit out err] :as result}]
  (when-let [expected-exit (:exit expect)]
    (when-not (= expected-exit exit)
      (throw (ex-info "Unexpected exit code"
                      {:id id
                       :cmd cmd
                       :expected expected-exit
                       :actual exit
                       :result result}))))
  (ensure-equals! id cmd out (:stdout-equals expect) "stdout")
  (ensure-equals! id cmd err (:stderr-equals expect) "stderr")
  (ensure-contains! id cmd out (:stdout-contains expect) "stdout")
  (ensure-contains! id cmd err (:stderr-contains expect) "stderr")
  (ensure-not-contains! id cmd out (:stdout-not-contains expect) "stdout")
  (ensure-not-contains! id cmd err (:stderr-not-contains expect) "stderr")
  (ensure-json-paths! id cmd out (:stdout-json-paths expect))
  (ensure-edn-paths! id cmd out (:stdout-edn-paths expect))
  nil)

(defn- default-context
  [case context]
  (let [tmp-dir (or (:tmp-dir context)
                    (str (fs/create-temp-dir {:prefix (str "logseq-cli-e2e-" (:id case) "-")})))
        data-dir (or (:data-dir context)
                     (str (fs/path tmp-dir "graphs")))
        config-path (or (:config-path context)
                        (str (fs/path tmp-dir "cli.edn")))
        export-path (or (:export-path context)
                        (str (fs/path tmp-dir "graph-export.edn")))
        graph (or (:graph context)
                  (:graph case)
                  (str "cli-e2e-" (:id case)))]
    (fs/create-dirs data-dir)
    (spit config-path "{:output-format :json}\n")
    {:tmp-dir tmp-dir
     :tmp-dir-arg (shell-escape tmp-dir)
     :data-dir data-dir
     :data-dir-arg (shell-escape data-dir)
     :config-path config-path
     :config-path-arg (shell-escape config-path)
     :export-path export-path
     :export-path-arg (shell-escape export-path)
     :repo-root (paths/repo-root)
     :repo-root-arg (shell-escape (paths/repo-root))
     :cli (str "node " (shell-escape (paths/repo-path "static" "logseq-cli.js")))
     :graph graph
     :graph-arg (shell-escape graph)}))

(defn- case-context
  [case {:keys [context]}]
  (merge (default-context case context)
         context
         (:vars case)))

(defn- run-command!
  [command context {:keys [run-command stdin allow-failure]}]
  (run-command {:cmd (render-string command context)
                :dir (paths/repo-root)
                :stdin (some-> stdin (render-string context))
                :throw? (not allow-failure)}))

(defn run-case!
  [case {:keys [run-command]
         :or {run-command shell/run!}
         :as opts}]
  (let [context (case-context case opts)
        rendered (render-case case context)
        cleanup! (fn []
                   (doseq [command (:cleanup rendered)]
                     (try
                       (run-command! command context {:run-command run-command
                                                      :allow-failure true})
                       (catch Exception _
                         nil))))]
    (doseq [command (:setup rendered)]
      (run-command! command context {:run-command run-command}))
    (try
      (let [result (run-command! (:cmd rendered) context {:run-command run-command
                                                          :stdin (:stdin rendered)
                                                          :allow-failure true})]
        (assert-result! rendered result)
        {:id (:id rendered)
         :status :ok
         :cmd (:cmd result)
         :result result
         :context context})
      (finally
        (cleanup!)))))
