(ns ^:node-only logseq.graph-parser.exporter-page-merge-test
  "File-graph import cases where a page file is merged into the wrong page or
  gives an existing page a tag it cannot have"
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [is]]
            [datascript.core :as d]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [logseq.outliner.page :as outliner-page]
            [promesa.core :as p]))

(defn- <read-file
  [file]
  (p/let [s (fs/readFileSync (:path file))]
    (str s)))

(defn- write-temp-files
  "Writes [relative-path content] pairs into a new temp dir and returns their
  full paths in the given order"
  [files]
  (let [dir (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-graph-parser-test-"))]
    (mapv (fn [[relative-path content]]
            (let [file-path (node-path/join dir relative-path)]
              (fs/mkdirSync (node-path/dirname file-path) #js {:recursive true})
              (fs/writeFileSync file-path content)
              (path/path-normalize file-path)))
          files)))

(defn- import-files!
  "Imports the files in the given order, as export-file-graph does"
  [files]
  (let [conn (db-test/create-conn)
        _ (db-pipeline/add-listener conn)
        notifications (atom [])
        _ (reset! gp-block/*export-to-db-graph? true)]
    (-> (p/let [doc-options (gp-exporter/build-doc-options
                             {:macros {} :file/name-format :triple-lowbar}
                             {:notify-user #(swap! notifications conj %)
                              :<read-file <read-file
                              :default-config {}
                              :user-options {:convert-all-tags? false}})
                _ (gp-exporter/export-doc-files conn (mapv #(hash-map :path %) (write-temp-files files))
                                                <read-file doc-options)]
          conn)
        (p/finally (fn [_]
                     (reset! gp-block/*export-to-db-graph? false))))))

(defn- pages-named
  [db page-name]
  (->> (d/q '[:find [?p ...] :in $ ?name :where [?p :block/name ?name]] db page-name)
       (map #(d/entity db %))))

(defn- root-page
  [db page-name]
  (first (remove :block/parent (pages-named db page-name))))

(defn- page-block-titles
  [page]
  (set (map :block/title (:block/_page page))))

(deftest-async namespace-page-file-before-root-page-file-keeps-both-pages
  (p/let [conn (import-files! [["pages/a___b.md" "- under ns"]
                               ["pages/b.md" "- plain b"]
                               ["pages/c.md" "- refs [[a/b]] and [[b]]"]])
          db @conn
          ns-page (first (filter :block/parent (pages-named db "b")))
          plain-page (root-page db "b")
          refs-block (db-test/find-block-by-content db #"^refs ")]
    (is (some? plain-page) "pages/b.md creates a root page b")
    (is (= #{"under ns"} (page-block-titles ns-page)) "a/b keeps only its own blocks")
    (is (= #{"plain b"} (page-block-titles plain-page)) "b has the blocks of pages/b.md")
    (is (= #{(:db/id ns-page) (:db/id plain-page)} (set (map :db/id (:block/refs refs-block))))
        "[[a/b]] and [[b]] link to two different pages")
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! db))))
        "Imported graph validates")))

(deftest-async namespace-ref-before-root-ref-keeps-both-pages
  (p/let [conn (import-files! [["pages/a.md" "- first [[projects/b]]"]
                               ["pages/c.md" "- later [[b]]"]])
          db @conn
          plain-page (root-page db "b")
          later-block (db-test/find-block-by-content db #"^later ")]
    (is (= 2 (count (pages-named db "b"))) "projects/b and b are two pages")
    (is (some? plain-page) "[[b]] creates a root page b")
    (is (= [(:db/id plain-page)] (map :db/id (:block/refs later-block)))
        "[[b]] links to the root page b, not to projects/b")))

(deftest-async nested-namespace-page-keeps-its-root-namespace-parent
  (p/let [conn (import-files! [["pages/b.md" "- r"]
                               ["pages/projects___sub___b.md" "- d"]
                               ["pages/sub___b.md" "- s"]])
          db @conn
          root-sub (root-page db "sub")
          s-page (:block/page (db-test/find-block-by-content db "s"))]
    (is (= 2 (count (pages-named db "sub"))) "projects/sub and sub are two pages")
    (is (some? root-sub) "sub/b creates a root page sub")
    (is (= (:db/id root-sub) (:db/id (:block/parent s-page)))
        "The page of pages/sub___b.md is under the root page sub")))

(deftest-async journal-file-and-page-file-for-same-date-make-one-valid-journal
  (p/let [conn (import-files! [["journals/2023_06_21.md" "- j1"]
                               ["pages/Jun 21st, 2023.md" "- p1"]])
          page (db-test/find-journal-by-journal-day @conn 20230621)
          page-tags (set (map :db/ident (:block/tags page)))]
    (is (= #{"j1" "p1"} (page-block-titles page)) "Both files' blocks are on the journal page")
    (is (contains? page-tags :logseq.class/Journal) "The page is a journal")
    (is (not (contains? page-tags :logseq.class/Page)) "The journal is not also tagged #Page")
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Imported graph validates")
    (is (true? (outliner-page/delete! conn (:block/uuid page)))
        "The imported journal page can be deleted")
    (is (ldb/recycled? (d/entity @conn (:db/id page))) "The deleted journal page is in the Recycle")))

(deftest-async page-file-before-journal-file-for-same-date-make-one-valid-journal
  (p/let [conn (import-files! [["pages/Jun 21st, 2023.md" "- p1"]
                               ["journals/2023_06_21.md" "- j1"]])
          page (db-test/find-journal-by-journal-day @conn 20230621)
          page-tags (set (map :db/ident (:block/tags page)))]
    (is (= 1 (count (pages-named @conn "jun 21st, 2023"))) "There is one page for the date")
    (is (= #{"j1" "p1"} (page-block-titles page)) "Both files' blocks are on the journal page")
    (is (contains? page-tags :logseq.class/Journal) "The page is a journal")
    (is (not (contains? page-tags :logseq.class/Page)) "The journal is not also tagged #Page")
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Imported graph validates")
    (is (true? (outliner-page/delete! conn (:block/uuid page)))
        "The imported journal page can be deleted")))

(deftest-async journal-file-and-page-file-with-tags-for-same-date-make-one-valid-journal
  (p/let [conn (import-files! [["journals/2023_06_21.md" "- j1"]
                               ["pages/Jun 21st, 2023.md" "tags:: foo\n\n- p1"]])
          page (db-test/find-journal-by-journal-day @conn 20230621)
          page-tags (set (map :db/ident (:block/tags page)))]
    (is (contains? page-tags :logseq.class/Journal) "The page is a journal")
    (is (not (contains? page-tags :logseq.class/Page)) "The journal is not also tagged #Page")
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Imported graph validates")))
