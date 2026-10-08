(ns logseq.tasks.dev
  "Tasks for the OCaml app and publishing builds."
  (:refer-clojure :exclude [test])
  (:require [babashka.cli :as cli]
            [babashka.fs :as fs]
            [babashka.process :refer [shell]]
            [clojure.data :as data]
            [clojure.edn :as edn]
            [clojure.pprint :as pp]
            [clojure.string :as string]
            [logseq.tasks.dev.lint :as dev-lint]))

(defn test
  "Runs the OCaml worker and UI tests, forwarding `args` to pnpm."
  [& args]
  (apply shell {:shutdown nil} "pnpm" "test" args))

(defn lint-and-test
  "Runs dictionary validation and the OCaml test suites."
  []
  (dev-lint/dev)
  (test))

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
  "Builds the LUI frontend and static publishing assets."
  [& _args]
  (when-not (System/getenv "SKIP_ASSET")
    (shell {:shutdown nil} "pnpm publishing:build")))

(defn publishing-backend
  "Exports a SQLite graph using the OCaml publishing implementation."
  [& args]
  (apply shell {:shutdown nil} "node scripts/publishing.mjs" "static" args))

(defn db-import-many
  [& args]
  (let [parent-graph-dir "./out"
        [file-graphs import-options] (split-with #(not (string/starts-with? % "-")) args)]
    (doseq [file-graph file-graphs]
      (let [db-graph (fs/path parent-graph-dir (fs/file-name file-graph))]
        (println "Importing" (str db-graph) "...")
        (apply shell {:shutdown nil} "bb" "dev:db-import" file-graph db-graph (concat import-options ["--validate"]))))))
