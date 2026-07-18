(ns frontend.components.imports-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.components.imports]
            [logseq.db :as ldb]))

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

(deftest file-graph-import-options-cross-the-transit-boundary-test
  (let [build-options (some-> (resolve 'frontend.components.imports/build-file-graph-worker-options)
                              deref)]
    (is (fn? build-options))
    (when (fn? build-options)
      (let [options (build-options {:tag-classes "Project, Area"
                                    :property-classes "Priority"
                                    :property-parent-classes "Metadata"
                                    :graph-name "Imported graph"}
                                   "{:meta/version 1}")]
        (is (= options (-> options ldb/write-transit-str ldb/read-transit-str)))
        (is (= #{"Project" "Area"} (get-in options [:user-options :tag-classes])))
        (is (not (contains? options :notify-user)))))))
