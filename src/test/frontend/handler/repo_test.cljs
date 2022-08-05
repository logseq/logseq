(ns frontend.handler.repo-test
  (:require [cljs.test :refer [deftest use-fixtures]]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :as conversion-handler]
            [frontend.test.helper :as test-helper]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [frontend.db.conn :as conn]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- conversion-dir-ver3
  [path]
  (let [original-body (gp-util/path->file-body path)
        ;; only test file name parsing, don't consider title prop overriding
        rename-target (conversion-handler/calc-dir-ver-3-rename-target original-body nil)]
    (if rename-target
      (do (prn "conversion dir-ver3: " original-body " -> " rename-target)
        (#'page-handler/compute-new-file-path path rename-target))
      path)))

(defn- convert-graph-files-path
  "Given a list of files, converts them according to the given conversion function"
  [files conversion-fn]
  (map (fn [file]
         (assoc file :file/path (conversion-fn (:file/path file)))) files))

;; Integration test that test parsing a large graph like docs
;; Check if file name conversion from old version of docs is working
(deftest ^:integration parse-and-load-v067-files-to-db
  (let [graph-dir "src/test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.6.7")
        files (gp-cli/build-graph-files graph-dir)
        ;; Converting the v0.6.7 ver docs graph under the old namespace naming rule to the new one (:repo/dir-version 0->3)
        files (convert-graph-files-path files conversion-dir-ver3)
        _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false :verbose false})
        db (conn/get-db test-helper/test-db)]

    ;; Result under new naming rule after conversion should be the same as the old one
    (docs-graph-helper/docs-graph-assertions-v067 db (map :file/path files))))

;; TODO update docs filename rules to the latest version when the namespace PR is released
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        ;; TODO update me to the latest version of doc when namespace is updated
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.6.7")
        files (gp-cli/build-graph-files graph-dir)
        _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false :verbose false})
        db (conn/get-db test-helper/test-db)]

    (docs-graph-helper/docs-graph-assertions db (map :file/path files))))
