(ns logseq.graph-parser.data-bridge-test
  (:require [cljs.test :refer [deftest are]]
            [logseq.graph-parser.data-bridge.diff-merge :as gp-diff]
            [logseq.graph-parser.mldoc :as mldoc]))

(deftest ast->diff-blocks-test
  (are [text diff-blocks]
       (= (-> (mldoc/->edn text)
              (gp-diff/ast->diff-blocks text :markdown {}))
          diff-blocks))
  "- a
  - b
    - c"
  [{:body "a" :uuid nil :level 1}
   {:body "b" :uuid nil :level 2}
   {:body "c" :uuid nil :level 3}]

  "## hello
    - world
      - nice
        - nice
      - bingo
      - world"
  [{:body "## hello" :uuid nil :level 1}
   {:body "world" :uuid nil :level 2}
   {:body "nice" :uuid nil :level 3}
   {:body "nice" :uuid nil :level 4}
   {:body "bingo" :uuid nil :level 3}
   {:body "world" :uuid nil :level 3}]

  "# a
## b
### c
#### d
### e
- f
  - g
    - h
  - i
- j"
  [{:body "# a" :uuid nil :level 1}
   {:body "## b" :uuid nil :level 1}
   {:body "### c" :uuid nil :level 1}
   {:body "#### d" :uuid nil :level 1}
   {:body "### e" :uuid nil :level 1}
   {:body "f" :uuid nil :level 1}
   {:body "g" :uuid nil :level 2}
   {:body "h" :uuid nil :level 3}
   {:body "i" :uuid nil :level 2}
   {:body "j" :uuid nil :level 1}]
  
    "- a
       id:: 63e25526-3612-4fb1-8cf9-f66db1254a58
  - b
    - c"
[{:body "a" :uuid #uuid "63e25526-3612-4fb1-8cf9-f66db1254a58" :level 1}
 {:body "b" :uuid nil :level 2}
 {:body "c" :uuid nil :level 3}])