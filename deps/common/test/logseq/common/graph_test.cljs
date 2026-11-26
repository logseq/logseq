(ns logseq.common.graph-test
  (:require [logseq.common.graph :as common-graph]
            [cljs.test :refer [deftest is use-fixtures async]]
            ["fs" :as fs]
            ["path" :as node-path]))

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

(defn- create-logseq-graph
  "Creates a minimal mock graph"
  [dir]
  (fs/mkdirSync (node-path/join dir "logseq") #js {:recursive true})
  (fs/mkdirSync (node-path/join dir "journals"))
  (fs/mkdirSync (node-path/join dir "pages")))

(deftest get-files
  (create-logseq-graph "tmp/test-graph")
  ;; Create files that are recognized
  (fs/writeFileSync "tmp/test-graph/pages/foo.md" "")
  (fs/writeFileSync "tmp/test-graph/journals/2023_05_09.md" "")
  (fs/mkdirSync (node-path/join "tmp/test-graph" "mirror" "markdown-notes") #js {:recursive true})
  (fs/mkdirSync (node-path/join "tmp/test-graph" "mirror" "markdown2") #js {:recursive true})
  (fs/writeFileSync "tmp/test-graph/mirror/markdown-notes/foo.md" "")
  (fs/writeFileSync "tmp/test-graph/mirror/markdown2/foo.md" "")
  ;; Create files that are ignored
  (fs/mkdirSync (node-path/join "tmp/test-graph" "logseq" "bak"))
  (fs/mkdirSync (node-path/join "tmp/test-graph" "mirror" "markdown" "pages") #js {:recursive true})
  (fs/writeFileSync "tmp/test-graph/logseq/bak/baz.md" "")
  (fs/writeFileSync "tmp/test-graph/logseq/.gitignore" "")
  (fs/writeFileSync "tmp/test-graph/mirror/markdown/pages/foo.md" "")
  (is (= ["tmp/test-graph/journals/2023_05_09.md"
          "tmp/test-graph/mirror/markdown-notes/foo.md"
          "tmp/test-graph/mirror/markdown2/foo.md"
          "tmp/test-graph/pages/foo.md"]
         (common-graph/get-files "tmp/test-graph"))))

(deftest ignored-markdown-mirror-path-honors-directory-boundary-test
  (is (common-graph/ignored-path? "tmp/test-graph" "tmp/test-graph/mirror/markdown"))
  (is (common-graph/ignored-path? "tmp/test-graph" "tmp/test-graph/mirror/markdown/pages/foo.md"))
  (is (not (common-graph/ignored-path? "tmp/test-graph" "tmp/test-graph/mirror/markdown-notes/foo.md")))
  (is (not (common-graph/ignored-path? "tmp/test-graph" "tmp/test-graph/mirror/markdown2/foo.md"))))

(deftest read-directories-includes-linked-graph-dirs-test
  (fs/mkdirSync "tmp/graphs/local" #js {:recursive true})
  (fs/mkdirSync "tmp/elsewhere/linked" #js {:recursive true})
  (fs/mkdirSync "tmp/graphs/.hidden")
  (fs/writeFileSync "tmp/graphs/file.txt" "")
  (fs/mkdirSync "tmp/elsewhere/junction" #js {:recursive true})
  (fs/symlinkSync (node-path/resolve "tmp/elsewhere/linked") "tmp/graphs/linked" "dir")
  ;; Desktop links external graphs with junctions on Windows; elsewhere the type is ignored.
  (fs/symlinkSync (node-path/resolve "tmp/elsewhere/junction") "tmp/graphs/junction" "junction")
  (fs/symlinkSync (node-path/resolve "tmp/missing") "tmp/graphs/dangling" "dir")
  (is (= ["junction" "linked" "local"]
         (sort (common-graph/read-directories "tmp/graphs")))))
