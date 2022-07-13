(ns logseq.graph-parser.extract-test
  (:require [cljs.test :refer [deftest is]]
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

(deftest test-extract
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

(deftest test-regression-1902
  []
  (is (= ["line1" "line2" "line3" "line4"]
         (extract
          "- line1
    - line2
      - line3
     - line4"))))

(def foo-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    [{:block/content "foo content a",
      :block/format :markdown,
      :block/unordered true},
     {:block/content "foo content b",
      :block/format :markdown,
      :block/unordered true}],
    :pages
    ({:block/format :markdown,
      :block/whiteboard? true,
      :block/original-name "my foo whiteboard"})})

(deftest test-extract-whiteboard-edn
  []
  (let [{:keys [pages blocks]} (extract/extract-whiteboard-edn "foo.edn" (pr-str foo-edn) {})
        page (first pages)]
    (is (= (get-in page [:block/file :file/path]) "foo.edn"))
    (is (= (get-in page [:block/name]) "foo"))
    (is (every? #(= (:block/parent %) {:block/name "foo"}) blocks))
    (is (= (:block/uuid (first blocks)) (get-in (second blocks) [:block/left 1])))))
