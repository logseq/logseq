(ns logseq.graph-parser.extract-test
  (:require [cljs.test :refer [deftest is are]]
            [logseq.graph-parser.extract :as extract]
            [clojure.pprint :as pprint]))

(defn- extract
  [text]
  (let [{:keys [blocks]} (extract/extract "a.md" text {:block-pattern "-"})
        lefts (map (juxt :block/parent :block/left) blocks)]
    (if (not= (count lefts) (count (distinct lefts)))
      (do
        (pprint/pprint (map (fn [x] (select-keys x [:block/uuid :block/level :block/content :block/left])) blocks))
        (throw (js/Error. ":block/parent && :block/left conflicts")))
      (mapv :block/content blocks))))

(deftest extract-blocks-for-headings
  []
  (is (= ["a" "b" "c"]
         (extract
          "- a
  - b
    - c")))

  (is (= ["## hello" "world" "nice" "nice" "bingo" "world"]
         (extract "## hello
    - world
      - nice
        - nice
      - bingo
      - world")))

  (is (= ["# a" "## b" "### c" "#### d" "### e" "f" "g" "h" "i" "j"]
       (extract "# a
## b
### c
#### d
### e
- f
  - g
    - h
  - i
- j"))))

(deftest extract-blocks-with-property-pages-config
  []
  (are [extract-args expected-refs]
       (= expected-refs
          (->> (apply extract/extract extract-args)
               :blocks
               (mapcat #(->> % :block/refs (map :block/name)))
               set))

       ["a.md" "foo:: #bar\nbaz:: #bing" {:block-pattern "-" :user-config {:property-pages/enabled? true}}]
       #{"bar" "bing" "foo" "baz"}

       ["a.md" "foo:: #bar\nbaz:: #bing" {:block-pattern "-" :user-config {:property-pages/enabled? false}}]
       #{"bar" "bing"}))

(deftest test-regression-1902
  []
  (is (= ["line1" "line2" "line3" "line4"]
         (extract
          "- line1
    - line2
      - line3
     - line4"))))
