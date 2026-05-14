(ns logseq.graph-parser.mldoc-test
  (:require [cljs.test :refer [testing deftest are is]]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]))

(def md-config (gp-mldoc/default-config :markdown))

(deftest src-test
  (is (= [["Src"
           {:lines [": hello" "\n"],
            :pos_meta {:start_pos 4, :end_pos 12},
            :full_content "```\n: hello\n```"}]
          {:start_pos 0, :end_pos 15}]
         (first (gp-mldoc/->edn "```
: hello
```" md-config)))
      "Basic src example")

  (is (= [["Src"
           {:lines ["  hello" "\n" "  world" "\n"],
            :pos_meta {:start_pos 7, :end_pos 25},
            :full_content "```\nhello\nworld\n```"}]
          {:start_pos 1, :end_pos 29}]
         (second (gp-mldoc/->edn "
  ```
  hello
  world
  ```
" md-config)))
      "Src example with leading whitespace"))

(defn- get-properties
  [x]
  (->> (gp-mldoc/->edn x md-config)
       ffirst second
       (map (fn [[k v ast]]
              [(keyword k) (text/parse-property k v ast {})]))
       (into {})))

(defn- markdown-table
  [text]
  (let [[block _pos-meta] (first (gp-mldoc/->edn text md-config))]
    (is (= "Table" (first block)))
    (second block)))

(defn- normalize-markdown-table-asts
  [ast content config]
  ((deref (var gp-mldoc/normalize-markdown-table-asts)) ast content config))

(deftest md-properties-test
  (are [x y] (= y (get-properties x))

    ;; reference values
    "property:: [[foo]], [[bar]]"
    {:property #{"foo" "bar"}}

    ;; comma separated
    "tags:: foo, bar, foo"
    {:tags #{"foo" "bar"}}))

(deftest name-definition-test
  (is (= [["List"
           [{:content [["Paragraph" [["Plain" "definition"]]]],
             :items [],
             :name [["Plain" "term"]],
             :indent 0,
             :ordered false}]]
          {:start_pos 0, :end_pos 17}]
         (first (gp-mldoc/->edn "term
: definition" md-config)))))

(deftest macro-with-script-markup-test
  (testing "inline macros can contain superscript and subscript markup"
    (are [content ast] (= ast (gp-mldoc/inline->edn content md-config))
      "{{cloze Ca^{ +2} ions}}"
      [["Macro" {:name "cloze" :arguments ["Ca^{ +2} ions"]}]]

      "{{cloze H_{2}O}}"
      [["Macro" {:name "cloze" :arguments ["H_{2}O"]}]]

      "{{cloze Ca^{+2}}}"
      [["Macro" {:name "cloze" :arguments ["Ca^{+2}"]}]]

      "{{foo Ca^{ +2} ions, [[a, b]], \"c, d\"}}"
      [["Macro" {:name "foo" :arguments ["Ca^{ +2} ions" "[[a, b]]" "\"c, d\""]}]]

      ;; page ref inside a macro that also has script markup — exercises
      ;; the Nested_link case in inline-ast->source
      "{{cloze Ca^{ +2} [[water]]}}"
      [["Macro" {:name "cloze" :arguments ["Ca^{ +2} [[water]]"]}]]))

  (testing "normal macros without script markup are not modified"
    (are [content ast] (= ast (gp-mldoc/inline->edn content md-config))
      "{{cloze simple text}}"
      [["Macro" {:name "cloze" :arguments ["simple text"]}]]

      "{{foo a, b, c}}"
      [["Macro" {:name "foo" :arguments ["a" "b" "c"]}]]

      "{{cloze [[page name]]}}"
      [["Macro" {:name "cloze" :arguments ["[[page name]]"]}]]))

  (testing "block parsing keeps the issue reproduction as macro nodes"
    (is (= [["Plain" "This is usually highlighted by the accumulation of the "]
            ["Macro" {:name "cloze" :arguments ["Ca^{ +2} ions"]}]
            ["Plain" " . This will be seen as "]
            ["Macro" {:name "cloze" :arguments ["<ins>large flocculent amorphous densities in TEM</ins>"]}]]
           (-> (gp-mldoc/->edn
                "- This is usually highlighted by the accumulation of the {{cloze Ca^{ +2} ions}} . This will be seen as {{cloze <ins>large flocculent amorphous densities in TEM</ins>}}"
                md-config)
               ffirst
               second
               :title)))

    (is (= [["Plain" "Water formula is "]
            ["Macro" {:name "cloze" :arguments ["H_{2}O"]}]]
           (-> (gp-mldoc/->edn
                "- Water formula is {{cloze H_{2}O}}"
                md-config)
               ffirst
               second
               :title)))))

(deftest markdown-table-cell-boundary-test
  (testing "escaped pipes and code spans do not split table cells"
    (let [{:keys [header groups col_groups]}
          (markdown-table
           "|Column A|Column B|
|---|---|
|Row 1|Some text|
|Row 2, \\||Pipe character with escape \\||
|Row 3, `|`|Pipe character between `|`|")]
      (is (= [[["Plain" "Column A"]]
              [["Plain" "Column B"]]]
             header))
      (is (= [[[[["Plain" "Row 1"]]
                [["Plain" "Some text"]]]
               [[["Plain" "Row 2, |"]]
                [["Plain" "Pipe character with escape |"]]]
               [[["Plain" "Row 3, "]
                 ["Code" "|"]]
                [["Plain" "Pipe character between "]
                 ["Code" "|"]]]]]
             groups))
      (is (= [2] col_groups))))

  (testing "header cells can contain escaped pipes and code-span pipes"
    (let [{:keys [header groups col_groups]}
          (markdown-table
           "|Label \\||Code `a | b`|
|---|---|
|left \\| right|`x | y`|")]
      (is (= [[[["Plain" "Label |"]]
               [["Plain" "Code "]
                ["Code" "a | b"]]]
              [[[[["Plain" "left | right"]]
                 [["Code" "x | y"]]]]]
              [2]]
             [header groups col_groups]))))

  (testing "separator rows still split table body groups"
    (let [{:keys [header groups col_groups]}
          (markdown-table
           "|A|B|
|---|---|
|one \\| two|`three | four`|
|---|---|
|five|six \\||")]
      (is (= [[[["Plain" "A"]]
               [["Plain" "B"]]]
              [[[[["Plain" "one | two"]]
                 [["Code" "three | four"]]]]
               [[[["Plain" "five"]]
                 [["Plain" "six |"]]]]]
              [2]]
             [header groups col_groups]))))

  (testing "ordinary markdown tables keep mldoc's original AST"
    (let [{:keys [header groups col_groups]}
          (markdown-table
           "|A|B|
|---|---|
|---|---|
|1|2|")]
      (is (= [[[["Plain" "A"]]
               [["Plain" "B"]]]
              [[], [[[["Plain" "1"]]
                     [["Plain" "2"]]]]]
              []]
             [header groups col_groups]))))

  (testing "non-markdown configs are not normalized"
    (let [ast [[["Table" {:header [[["Plain" "A"]]
                                    [["Plain" "B"]]]
                          :groups []
                          :col_groups [1 1]}]
                {:start_pos 0 :end_pos 14}]]]
      (is (= ast
             (normalize-markdown-table-asts
              ast
              "|A \\||`B | C`|"
              (gp-mldoc/default-config :org))))))

  (testing "fallback table column groups are preserved"
    (let [ast [[["Table" {:header [[["Plain" "A"]]
                                    [["Plain" "B"]]]
                          :groups []
                          :col_groups [1 1]}]
                {:start_pos 0 :end_pos 14}]]
          [[[_ table] _pos-meta]]
          (normalize-markdown-table-asts
           ast
           "|A \\||`B | C`|"
           md-config)]
      (is (= [1 1] (:col_groups table)))))

  (testing "unclosed code spans do not hide cell boundaries"
    (let [{:keys [header groups col_groups]}
          (markdown-table
           "|A|B|C|
|---|---|---|
|`foo | bar | baz \\||")]
      (is (= [[[["Plain" "A"]]
               [["Plain" "B"]]
               [["Plain" "C"]]]
              [[[[["Plain" "`foo"]]
                 [["Plain" "bar"]]
                 [["Plain" "baz |"]]]]]
              [3]]
             [header groups col_groups])))))

(defn- parse-properties
  [text]
  (->> (gp-mldoc/->edn text (gp-mldoc/default-config :org))
       (filter #(= "Properties" (ffirst %)))
       ffirst
       second))

(deftest org-properties-test
  (testing "just title"
    (let [content "#+TITLE:   some title   "
          props (parse-properties content)]
      (is (= "some title   " (second (first props))))))

  (testing "filetags"
    (let [content "#+FILETAGS:   :tag1:tag2:@tag:
#+TAGS: tag3
body"
          props (parse-properties content)]
      (is ["@tag" "tag1" "tag2"] (sort (:filetags props)))
      (is ["@tag" "tag1" "tag2" "tag3"] (sort (:tags props))))))

(deftest remove-indentation-spaces
  (testing "Remove indentations for every line"
    (is (=  "block 1.1\n  line 1\n    line 2\nline 3\nline 4"
            (let [s "block 1.1
    line 1
      line 2
 line 3
line 4"]
              (gp-mldoc/remove-indentation-spaces s 2 false))))
    (is (=  "\t- block 1.1\n  line 1\n    line 2\nline 3\nline 4"
            (let [s "\t- block 1.1
\t    line 1
\t      line 2
\t line 3
\tline 4"]
              (gp-mldoc/remove-indentation-spaces s 3 false))))))
