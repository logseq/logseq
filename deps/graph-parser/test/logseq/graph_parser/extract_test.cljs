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

(defn- extract-title [file text]
  (-> (extract/extract file text {}) :pages first :block/properties :title))

(deftest extract-blocks-for-headings
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

(deftest parse-page-title
  (is (= nil
         (extract-title "foo.org" "")))
  (is (= "Howdy"
         (extract-title "foo.org" "#+title: Howdy")))
  (is (= "Howdy"
         (extract-title "foo.org" "#+TITLE: Howdy")))
  (is (= "Howdy"
         (extract-title "foo.org" "#+TiTlE: Howdy")))
  (is (= "diagram/abcdef"
         (extract-title "foo.org" ":PROPERTIES:
:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b
:END:
#+TITLE: diagram/abcdef")))
  (is (= "diagram/abcdef"
         (extract-title "foo.org" ":PROPERTIES:
:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b
:END:
#+title: diagram/abcdef")))
)

(deftest extract-blocks-with-property-pages-config
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
  (is (= ["line1" "line2" "line3" "line4"]
         (extract
          "- line1
    - line2
      - line3
     - line4"))))

(def foo-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    ({:block/content "foo content a",
      :block/format :markdown},
     {:block/content "foo content b",
      :block/format :markdown}),
    :pages
    ({:block/format :markdown,
      :block/original-name "Foo"
      :block/properties {:title "my whiteboard foo"}})})

(deftest test-extract-whiteboard-edn
  (let [{:keys [pages blocks]} (extract/extract-whiteboard-edn "/whiteboards/foo.edn" (pr-str foo-edn) {})
        page (first pages)]
    (is (= (get-in page [:block/file :file/path]) "/whiteboards/foo.edn"))
    (is (= (:block/name page) "foo"))
    (is (= (:block/type page) "whiteboard"))
    (is (= (:block/original-name page) "Foo"))
    (is (every? #(= (:block/parent %) {:block/name "foo"}) blocks))))
