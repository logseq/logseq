(ns logseq.graph-parser.mldoc-test
  (:require [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]
            [clojure.string :as string]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [logseq.graph-parser.cli :as gp-cli]
            [cljs.test :refer [testing deftest are is]]))

(deftest test-link
  (testing "non-link"
    (are [x y] (= (gp-mldoc/link? :markdown x) y)
      "google.com" false))

  (testing "plain links"
    (are [x y] (= (gp-mldoc/link? :markdown x) y)
      "http://www.google.com" true
      "http://google.com" true))

  (testing "org links with labels"
    (are [x y] (= (gp-mldoc/link? :org x) y)
      "[[http://www.google.com][google]]" true
      "[[http://google.com][google]]" true
      "[[https://www.google.com][google]]" true
      "[[https://google.com][google]]" true))

  (testing "org links without labels"
    (are [x y] (= (gp-mldoc/link? :org x) y)
      "[[http://www.google.com]]" true
      "[[https://www.google.com]]" true
      "[[draws/2022-03-06-15-00-28.excalidraw]]" true
      "[[assets/2022-03-06-15-00-28.pdf]]" true))

  (testing "markdown links"
    (are [x y] (= (gp-mldoc/link? :markdown x) y)
      "[google](http://www.google.com)" true
      "[google](https://www.google.com)" true
      "[[draws/2022-03-06-15-00-28.excalidraw]]" true
      "![a pdf](assets/2022-03-06-15-00-28.pdf)" true))

  ;; https://github.com/logseq/logseq/issues/4308
  (testing "parsing links should be finished"
    (are [x y] (= (gp-mldoc/link? :markdown x) y)
      "[YouTube](https://www.youtube.com/watch?v=-8ym7pyUs9gL) - [Vimeo](https://vimeo.com/677920303) {{youtube https://www.youtube.com/watch?v=-8ym7pyUs9g}}" true)))

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

(deftest ^:integration test->edn
  (let [graph-dir "test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.6.7")
        files (gp-cli/build-graph-files graph-dir)
        asts-by-file (->> files
                          (map (fn [{:file/keys [path content]}]
                                 (let [format (if (string/ends-with? path ".org")
                                                :org :markdown)]
                                   [path
                                    (gp-mldoc/->edn content
                                                    (gp-mldoc/default-config format))])))
                          (into {}))]
    (is (= {"CommentBlock" 1,
            "Custom" 41,
            "Displayed_Math" 1,
            "Drawer" 1,
            "Example" 20,
            "Footnote_Definition" 2,
            "Heading" 3496,
            "Hiccup" 15,
            "List" 37,
            "Paragraph" 417,
            "Properties" 91,
            "Property_Drawer" 201,
            "Quote" 9,
            "Raw_Html" 12,
            "Src" 56,
            "Table" 4}
           (->> asts-by-file (mapcat val) (map ffirst) frequencies))
        "AST node type counts")))
