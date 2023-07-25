(ns frontend.handler.repo-conversion-test
  "Repo tests of directory conversion"
  (:require [cljs.test :refer [deftest use-fixtures is testing]]
            [clojure.string :as string]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [logseq.graph-parser.config :as gp-config]
            [frontend.test.helper :as test-helper]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :as conversion-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.db.conn :as conn]
            [datascript.core :as d]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- query-assertions-v067
  [db graph-dir files]
  (testing "Query based stats"
    (is (= (->> files
                ;; logseq files aren't saved under :block/file
                (remove #(string/includes? % (str graph-dir "/" gp-config/app-name "/")))
                set)
           (->> (d/q '[:find (pull ?b [* {:block/file [:file/path]}])
                       :where [?b :block/name] [?b :block/file]]
                     db)
                (map (comp #(get-in % [:block/file :file/path]) first))
                set))
        "Files on disk should equal ones in db")

    (is (= (count (filter #(re-find #"journals/" %) files))
           (->> (d/q '[:find (count ?b)
                       :where
                       [?b :block/journal? true]
                       [?b :block/name]
                       [?b :block/file]]
                     db)
                ffirst))
        "Journal page count on disk equals count in db")

    (is (= {"CANCELED" 2 "DONE" 6 "LATER" 4 "NOW" 5}
           (->> (d/q '[:find (pull ?b [*]) :where [?b :block/marker]]
                     db)
                (map first)
                (group-by :block/marker)
                (map (fn [[k v]] [k (count v)]))
                (into {})))
        "Task marker counts")

    (is (= {:markdown 3141 :org 460}
           (docs-graph-helper/get-block-format-counts db))
        "Block format counts")

    (is (= {:title 98 :id 98
            :updated-at 47 :created-at 47
            :card-last-score 6 :card-repeats 6 :card-next-schedule 6
            :card-last-interval 6 :card-ease-factor 6 :card-last-reviewed 6
            :alias 6 :logseq.macro-arguments 94 :logseq.macro-name 94 :heading 64}
           (docs-graph-helper/get-top-block-properties db))
        "Counts for top block properties")

    (is (= {:title 98
            :alias 6
            :tags 3 :permalink 2
            :name 1 :type 1 :related 1 :sample 1 :click 1 :id 1 :example 1}
           (docs-graph-helper/get-all-page-properties db))
        "Counts for all page properties")

    (is (= {:block/scheduled 2
            :block/priority 4
            :block/deadline 1
            :block/collapsed? 22
            :block/repeated? 1}
           (->> [:block/scheduled :block/priority :block/deadline :block/collapsed?
                 :block/repeated?]
                (map (fn [attr]
                       [attr
                        (ffirst (d/q [:find (list 'count '?b) :where ['?b attr]]
                                     db))]))
                (into {})))
        "Counts for blocks with common block attributes")

    (is (= #{"term" "setting" "book" "templates" "Query" "Query/table" "page"}
           (->> (d/q '[:find (pull ?n [*]) :where [?b :block/namespace ?n]] db)
                (map (comp :block/original-name first))
                set))
        "Has correct namespaces")))

(defn docs-graph-assertions-v067
  "These are common assertions that should pass in both graph-parser and main
  logseq app. It is important to run these in both contexts to ensure that the
  functionality in frontend.handler.repo and logseq.graph-parser remain the
  same"
  [db graph-dir files]
  ;; Counts assertions help check for no major regressions. These counts should
  ;; only increase over time as the docs graph rarely has deletions
  (testing "Counts"
    (is (= 211 (count files)) "Correct file count")
    (is (= 38704 (count (d/datoms db :eavt))) "Correct datoms count")

    (is (= 3600
           (ffirst
            (d/q '[:find (count ?b)
                   :where [?b :block/path-refs ?bp] [?bp :block/name]] db)))
        "Correct referenced blocks count")
    (is (= 21
           (ffirst
            (d/q '[:find (count ?b)
                   :where [?b :block/content ?content]
                   [(clojure.string/includes? ?content "+BEGIN_QUERY")]]
                 db)))
        "Advanced query count"))

  (query-assertions-v067 db graph-dir files))

(defn- convert-to-triple-lowbar
  [path]
  (let [original-body (gp-util/path->file-body path)
        ;; only test file name parsing, don't consider title prop overriding
        rename-target (:target (#'conversion-handler/calc-rename-target-impl :legacy :triple-lowbar original-body nil))]
    (if rename-target
      #_:clj-kondo/ignore
      (do #_(prn "conversion triple-lowbar: " original-body " -> " rename-target)
       (#'page-handler/compute-new-file-path path rename-target))
      path)))

(defn- convert-graph-files-path
  "Given a list of files, converts them according to the given conversion function"
  [files conversion-fn]
  (map (fn [file]
         (assoc file :file/path (conversion-fn (:file/path file)))) files))

;; Integration test that test parsing a large graph like docs
;; Check if file name conversion from old version of docs is working
(deftest ^:integration convert-v067-filenames-parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.6.7")
        files (#'gp-cli/build-graph-files graph-dir {})
        ;; Converting the v0.6.7 ver docs graph under the old namespace naming rule to the new one (:repo/dir-version 0->3)
        files (convert-graph-files-path files convert-to-triple-lowbar)
        _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false :verbose false})
        db (conn/get-db test-helper/test-db)]

    ;; Result under new naming rule after conversion should be the same as the old one
    (docs-graph-assertions-v067 db graph-dir (map :file/path files))))
