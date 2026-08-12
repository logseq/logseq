(ns logseq.tasks.dev
  "Tasks for general development. For desktop or mobile development see their
  namespaces"
  (:refer-clojure :exclude [test])
  (:require [babashka.cli :as cli]
            [babashka.fs :as fs]
            [babashka.process :refer [shell]]
            [babashka.tasks :refer [clojure]]
            [clojure.data :as data]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.pprint :as pp]
            [clojure.string :as string]
            [logseq.tasks.dev.lint :as dev-lint]
            [logseq.tasks.util :as task-util]))

(defn run-shell
  [& args]
  (apply shell args))

(defn test
  "Run tests. Pass args through to cmd 'pnpm cljs:run-test'"
  [& args]
  (shell {:shutdown nil} "pnpm cljs:test")
  (apply shell {:shutdown nil} "pnpm cljs:run-test" args))

(defn test-no-worker
  "Run tests without compiling worker namespaces. Pass args through to cmd 'pnpm cljs:run-test-no-worker'"
  [& args]
  (shell "pnpm cljs:test-no-worker")
  (apply shell "pnpm cljs:run-test-no-worker" args))

(def test-jobs (min 5 (.availableProcessors (Runtime/getRuntime))))
(def test-batches-per-job 6)

(def default-test-args ["-r" "^(?!logseq.db-sync.).*"])

(def isolated-test-namespaces
  #{"frontend.components.block.drop-boundary-test"
    "frontend.handler.db-based.page-test"
    "frontend.handler.editor-async-test"
    "frontend.handler.editor-lifecycle-test"
    "frontend.handler.editor-test"
    "frontend.handler.route-test"
    "frontend.rfx-test"
    "frontend.worker.db-core-test"})

(def serial-test-namespaces
  #{"frontend.db.query-dsl-test"
    "frontend.worker.search-test"})

(defn isolated-test-namespace?
  [test-ns]
  (contains? isolated-test-namespaces test-ns))

(defn- run-parallel!
  ([tasks]
   (run-parallel! (count tasks) tasks))
  ([jobs tasks]
   (let [tasks (vec tasks)]
     (when (seq tasks)
       (let [task-queue (atom (seq tasks))
             next-task! (fn []
                          (loop []
                            (let [tasks @task-queue]
                              (when (seq tasks)
                                (if (compare-and-set! task-queue tasks (rest tasks))
                                  (first tasks)
                                  (recur))))))
             worker (fn []
                      (loop [error nil]
                        (if-let [task (next-task!)]
                          (recur (try
                                   (task)
                                   error
                                   (catch Throwable e
                                     (or error e))))
                          error)))
             results (->> #(future (worker))
                          (repeatedly (min jobs (count tasks)))
                          doall)]
         (when-let [error (some deref results)]
           (throw error)))))))

(defn- selected-test-namespaces
  [args]
  (->> (:out (apply run-shell {:out :string
                               :shutdown nil
                               :extra-env {"LOGSEQ_STABLE_IDENTS" "1"}}
                     "node" "static/tests.js" "--list-namespaces" args))
       string/split-lines
       (remove string/blank?)
       vec))

(defn- round-robin-batches
  [items batch-count]
  (when (pos? batch-count)
    (->> items
         (map-indexed (fn [idx item]
                        [(mod idx batch-count) item]))
         (group-by first)
         (sort-by first)
         (mapv (fn [[_ indexed-items]]
                 (mapv second indexed-items))))))

(defn- namespace-batches
  [test-namespaces]
  (let [priority-namespaces ["frontend.handler.editor-test"
                             "frontend.worker.db-core-test"
                             "frontend.handler.editor-async-test"]
        priority-set (set priority-namespaces)
        priority (->> priority-namespaces
                      (filter (set test-namespaces))
                      (mapv vector))
        isolated (->> test-namespaces
                      (filter isolated-test-namespace?)
                      (remove priority-set)
                      (mapv vector))
        shared (remove isolated-test-namespace? test-namespaces)
        batch-count (min (* test-jobs test-batches-per-job) (count shared))
        batches (round-robin-batches shared batch-count)]
    (into priority
          (loop [batches (seq batches)
                 isolated (seq isolated)
                 result []]
            (if (or batches isolated)
              (recur (next batches)
                     (next isolated)
                     (cond-> result
                       batches (conj (first batches))
                       isolated (conj (first isolated))))
              result)))))

(defn- namespace-args
  [test-namespaces]
  (mapcat (fn [test-ns] ["-n" test-ns]) test-namespaces))

(defn run-test-namespaces
  "Run compiled tests in isolated Node processes, in parallel by namespace."
  [& args]
  (let [test-namespaces (selected-test-namespaces args)
        parallel-namespaces (remove serial-test-namespaces test-namespaces)
        serial-namespaces (filter serial-test-namespaces test-namespaces)
        run-namespaces! (fn [namespaces]
                          (apply run-shell {:shutdown nil
                                            :extra-env {"LOGSEQ_STABLE_IDENTS" "1"}}
                                 "node" "static/tests.js"
                                 (concat (namespace-args namespaces) args)))]
    (run-parallel! test-jobs
                   (mapv (fn [test-namespaces]
                           #(run-namespaces! test-namespaces))
                         (namespace-batches parallel-namespaces)))
    (doseq [test-ns serial-namespaces]
      (run-namespaces! [test-ns]))))

(defn parallel-test
  "Compile tests, then run them in parallel by namespace."
  [& args]
  (run-shell {:shutdown nil} "pnpm cljs:test")
  (apply run-test-namespaces (concat default-test-args args)))

(defn lint-and-test
  "Run all lint tasks and tests excluding testcases tagged by :long and :fix-me."
  []
  (run-parallel! [dev-lint/dev
                  #(parallel-test "-e" "long" "-e" "fix-me")]))

(defn e2e-basic-test
  "Run e2e basic tests. HTTP server should be available at localhost:3001"
  [& _]
  (clojure {:dir "clj-e2e"} "-X:dev-run-all-basic-test"))

(defn e2e-rtc-extra-test
  "Run e2e rtc extra tests. HTTP server should be available at localhost:3001"
  [& _]
  (clojure {:dir "clj-e2e"} "-X:dev-run-rtc-extra-test"))

(defn gen-malli-kondo-config
  "Generate clj-kondo type-mismatch config from malli schema
  .clj-kondo/metosin/malli-types/config.edn"
  []
  (let [config-edn ".clj-kondo/metosin/malli-types/config.edn"
        compile-cmd "clojure -M:cljs compile gen-malli-kondo-config"]
    (println compile-cmd)
    (shell {:shutdown nil} compile-cmd)
    (println "generate kondo config: " config-edn)
    (io/make-parents config-edn)
    (let [config (with-out-str
                   (pp/pprint (edn/read-string (:out (shell {:out :string :shutdown nil}
                                                            "node ./static/gen-malli-kondo-config.js")))))]
      (spit config-edn config))))

(defn diff-datoms
  "Runs data/diff on two edn files written by dev:datoms"
  [file1 file2 & args]
  (let [spec {:ignored-attributes
              ;; Ignores some attributes by default that are expected to change often
              {:alias :i :coerce #{:keyword} :default #{:block/tx-id :block/order :block/updated-at}}}
        {{:keys [ignored-attributes]} :opts} (cli/parse-args args {:spec spec})
        datom-filter (fn [[_e a _ _ _]] (contains? ignored-attributes a))
        data-diff* (apply data/diff (map (fn [x] (->> x slurp edn/read-string (remove datom-filter))) [file1 file2]))
        data-diff (->> data-diff*
                       ;; Drop common as we're only interested in differences
                       drop-last
                       ;; Remove nils as we're only interested in diffs
                       (mapv #(vec (remove nil? %))))]
    (pp/pprint data-diff)))

(defn build-publishing-frontend
  "Builds frontend release publishing asset when files have changed"
  [& _args]
  (if-let [_files (and (not (System/getenv "SKIP_ASSET"))
                       (seq (set (fs/modified-since (fs/file "static/js/publishing/main.js")
                                                    (fs/glob "." "{src/main,deps/graph-parser/src}/**")))))]
    (do
      (println "Building publishing js asset...")
      (shell {:shutdown nil} "clojure -M:cljs release publishing db-worker"))
    (println "Publishing js asset is up to date")))

(defn publishing-backend
  "Builds publishing backend and copies over supporting frontend assets"
  [& args]
  (apply shell {:dir "deps/publishing" :extra-env {"ORIGINAL_PWD" (fs/cwd)} :shutdown nil}
         "pnpm exec nbb-logseq -cp src:../graph-parser/src script/publishing.cljs"
         (into ["static"] args)))

(defn watch-publishing-frontend
  [& _args]
  (shell {:shutdown nil} "pnpm exec shadow-cljs watch publishing"))

(defn watch-publishing-backend
  "Builds publishing backend once watch-publishing-frontend has built initial frontend"
  [& args]
  (let [start-time (java.time.Instant/now)]
    (Thread/sleep 3000)
    (loop [n 1000]
      (if (and (fs/exists? "static/js/publishing/main.js")
               (task-util/file-modified-later-than? "static/js/publishing/main.js" start-time))
        (apply publishing-backend args)
        (do (println "Waiting for publishing frontend to build...")
            (Thread/sleep 1000)
            (recur (inc n)))))))

(defn db-import-many
  [& args]
  (let [parent-graph-dir "./out"
        [file-graphs import-options] (split-with #(not (string/starts-with? % "-")) args)]
    (doseq [file-graph file-graphs]
      (let [db-graph (fs/path parent-graph-dir (fs/file-name file-graph))]
        (println "Importing" (str db-graph) "...")
        (apply shell {:shutdown nil} "bb" "dev:db-import" file-graph db-graph (concat import-options ["--validate"]))))))
