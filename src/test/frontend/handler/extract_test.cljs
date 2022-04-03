(ns frontend.handler.extract-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.extract :as extract]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn- extract
  [text]
  (p/let [result (extract/extract-blocks-pages "repo" "a.md" text)
          result (last result)
          lefts (map (juxt :block/parent :block/left) result)]
    (if (not= (count lefts) (count (distinct lefts)))
      (do
        (util/pprint (map (fn [x] (select-keys x [:block/uuid :block/level :block/content :block/left])) result))
        (throw (js/Error. ":block/parent && :block/left conflicts")))
      (mapv :block/content result))))

(defn- async-test
  [x y]
  (async done
         (p/then
          (extract x)
          (fn [v]
            (is (= y v))
            (done)))))

(deftest test-extract-blocks-pages
  []
  (async-test
   "- a
  - b
    - c"
   ["a" "b" "c"])

  (async-test
   "## hello
    - world
      - nice
        - nice
      - bingo
      - world"
   ["## hello" "world" "nice" "nice" "bingo" "world"])

  (async-test
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

   ["# a" "## b" "### c" "#### d" "### e" "f" "g" "h" "i" "j"]))

(deftest test-regression-1902
  []
  (async-test
   "- line1
    - line2
      - line3
     - line4"
   ["line1" "line2" "line3" "line4"]))

#_(cljs.test/run-tests)
