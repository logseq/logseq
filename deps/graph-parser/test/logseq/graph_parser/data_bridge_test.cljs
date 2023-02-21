(ns logseq.graph-parser.data-bridge-test
  (:require [cljs.test :refer [deftest are]]
            [logseq.graph-parser.data-bridge.diff-merge :as gp-diff]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

(deftest ast->diff-blocks-test
  (are [text diff-blocks]
       (= (-> (gp-mldoc/->edn text (gp-mldoc/default-config :markdown))
              (gp-diff/ast->diff-blocks text :markdown {:block-pattern "-"}))
          diff-blocks)
  "- a
\t- b
\t\t- c"
  [{:body "a" :uuid nil :level 1}
   {:body "b" :uuid nil :level 2}
   {:body "c" :uuid nil :level 3}]

  "## hello
\t- world
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
  [{:body "## hello" :uuid nil :level 2}
   {:body "world" :uuid nil :level 2}
   {:body "nice" :uuid nil :level 3}
   {:body "nice" :uuid nil :level 4}
   {:body "bingo" :uuid nil :level 4}
   {:body "world" :uuid nil :level 4}]

  "# a
## b
### c
#### d
### e
- f
\t- g
\t\t- h
\t- i
- j"
  [{:body "# a" :uuid nil :level 1}
   {:body "## b" :uuid nil :level 2}
   {:body "### c" :uuid nil :level 3}
   {:body "#### d" :uuid nil :level 4}
   {:body "### e" :uuid nil :level 3}
   {:body "f" :uuid nil :level 1}
   {:body "g" :uuid nil :level 2}
   {:body "h" :uuid nil :level 3}
   {:body "i" :uuid nil :level 2}
   {:body "j" :uuid nil :level 1}]
  
    "- a\n  id:: 63e25526-3612-4fb1-8cf9-f66db1254a58
\t- b
\t\t- c"
[{:body "a\n id:: 63e25526-3612-4fb1-8cf9-f66db1254a58" 
  :uuid "63e25526-3612-4fb1-8cf9-f66db1254a58" :level 1}
 {:body "b" :uuid nil :level 2}
 {:body "c" :uuid nil :level 3}]))