(ns ^:node-only logseq.graph-parser.exporter-convert-tags-test
  "File-graph import with convert-all-tags? on: tags that must not become an
  invalid class"
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [is]]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [promesa.core :as p]))

(defn- <read-file
  [file]
  (p/let [s (fs/readFileSync (:path file))]
    (str s)))

(defn- write-temp-files
  [files]
  (let [dir (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-graph-parser-test-"))]
    (mapv (fn [[relative-path content]]
            (let [file-path (node-path/join dir relative-path)]
              (fs/mkdirSync (node-path/dirname file-path) #js {:recursive true})
              (fs/writeFileSync file-path content)
              (path/path-normalize file-path)))
          files)))

(defn- import-files-converting-tags!
  "Imports the files in the given order with convert-all-tags? on"
  [files]
  (let [conn (db-test/create-conn)
        _ (db-pipeline/add-listener conn)
        _ (reset! gp-block/*export-to-db-graph? true)]
    (-> (p/let [doc-options (gp-exporter/build-doc-options
                             {:macros {} :file/name-format :triple-lowbar}
                             {:notify-user (constantly nil)
                              :<read-file <read-file
                              :default-config {}
                              :user-options {:convert-all-tags? true}})
                _ (gp-exporter/export-doc-files conn (mapv #(hash-map :path %) (write-temp-files files))
                                                <read-file doc-options)]
          conn)
        (p/finally (fn [_]
                     (reset! gp-block/*export-to-db-graph? false))))))

(deftest-async tag-naming-a-journal-date-keeps-the-journal-a-journal
  (p/let [conn (import-files-converting-tags! [["pages/a.md" "- t #[[Dec 31st, 2025]]"]])
          db @conn
          journal (db-test/find-journal-by-journal-day db 20251231)
          block (db-test/find-block-by-content db #"^t ")]
    (is (some? journal) "The tag's date is a journal page")
    (is (not (ldb/class? journal)) "The journal page is not a class")
    (is (contains? (set (map :db/id (:block/refs block))) (:db/id journal)) "The block refs the journal")
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! db))))
        "Imported graph validates")))

(deftest-async tag-naming-an-imported-journal-keeps-the-journal-a-journal
  (p/let [conn (import-files-converting-tags! [["journals/2025_12_31.md" "- j"]
                                               ["pages/a.md" "- t #[[Dec 31st, 2025]]"]])
          db @conn
          journal (db-test/find-journal-by-journal-day db 20251231)]
    (is (not (ldb/class? journal)) "The journal page is not a class")
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! db))))
        "Imported graph validates")))
