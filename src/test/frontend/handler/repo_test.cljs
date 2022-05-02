(ns frontend.handler.repo-test
  (:require [cljs.test :refer [deftest use-fixtures is]]
            [clojure.string :as string]
            ["fs" :as fs]
            ["child_process" :as child-process]
            [frontend.handler.repo :as repo-handler]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- slurp
  "Like clojure.core/slurp"
  [file]
  (str (fs/readFileSync file)))

(defn- sh
  "Run shell cmd synchronously and print to inherited streams by default. Aims
    to be similar to babashka.tasks/shell"
  [cmd opts]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           (clj->js (merge {:stdio "inherit"} opts))))

(defn- build-graph-files
  [dir]
  (let [files (->> (str (.-stdout (sh ["git" "ls-files"]
                                      {:cwd dir :stdio nil})))
                   string/split-lines
                   (filter #(re-find #"^(pages|journals)" %))
                   (map #(str dir "/" %)))]
    (mapv #(hash-map :file/path % :file/content (slurp %)) files)))

(defn- clone-docs-repo-if-not-exists
  [dir]
  (when-not (.existsSync fs dir)
    (sh ["git" "clone" "--depth" "1" "-b" "v0.6.7" "-c" "advice.detachedHead=false"
         "https://github.com/logseq/docs" dir] {})))

;; Integration test that test parsing a large graph like docs
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        _ (clone-docs-repo-if-not-exists graph-dir)
        files (build-graph-files graph-dir)]
    (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false})
    (let [db-pages (map first (db-utils/q '[:find (pull ?b [* {:block/file [:file/path]}]) :where [?b :block/name] [?b :block/file]]))]
      (is (= 206 (count files)) "Correct file count")
      (is (= 40888 (count (d/datoms (conn/get-db test-helper/test-db) :eavt)))
          "Correct datoms count")

      (is (= (set (map :file/path files))
             (set (map #(get-in % [:block/file :file/path]) db-pages)))
          "Journal and pages files on disk should equal ones in db")
      (is (= #{"term" "setting" "book" "templates" "Query" "Query/table" "page"}
             (->> (db-utils/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]])
                  (map (comp :block/original-name first))
                  set))
          "Has correct namespaces"))))
