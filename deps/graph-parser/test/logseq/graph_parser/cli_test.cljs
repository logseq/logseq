(ns ^:node-only logseq.graph-parser.cli-test
  (:require [cljs.test :refer [deftest is testing async use-fixtures]]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [clojure.string :as string]
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