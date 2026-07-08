(ns frontend.components.imports-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]))

(defn- source-for
  [relative-file]
  (.toString (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(deftest file-graph-import-delegates-db-work-to-worker-test
  (let [source (source-for "src/main/frontend/components/imports.cljs")]
    (is (string/includes? source ":thread-api/import-file-graph")
        "File graph import should call the worker import API.")
    (is (not (string/includes? source (str "db/" "get-db repo false")))
        "File graph import should not acquire the target renderer DB conn.")
    (is (not (string/includes? source "gp-exporter/export-file-graph"))
        "File graph import should not run graph-parser export against a renderer conn.")
    (is (not (string/includes? source "db-browser/transact!"))
        "File graph import should not apply import tx reports from the renderer.")))
