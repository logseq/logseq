(ns logseq.graph-parser.extract-test
  (:require [cljs.test :refer [deftest is are]]
            [logseq.graph-parser.extract :as extract]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db :as ldb]))

;; This is a copy of frontend.util.fs/multiplatform-reserved-chars for reserved chars testing
(def multiplatform-reserved-chars ":\\*\\?\"<>|\\#\\\\")

;; Stuffs should be parsable (don't crash) when users dump some random files
(deftest page-name-parsing-tests
  (is (string? (#'extract/tri-lb-title-parsing  "___-_-_-_---___----")))
  (is (string? (#'extract/tri-lb-title-parsing  "_____///____---___----")))
  (is (string? (#'extract/tri-lb-title-parsing  "/_/////---/_----")))
  (is (string? (#'extract/tri-lb-title-parsing  "/\\#*%lasdf\\//__--dsll_____----....-._0x2B")))
  (is (string? (#'extract/tri-lb-title-parsing  "/\\#*%l;;&&;&\\//__--dsll_____----....-._0x2B")))
  (is (string? (#'extract/tri-lb-title-parsing  multiplatform-reserved-chars)))
  (is (string? (#'extract/tri-lb-title-parsing  "dsa&amp&semi;l dsalfjk jkl"))))

(deftest uri-decoding-tests
  (is (= (#'extract/safe-url-decode "%*-sd%%%saf%=lks") "%*-sd%%%saf%=lks")) ;; Contains %, but invalid
  (is (= (#'extract/safe-url-decode "%2FDownloads%2FCNN%3AIs%5CAll%3AYou%20Need.pdf") "/Downloads/CNN:Is\\All:You Need.pdf"))
  (is (= (#'extract/safe-url-decode "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla") "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla")))

(deftest page-name-sanitization-backward-tests
  (is (= "abc.def.ghi.jkl" (#'extract/tri-lb-title-parsing "abc.def.ghi.jkl")))
  (is (= "abc/def/ghi/jkl" (#'extract/tri-lb-title-parsing "abc%2Fdef%2Fghi%2Fjkl")))
  (is (= "abc%/def/ghi/jkl" (#'extract/tri-lb-title-parsing "abc%25%2Fdef%2Fghi%2Fjkl")))
  (is (= "abc%2——ef/ghi/jkl" (#'extract/tri-lb-title-parsing "abc%2——ef%2Fghi%2Fjkl")))
  (is (= "abc&amp;2Fghi/jkl" (#'extract/tri-lb-title-parsing "abc&amp;2Fghi%2Fjkl")))
  (is (= "abc&lt;2Fghi/jkl" (#'extract/tri-lb-title-parsing "abc&lt;2Fghi%2Fjkl")))
  (is (= "abc&percnt;2Fghi/jkl" (#'extract/tri-lb-title-parsing "abc&percnt;2Fghi%2Fjkl")))
  (is (= "abc&semi;&;2Fghi/jkl" (#'extract/tri-lb-title-parsing "abc&semi;&;2Fghi%2Fjkl")))
  ;; happens when importing some compatible files on *nix / macOS
  (is (= multiplatform-reserved-chars (#'extract/tri-lb-title-parsing multiplatform-reserved-chars))))

(deftest path-utils-tests
  (is (= "asldk lakls " (#'extract/path->file-body "/data/app/asldk lakls .lsad")))
  (is (= "asldk lakls " (#'extract/path->file-body "asldk lakls .lsad")))
  (is (= "asldk lakls" (#'extract/path->file-body "asldk lakls")))
  (is (= "asldk lakls" (#'extract/path->file-body "/data/app/asldk lakls")))
  (is (= "asldk lakls" (#'extract/path->file-body "file://data/app/asldk lakls.as")))
  (is (= "中文asldk lakls" (#'extract/path->file-body "file://中文data/app/中文asldk lakls.as"))))

(defn- extract [file content & [options]]
  (extract/extract file
                   content
                   (merge {:block-pattern "-" :db (d/empty-db db-schema/schema)
                           :verbose false}
                          options)))

(defn- extract-block-content
  [text]
  (let [{:keys [blocks]} (extract "a.md" text)]
    (mapv :block/title blocks)))

(defn- extract-title [file text]
  (-> (extract file text) :pages first :block/properties :title))

(deftest extract-blocks-for-headings
  (is (= ["a" "b" "c"]
         (extract-block-content
          "- a
  - b
    - c")))

  (is (= ["## hello" "world" "nice" "nice" "bingo" "world"]
         (extract-block-content "## hello
    - world
      - nice
        - nice
      - bingo
      - world")))

  (is (= ["# a" "## b" "### c" "#### d" "### e" "f" "g" "h" "i" "j"]
         (extract-block-content "# a
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
#+title: diagram/abcdef"))))

(deftest extract-blocks-with-property-pages-config
  (are [extract-args expected-refs]
       (= expected-refs
          (->> (apply extract extract-args)
               :blocks
               (mapcat #(->> % :block/refs (map :block/name)))
               set))

    ["a.md" "foo:: #bar\nbaz:: #bing" {:user-config {:property-pages/enabled? true}}]
    #{"bar" "bing" "foo" "baz"}

    ["a.md" "foo:: #bar\nbaz:: #bing" {:user-config {:property-pages/enabled? false}}]
    #{"bar" "bing"}))

(deftest test-regression-1902
  (is (= ["line1" "line2" "line3" "line4"]
         (extract-block-content
          "- line1
    - line2
      - line3
     - line4"))))

(def foo-edn
  "Example exported whiteboard page as an edn exportable."
  '{:blocks
    ({:block/title "foo content a",
      :block/format :markdown},
     {:block/title "foo content b",
      :block/format :markdown}),
    :pages
    ({:block/format :markdown,
      :block/title "Foo"
      :block/uuid #uuid "a846e3b4-c41d-4251-80e1-be6978c36d8c"
      :block/properties {:title "my whiteboard foo"}})})

(deftest test-extract-whiteboard-edn
  (let [{:keys [pages blocks]} (extract/extract-whiteboard-edn "/whiteboards/foo.edn" (pr-str foo-edn) {})
        page (first pages)]
    (is (= (get-in page [:block/file :file/path]) "/whiteboards/foo.edn"))
    (is (= (:block/name page) "foo"))
    (is (ldb/whiteboard? page))
    (is (= (:block/title page) "Foo"))
    (is (every? #(= (:block/parent %) [:block/uuid #uuid "a846e3b4-c41d-4251-80e1-be6978c36d8c"]) blocks))))
