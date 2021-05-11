(ns frontend.handler.extract-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [cljs-run-test :refer [run-test]]
            [frontend.handler.extract :as extract]))

(defn- extract-level-and-content
  [text]
  (->> (extract/extract-blocks-pages "repo" "a.md" text)
       last
       (mapv (juxt :block/level :block/content))))

(deftest test-extract-blocks-pages
  []
  (are [x y] (= (extract-level-and-content x) y)
    "- a
  - b
    - c"
    [[1 "a"] [2 "b"] [3 "c"]]

    "## hello
    - world
      - nice
        - nice
      - bingo
      - world
        - so good
        - nice
          - bingo
           - test"
    [[1 "## hello"]
     [2 "world"]
     [3 "nice"]
     [4 "nice"]
     [3 "bingo"]
     [3 "world"]
     [4 "so good"]
     [4 "nice"]
     [5 "bingo"]
     [6 "test"]]

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
    [[1 "# a"]
     [1 "## b"]
     [1 "### c"]
     [1 "#### d"]
     [1 "### e"]
     [1 "f"]
     [2 "g"]
     [3 "h"]
     [2 "i"]
     [1 "j"]]))

#_(run-tests)
