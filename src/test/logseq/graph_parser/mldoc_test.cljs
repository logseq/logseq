(ns logseq.graph-parser.mldoc-test
  (:require [logseq.graph-parser.mldoc :as gp-mldoc]
            ["fs" :as fs]
            ["child_process" :as child-process]
            [clojure.string :as string]
            [frontend.test.docs-graph-helper :as docs-graph-helper]
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

(deftest ^:integration test->edn
  (let [graph-dir "src/test/docs"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir)
        files (docs-graph-helper/build-graph-files graph-dir)
        asts-by-file (->> files
                          (map (fn [{:file/keys [path content]}]
                                 (let [format (if (string/ends-with? path ".org")
                                                :org :markdown)]
                                   [path
                                    (gp-mldoc/->edn content
                                                    (gp-mldoc/default-config format)
                                                    {})])))
                          (into {}))]
    (is (= {"CommentBlock" 1,
            "Custom" 41,
            "Displayed_Math" 1,
            "Drawer" 1,
            "Example" 20,
            "Footnote_Definition" 2,
            "Heading" 3493,
            "Hiccup" 15,
            "List" 36,
            "Paragraph" 411,
            "Properties" 104,
            "Property_Drawer" 188,
            "Quote" 9,
            "Raw_Html" 12,
            "Src" 56,
            "Table" 4}
           (->> asts-by-file (mapcat val) (map ffirst) frequencies))
        "AST node type counts")

    ; (println :DIFF)
    ; (prn (butlast (clojure.data/diff (edn/read-string (slurp "mldoc-asts.edn"))
    ;                                  asts-by-file)))
    ;; This is just temporary
    #_(is (= (clojure.edn/read-string (slurp "mldoc-asts.edn"))
             asts-by-file)
          "Matches initial AST")
    #_(println "Wrote asts for" (count asts-by-file) "files")
    #_(fs/writeFileSync "mldoc-asts.edn" (pr-str asts-by-file))))

(def md-config (gp-mldoc/default-config :markdown))

(deftest src-test
  (is (= [["Src"
           {:lines [": hello" "\n"],
            :pos_meta {:start_pos 4, :end_pos 12},
            :full_content "```\n: hello\n```"}]
          {:start_pos 0, :end_pos 15}]
         (first (gp-mldoc/->edn "```
: hello
```" md-config {})))))

(deftest name-definition-test
  (is (= [["List"
           [{:content [["Paragraph" [["Plain" "definition"]]]],
             :items [],
             :name [["Plain" "term"]],
             :indent 0,
             :ordered false}]]
          {:start_pos 0, :end_pos 17}]
         (first (gp-mldoc/->edn "term
: definition" md-config {})))))
