(ns ^:node-only logseq.graph-parser.cli-test
  (:require [cljs.test :refer [deftest is testing async use-fixtures]]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db :as ldb]
            [clojure.set :as set]
            ["fs" :as fs]
            ["process" :as process]
            ["path" :as path]))

(use-fixtures
  :each
  ;; Cleaning tmp/ before leaves last tmp/ after a test run for dev and debugging
  {:before
   #(async done
           (if (fs/existsSync "tmp")
             (fs/rm "tmp" #js {:recursive true} (fn [err]
                                                  (when err (js/console.log err))
                                                  (done)))
             (done)))})

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-graph
  (let [graph-dir "test/docs-0.9.2"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.9.2")
        {:keys [conn files asts]} (gp-cli/parse-graph graph-dir {:verbose false})]

    (docs-graph-helper/docs-graph-assertions @conn graph-dir files)

    (testing "Asts"
      (is (seq asts) "Asts returned are non-zero")
      (is (= files (map :file asts))
          "There's an ast returned for every file processed")
      (is (empty? (remove #(or
                            (seq (:ast %))
                            ;; edn files don't have ast
                            (string/ends-with? (:file %) ".edn")
                            ;; logseq files don't have ast
                            ;; could also used gp-config but API isn't public yet
                            (string/includes? (:file %) (str graph-dir "/logseq/")))
                          asts))
          "Parsed files shouldn't have empty asts"))))

(defn- create-logseq-graph
  "Creates a minimal mock graph"
  [dir]
  (fs/mkdirSync (path/join dir "logseq") #js {:recursive true})
  (fs/mkdirSync (path/join dir "journals"))
  (fs/mkdirSync (path/join dir "pages")))

(deftest build-graph-files
  (create-logseq-graph "tmp/test-graph")
  ;; Create files that are recognized
  (fs/writeFileSync "tmp/test-graph/pages/foo.md" "")
  (fs/writeFileSync "tmp/test-graph/journals/2023_05_09.md" "")
  ;; Create file that are ignored and filtered out
  (fs/writeFileSync "tmp/test-graph/pages/foo.json" "")
  (fs/mkdirSync (path/join "tmp/test-graph" "logseq" "bak"))
  (fs/writeFileSync "tmp/test-graph/logseq/bak/baz.md" "")

  (testing "ignored files from common-graph"
    (is (= (map #(path/join (process/cwd) "tmp/test-graph" %) ["journals/2023_05_09.md" "pages/foo.md"])
           (map :file/path (#'gp-cli/build-graph-files (path/resolve "tmp/test-graph") {})))
        "Correct paths returned for absolute dir")
    (process/chdir "tmp/test-graph")
    (is (= (map #(path/join (process/cwd) %) ["journals/2023_05_09.md" "pages/foo.md"])
           (map :file/path (#'gp-cli/build-graph-files "." {})))
        "Correct paths returned for relative current dir")
    (process/chdir "../.."))

  (testing ":hidden config"
    (fs/mkdirSync (path/join "tmp/test-graph" "script"))
    (fs/writeFileSync "tmp/test-graph/script/README.md" "")
    (is (= (map #(path/join (process/cwd) "tmp/test-graph" %) ["journals/2023_05_09.md" "pages/foo.md"])
           (map :file/path (#'gp-cli/build-graph-files "tmp/test-graph" {:hidden ["script"]})))
        "Correct paths returned")))

(defn- create-file-db
  "Creates a file-based  graph given a map of pages to blocks and returns a datascript db"
  [graph-dir pages-to-blocks]
  (fs/mkdirSync (path/join graph-dir "pages") #js {:recursive true})
  (fs/mkdirSync (path/join graph-dir "journals"))
  (doseq [[page blocks] pages-to-blocks]
    (fs/writeFileSync (if (:block/journal? page)
                                ;; Hardcode journal name until more are added
                        (path/join graph-dir "journals" "2023_07_20.md")
                        (path/join graph-dir "pages" (str (:block/name page) ".md")))
                      (string/join "\n" (map #(str "- " (:block/content %)) blocks))))
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn- create-frontend-blocks
  "For a map of pages to their blocks, this creates frontend blocks assuming only top level blocks
   are desired. Anything more complex starts to recreate outliner namespaces"
  [pages-to-blocks]
  (let [page-count (atom 0)
        new-db-id #(swap! page-count inc)
        created-at (js/Date.now)]
    (vec
     (mapcat
      (fn [[page blocks]]
        (let [page-id (new-db-id)
              page-uuid (random-uuid)]
          (into [(merge page
                        {:db/id page-id
                         :block/uuid page-uuid
                         :block/original-name (string/capitalize (:block/name page))
                         :block/created-at created-at
                         :block/updated-at created-at})]
                (mapv #(merge %
                              {:db/id (new-db-id)
                               :block/uuid (random-uuid)
                               :block/format :markdown
                               :block/path-refs [{:db/id page-id}]
                               :block/page {:db/id page-id}
                               :block/left {:db/id page-id}
                               :block/parent {:db/id page-id}
                               :block/created-at created-at
                               :block/updated-at created-at})
                      blocks))))
      pages-to-blocks))))

(defn- create-graph-db
  "Creates a sqlite-based db graph given a map of pages to blocks and returns a datascript db.
   Blocks in a map can only be top-level blocks with no referenced content"
  [dir db-name pages-to-blocks]
  (let [conn (sqlite-db/open-db! dir db-name)
        frontend-blocks (create-frontend-blocks pages-to-blocks)
        _ (d/transact! conn frontend-blocks)]
    (ldb/create-default-pages! conn {:db-graph? true})
    @conn))

(defn- datoms->entity-maps
  "Returns entity maps for given :eavt datoms"
  [datoms]
  (->> datoms
       (reduce (fn [acc m]
                 (update acc (:e m) assoc (:a m) (:v m)))
               {})
       vals))

;; This test compares the :eavt datoms from a file graph and a db graph to ensure
;; their differences are minimal and remain constant
(deftest file-and-db-graphs-have-expected-differences
  (let [graph-dir "tmp/file-and-db-graph"
        ;; pages and their blocks which are being tested
        pages-to-blocks
        {{:block/name "page1" :block/journal? false}
         [{:block/content "block 1"} {:block/content "block 2"}]
         {:block/name "jul 20th, 2023" :block/journal? true :block/journal-day 20230720}
         [{:block/content "b1"} {:block/content "b2"}]}
        file-db (create-file-db graph-dir pages-to-blocks)
        graph-db (create-graph-db "tmp" "file-and-db-graph" pages-to-blocks)
        ;; Only test meaningful differences like content, name and set of block attributes.
        ;; Most attribute values won't be the same as they are random e.g. timestamps and db ids.
        file-ents (->> (d/datoms file-db :eavt)
                       datoms->entity-maps
                       (map #(assoc (or (not-empty (select-keys % [:block/content :block/name]))
                                        %)
                                    :attributes (disj (set (keys %)) :block/file :block/format)))
                       set)
        db-ents (->> (d/datoms graph-db :eavt)
                     datoms->entity-maps
                     (map #(assoc (or (not-empty (select-keys % [:block/content :block/name]))
                                      %)
                                  :attributes (cond-> (disj (set (keys %))
                                                            ;; Don't compare :block/format as db graphs
                                                            ;; are purposely different
                                                            :block/format)
                                                (seq (:block/content %))
                                                (set/difference #{:block/created-at :block/updated-at}))))
                     set)]
    (println "Datom counts for file and db graphs are" (count (d/datoms file-db :eavt)) "and" (count (d/datoms graph-db :eavt)))
    (is (empty? (set/difference db-ents file-ents))
        "All the entities in a db graph are also in a file graph")
    (let [file-only-ents (set/difference file-ents db-ents)]
      (is (= (count file-only-ents) (count pages-to-blocks))
          "There is an additional file entity for every page")
      (is (every? :file/path file-only-ents)
          "The only  entities in a file graph (and not in a db graph) are file based ones"))))
