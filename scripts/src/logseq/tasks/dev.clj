(ns logseq.tasks.dev
  "Tasks for general development. For desktop or mobile development see their
  namespaces"
  (:require [babashka.process :refer [shell]]
            [babashka.fs :as fs]
            [babashka.cli :as cli]
            [logseq.tasks.util :as task-util]
            [logseq.tasks.dev.lint :as dev-lint]
            [clojure.java.io :as io]
            [clojure.pprint :as pp]
            [clojure.edn :as edn]
            [clojure.data :as data]
            [clojure.core.async :as async]
            [clojure.string :as string]))

(defn test
  "Run tests. Pass args through to cmd 'yarn cljs:run-test'"
  [& args]
  (shell "yarn cljs:test")
  (apply shell "yarn cljs:run-test" args))

(defn lint-and-test
  "Run all lint tasks, then run tests(exclude testcases tagged by :long).
  pass args through to cmd 'yarn cljs:run-test'"
  []
  (dev-lint/dev)
  (test "-e" "long" "-e" "fix-me"))

(defn rtc-e2e-test
  "Run karma rtc-e2e-test"
  [& [skip-compile?]]
  (let [seed (hash (rand))
        r0 (when-not skip-compile? (shell (str "clj -M:rtc-e2e-test compile rtc-e2e-test")))
        c1 (async/go (shell (str "npx karma start --testvar=client1 --single-run --seed=" seed)))
        c2 (async/go (shell (str "npx karma start --testvar=client2 --single-run --seed=" seed)))]
    (when (and r0 (not= 0 (:exit r0)))
      (throw (ex-info "compile failed" {:r r0})))
    (prn :exit-code :client1 (:exit (async/<!! c1)) :client2 (:exit (async/<!! c2)))))

(defn gen-malli-kondo-config
  "Generate clj-kondo type-mismatch config from malli schema
  .clj-kondo/metosin/malli-types/config.edn"
  []
  (let [config-edn ".clj-kondo/metosin/malli-types/config.edn"
        compile-cmd "clojure -M:cljs compile gen-malli-kondo-config"]
    (println compile-cmd)
    (shell compile-cmd)
    (println "generate kondo config: " config-edn)
    (io/make-parents config-edn)
    (let [config (with-out-str
                   (pp/pprint (edn/read-string (:out (shell {:out :string} "node ./static/gen-malli-kondo-config.js")))))]
      (spit config-edn config))))

(defn diff-datoms
  "Runs data/diff on two edn files written by dev:db-datoms"
  [file1 file2 & args]
  (let [spec {:ignored-attributes
              ;; Ignores some attributes by default that are expected to change often
              {:alias :i :coerce #{:keyword} :default #{:block/tx-id :block/order :block/updated-at}}}
        {{:keys [ignored-attributes]} :opts} (cli/parse-args args {:spec spec})
        datom-filter (fn [[e a _ _ _]] (contains? ignored-attributes a))
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
      (shell "clojure -M:cljs release publishing"))
    (println "Publishing js asset is up to date")))

(defn publishing-backend
  "Builds publishing backend and copies over supporting frontend assets"
  [& args]
  (apply shell {:dir "deps/publishing" :extra-env {"ORIGINAL_PWD" (fs/cwd)}}
         "yarn -s nbb-logseq -cp src:../graph-parser/src script/publishing.cljs"
         (into ["static"] args)))

(defn watch-publishing-frontend
  [& _args]
  (shell "clojure -M:cljs watch publishing"))

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
        (apply shell "bb" "dev:db-import" file-graph db-graph import-options)
        (shell "bb" "dev:validate-db" db-graph "-gHc")))))