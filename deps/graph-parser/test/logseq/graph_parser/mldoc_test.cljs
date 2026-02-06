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