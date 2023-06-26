(ns frontend.fs.diff-merge-test
  (:require [cljs-bean.core :as bean]
            [cljs.test :refer [are deftest is]]
            [frontend.db.conn :as conn]
            [frontend.fs.diff-merge :as fs-diff]
            [frontend.handler.common.file :as file-common-handler]
            [logseq.db :as ldb]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]))

(defn test-db->diff-blocks
  "A hijacked version of db->diff-blocks for testing.
   It overwrites the internal db getter with the test db connection."
  [conn & args]
  (with-redefs [conn/get-db (constantly @conn)]
    (apply fs-diff/db->diff-blocks args)))

(defn org-text->diffblocks
  [text]
  (-> (gp-mldoc/->edn text (gp-mldoc/default-config :org))
      (fs-diff/ast->diff-blocks text :org {:block-pattern "-"})))

(deftest org->ast->diff-blocks-test
  (are [text diff-blocks]
       (= (org-text->diffblocks text)
          diff-blocks)
        ":PROPERTIES:
:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b
:END:
#+tItLe: Well parsed!"
[{:body ":PROPERTIES:\n:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b\n:END:\n#+tItLe: Well parsed!"
  :uuid "72289d9a-eb2f-427b-ad97-b605a4b8c59b"
  :level 1}]

    "#+title: Howdy"
    [{:body "#+title: Howdy" :uuid nil :level 1}]

    ":PROPERTIES:
:fiction: [[aldsjfklsda]]
:END:\n#+title: Howdy"
    [{:body ":PROPERTIES:\n:fiction: [[aldsjfklsda]]\n:END:\n#+title: Howdy"
      :uuid nil
      :level 1}]))

(deftest db<->ast-diff-blocks-test
  (let [conn (ldb/start-conn)
        text                                    ":PROPERTIES:
:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b
:END:
#+tItLe: Well parsed!"]
    (graph-parser/parse-file conn "foo.org" text {})
    (is (= (test-db->diff-blocks conn "Well parsed!")
           (org-text->diffblocks text)))))

(defn text->diffblocks
  [text]
  (-> (gp-mldoc/->edn text (gp-mldoc/default-config :markdown))
      (fs-diff/ast->diff-blocks text :markdown {:block-pattern "-"})))

(deftest md->ast->diff-blocks-test
  (are [text diff-blocks]
       (= (text->diffblocks text)
          diff-blocks)
  "- a
\t- b
\t\t- c"
  [{:body "a" :uuid nil :level 1}
   {:body "b" :uuid nil :level 2}
   {:body "c" :uuid nil :level 3}]

"- a
\t- b
\t\t- c
\t\t  multiline
- d"
[{:body "a" :uuid nil :level 1}
 {:body "b" :uuid nil :level 2}
 {:body "c\nmultiline" :uuid nil :level 3}
 {:body "d" :uuid nil :level 1}]

  "## hello
\t- world
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
  [{:body "## hello" :uuid nil :level 1}
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
   {:body "## b" :uuid nil :level 1}
   {:body "### c" :uuid nil :level 1}
   {:body "#### d" :uuid nil :level 1}
   {:body "### e" :uuid nil :level 1}
   {:body "f" :uuid nil :level 1}
   {:body "g" :uuid nil :level 2}
   {:body "h" :uuid nil :level 3}
   {:body "i" :uuid nil :level 2}
   {:body "j" :uuid nil :level 1}]

    "- a\n  id:: 63e25526-3612-4fb1-8cf9-f66db1254a58
\t- b
\t\t- c"
[{:body "a\nid:: 63e25526-3612-4fb1-8cf9-f66db1254a58"
  :uuid "63e25526-3612-4fb1-8cf9-f66db1254a58" :level 1}
 {:body "b" :uuid nil :level 2}
 {:body "c" :uuid nil :level 3}]
  
  "alias:: ⭐️\nicon:: ⭐️"
[{:body "alias:: ⭐️\nicon:: ⭐️", :level 1, :uuid nil}]))

(defn text->diffblocks-alt
  [text]
  (-> (gp-mldoc/->edn text (gp-mldoc/default-config :markdown))
      (#'fs-diff/ast->diff-blocks-alt text :markdown {:block-pattern "-"})))

(deftest md->ast->diff-blocks-alt-test
  (are [text diff-blocks]
       (= (text->diffblocks-alt text)
          diff-blocks)
    "- a
\t- b
\t\t- c"
    [{:body "a" :uuid nil :level 1 :meta {:raw-body "- a"}}
     {:body "b" :uuid nil :level 2 :meta {:raw-body "\t- b"}}
     {:body "c" :uuid nil :level 3 :meta {:raw-body "\t\t- c"}}]

    "- a
\t- b
\t\t- c
\t\t  multiline
- d"
    [{:body "a" :uuid nil :level 1 :meta {:raw-body "- a"}}
     {:body "b" :uuid nil :level 2 :meta {:raw-body "\t- b"}}
     {:body "c\nmultiline" :uuid nil :level 3 :meta {:raw-body "\t\t- c\n\t\t  multiline"}}
     {:body "d" :uuid nil :level 1 :meta {:raw-body "- d"}}]

    "## hello
\t- world
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
    [{:body "## hello" :uuid nil :level 1 :meta {:raw-body "## hello"}}
     {:body "world" :uuid nil :level 2 :meta {:raw-body "\t- world"}}
     {:body "nice" :uuid nil :level 3 :meta {:raw-body "\t\t- nice"}}
     {:body "nice" :uuid nil :level 4 :meta {:raw-body "\t\t\t- nice"}}
     {:body "bingo" :uuid nil :level 4 :meta {:raw-body "\t\t\t- bingo"}}
     {:body "world" :uuid nil :level 4 :meta {:raw-body "\t\t\t- world"}}]

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
    [{:body "# a" :uuid nil :level 1 :meta {:raw-body "# a"}}
     {:body "## b" :uuid nil :level 1 :meta {:raw-body "## b"}}
     {:body "### c" :uuid nil :level 1 :meta {:raw-body "### c"}}
     {:body "#### d" :uuid nil :level 1 :meta {:raw-body "#### d"}}
     {:body "### e" :uuid nil :level 1 :meta {:raw-body "### e"}}
     {:body "f" :uuid nil :level 1 :meta {:raw-body "- f"}}
     {:body "g" :uuid nil :level 2 :meta {:raw-body "\t- g"}}
     {:body "h" :uuid nil :level 3 :meta {:raw-body "\t\t- h"}}
     {:body "i" :uuid nil :level 2 :meta {:raw-body "\t- i"}}
     {:body "j" :uuid nil :level 1 :meta {:raw-body "- j"}}]

    "- a\n  id:: 63e25526-3612-4fb1-8cf9-f66db1254a58
\t- b
\t\t- c"
    [{:body "a\nid:: 63e25526-3612-4fb1-8cf9-f66db1254a58"
      :uuid "63e25526-3612-4fb1-8cf9-f66db1254a58" :level 1 :meta {:raw-body "- a\n  id:: 63e25526-3612-4fb1-8cf9-f66db1254a58"}}
     {:body "b" :uuid nil :level 2 :meta {:raw-body "\t- b"}}
     {:body "c" :uuid nil :level 3 :meta {:raw-body "\t\t- c"}}]
    
    "alias:: ⭐️\nicon:: ⭐️"
    [{:body "alias:: ⭐️\nicon:: ⭐️", :meta {:raw-body "alias:: ⭐️\nicon:: ⭐️"}, :level 1, :uuid nil}]))

(deftest diff-test
  (are [text1 text2 diffs]
       (= (bean/->clj (fs-diff/diff (text->diffblocks text1)
                                    (text->diffblocks text2)))
          diffs)
    "## hello
\t- world
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
      "## Halooooo
\t- world
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
    ;; Empty op, because no insertion op before the first base block required
    ;; See https://github.com/logseq/diff-merge#usage
    [[]
     [[-1 {:body "## hello"
          :level 1
          :uuid nil}]
      [1  {:body "## Halooooo"
          :level 1
          :uuid nil}]]
     [[0 {:body "world"
         :level 2
         :uuid nil}]]
     [[0 {:body "nice"
         :level 3
         :uuid nil}]]
     [[0 {:body "nice"
         :level 4
         :uuid nil}]]
     [[0 {:body "bingo"
         :level 4
         :uuid nil}]]
     [[0 {:body "world"
         :level 4
         :uuid nil}]]]

    "## hello
\t- world
\t  id:: 63e25526-3612-4fb1-8cf9-abcd12354abc
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
"## Halooooo
\t- world
\t\t- nice
\t\t\t- nice
\t\t\t- bingo
\t\t\t- world"
;; Empty op, because no insertion op before the first base block required
;; See https://github.com/logseq/diff-merge#usage
[[]
 [[-1 {:body "## hello"
       :level 1
       :uuid nil}]
  [1  {:body "## Halooooo"
       :level 1
       :uuid nil}]
  [1 {:body "world"
      :level 2
      :uuid nil}]]
 [[-1 {:body "world\nid:: 63e25526-3612-4fb1-8cf9-abcd12354abc"
      :level 2
      :uuid "63e25526-3612-4fb1-8cf9-abcd12354abc"}]]
 [[0 {:body "nice"
      :level 3
      :uuid nil}]]
 [[0 {:body "nice"
      :level 4
      :uuid nil}]]
 [[0 {:body "bingo"
      :level 4
      :uuid nil}]]
 [[0 {:body "world"
      :level 4
      :uuid nil}]]]

""
"- abc def"
[[[1 {:body "abc def"
      :level 1
      :uuid nil}]]]))

(deftest db->diffblocks
  (let [conn (ldb/start-conn)]
    (graph-parser/parse-file conn
                             "foo.md"
                             (str "- abc
  id:: 11451400-0000-0000-0000-000000000000\n"
                                  "- def
  id:: 63246324-6324-6324-6324-632463246324\n")
                             {})
    (graph-parser/parse-file conn
                             "bar.md"
                             (str "- ghi
  id:: 11451411-1111-1111-1111-111111111111\n"
                                  "\t- jkl
\t  id:: 63241234-1234-1234-1234-123412341234\n")
                             {})
    (are [page-name diff-blocks] (= (test-db->diff-blocks conn page-name)
                                    diff-blocks)
      "foo"
      [{:body "abc\nid:: 11451400-0000-0000-0000-000000000000" :uuid  "11451400-0000-0000-0000-000000000000" :level 1}
       {:body "def\nid:: 63246324-6324-6324-6324-632463246324" :uuid  "63246324-6324-6324-6324-632463246324" :level 1}]

      "bar"
      [{:body "ghi\nid:: 11451411-1111-1111-1111-111111111111" :uuid  "11451411-1111-1111-1111-111111111111" :level 1}
       {:body "jkl\nid:: 63241234-1234-1234-1234-123412341234" :uuid  "63241234-1234-1234-1234-123412341234" :level 2}])

    (are [page-name text new-uuids] (= (let [old-blks (test-db->diff-blocks conn page-name)
                                             new-blks (text->diffblocks text)
                                             diff-ops (fs-diff/diff old-blks new-blks)]
                                         (bean/->clj (fs-diff/attachUUID diff-ops (bean/->js (map :uuid old-blks)) "NEW_ID")))
                                       new-uuids)
      "foo"
      "- abc
- def"
      ["11451400-0000-0000-0000-000000000000"
       "NEW_ID"]

      "bar"
      "- ghi
\t- jkl"
      ["11451411-1111-1111-1111-111111111111"
       "NEW_ID"]

      "non exist page"
      "- k\n\t- l"
      ["NEW_ID" "NEW_ID"]

      "another non exist page"
      ":PROPERTIES:
:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b
:END:
#+tItLe: Well parsed!"
      ["72289d9a-eb2f-427b-ad97-b605a4b8c59b"])))

(deftest ast->diff-blocks-test
  (are [ast text diff-blocks]
       (= (fs-diff/ast->diff-blocks ast text :org {:block-pattern "-"})
          diff-blocks)
    [[["Properties" [["TiTlE" "Howdy" []]]] nil]]
    "#+title: Howdy"
    [{:body "#+title: Howdy", :level 1, :uuid nil}])

  (are [ast text diff-blocks]
       (= (fs-diff/ast->diff-blocks ast text :org {:block-pattern "-" :user-config {:property-pages/enabled? true}})
          diff-blocks)
    [[["Property_Drawer" [["foo" "#bar" [["Tag" [["Plain" "bar"]]]]] ["baz" "#bing" [["Tag" [["Plain" "bing"]]]]]]] {:start_pos 0, :end_pos 22}]]
    "foo:: #bar\nbaz:: #bing"
     [{:body "foo:: #bar\nbaz:: #bing", :level 1, :uuid nil}]))

(deftest ast-empty-diff-test
  (are [ast text diff-ops]
       (= (bean/->clj (->> (fs-diff/ast->diff-blocks ast text :org {:block-pattern "-" :user-config {:property-pages/enabled? true}})
                           (fs-diff/diff [])))
          diff-ops)
    [[["Property_Drawer" [["foo" "#bar" [["Tag" [["Plain" "bar"]]]]] ["baz" "#bing" [["Tag" [["Plain" "bing"]]]]]]] {:start_pos 0, :end_pos 22}]]
    "foo:: #bar\nbaz:: #bing"
     [[[1 {:body "foo:: #bar\nbaz:: #bing", :level 1, :uuid nil}]]]))

;; Ensure diff-merge-uuids follows the id:: in the content
(deftest diff-merge-uuid-extract-test
  (let [conn (ldb/start-conn)
        foo-content (str "- abc
  id:: 11451400-0000-0000-0000-000000000000\n"
                 "- def
  id:: 63246324-6324-6324-6324-632463246324\n")
        bar-content (str "- ghi
  id:: 11451411-1111-1111-1111-111111111111\n"
                         "\t- jkl
\t  id:: 63241234-1234-1234-1234-123412341234\n") ]
    (graph-parser/parse-file conn "foo.md" foo-content {})
    (graph-parser/parse-file conn "bar.md" bar-content {})
    (are [ast content page-name uuids]
         (= (with-redefs [conn/get-db (constantly @conn)]
              (#'file-common-handler/diff-merge-uuids-2ways :markdown ast content {:page-name page-name
                                                                             :block-pattern "-"}))
            uuids)

      (gp-mldoc/->edn (str foo-content "- newline\n") (gp-mldoc/default-config :markdown))
      (str foo-content "- newline\n")
      "foo"
      ["11451400-0000-0000-0000-000000000000"
       "63246324-6324-6324-6324-632463246324"
       nil]

      (gp-mldoc/->edn (str bar-content "- newline\n") (gp-mldoc/default-config :markdown))
      (str bar-content "- newline\n")
      "bar"
      ["11451411-1111-1111-1111-111111111111"
       "63241234-1234-1234-1234-123412341234"
       nil])))

;; Ensure diff-merge-uuids keeps the block uuids unchanged at best effort
(deftest diff-merge-uuid-persist-test
  (let [conn (ldb/start-conn)
        foo-content (str "- abc\n"
                         "- def\n")
        bar-content (str "- ghi\n"
                         "\t- jkl\n")
        foo-new-content (str foo-content "- newline\n")
        new-bar-content (str  "- newline\n" bar-content)]
    (graph-parser/parse-file conn "foo-persist.md" foo-content {})
    (graph-parser/parse-file conn "bar-persist.md" bar-content {})
    ;; Compare if the uuids are the same as those inside DB when the modified content (adding new line) is parsed
    (are [ast content page-name DB-uuids->new-uuids-fn]
         (= (with-redefs [conn/get-db (constantly @conn)]
              (#'file-common-handler/diff-merge-uuids-2ways :markdown ast content {:page-name page-name
                                                                             :block-pattern "-"}))
            ;; Get all uuids under the page
            (->> page-name
                 (test-db->diff-blocks conn)
                 (map :uuid)
                 (vec)
                 (DB-uuids->new-uuids-fn)))

      ;; Append a new line to foo
      (gp-mldoc/->edn foo-new-content (gp-mldoc/default-config :markdown))
      foo-new-content
      "foo-persist"
      (fn [db-uuids] (conj db-uuids nil))

      ;; Prepend a new line to bar
      (gp-mldoc/->edn new-bar-content (gp-mldoc/default-config :markdown))
      new-bar-content
      "bar-persist"
      (fn [db-uuids] (cons nil db-uuids)))))

(deftest diff-merge-error-capture-test
  ;; Any exception thrown in diff-merge-uuids-2ways should be captured and returned a nil
  (let [conn (ldb/start-conn)
        foo-content (str "- abc\n"
                         "- def\n")
        foo-new-content (str foo-content "- newline\n")]
    (graph-parser/parse-file conn "foo-error-cap.md" foo-content {})
    (are [ast content page-name]
         (= (with-redefs [conn/get-db (constantly @conn)
                                ;; Hijack the function to throw an exception
                          fs-diff/db->diff-blocks #(throw (js/Error. "intentional exception for testing diff-merge-uuids-2ways error capture"))]
              (#'file-common-handler/diff-merge-uuids-2ways :markdown ast content {:page-name page-name
                                                                                   :block-pattern "-"}))
            nil)

            ;; Append a new line to foo
      (gp-mldoc/->edn foo-new-content (gp-mldoc/default-config :markdown))
      foo-new-content
      "foo-error-cap")))

(deftest test-remove-indentation-spaces
  (is (= "" (gp-mldoc/remove-indentation-spaces "" 0 false)))
  (is (= "" (gp-mldoc/remove-indentation-spaces "" 3 true)))

  (is (= "- nice\n  happy" (gp-mldoc/remove-indentation-spaces "\t\t\t- nice\n\t\t\t  happy" 3 true)))
  (is (= "\t\t\t- nice\n  happy" (gp-mldoc/remove-indentation-spaces "\t\t\t- nice\n\t\t\t  happy" 3 false)))
  (is (= "\t\t\t- nice\n\t\t\t  happy" (gp-mldoc/remove-indentation-spaces "\t\t\t- nice\n\t\t\t  happy" 0 true))))

(deftest test-remove-level-spaces
  ;; Test when `format` is nil
  (is (= "nice\n\t\t\t  good" (text/remove-level-spaces "\t\t\t- nice\n\t\t\t  good" :markdown "-")))
  (is (= "- nice" (text/remove-level-spaces "\t\t\t- nice" :markdown "")))
  (is (= "nice" (text/remove-level-spaces "\t\t\t- nice" :markdown "-"))))

(deftest test-three-way-merge
  (is (= (fs-diff/three-way-merge
          "- a\n  id:: 648ab5e6-5e03-4c61-95d4-dd904a0a007f\n- b"
          "- a\n  id:: 648ab5e6-5e03-4c61-95d4-dd904a0a007f\n  aaa:: 111\n- b"
          "- c"
          :markdown)
         "- a\n  id:: 648ab5e6-5e03-4c61-95d4-dd904a0a007f\n  aaa:: 111\n- c")))
