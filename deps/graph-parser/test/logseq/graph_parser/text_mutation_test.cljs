(ns logseq.graph-parser.text-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]))

(defn- refs-of [s]
  (text/extract-refs-from-mldoc-ast (gp-mldoc/inline->edn s (gp-mldoc/default-config :markdown))))

;; Fails if, in `get-ref-from-ast`, `first` becomes `last`.
(deftest extract-refs-from-tag-with-several-parts-test
  ;; mldoc parses `#foo[[bar]]` as one Tag of [Plain "foo", Link bar]
  (is (= #{"foo"} (refs-of "#foo[[bar]]"))
      "a tag starting with plain text refers to that text")
  ;; and `#[[foo]]bar` as one Tag of [Link foo, Plain "bar"]
  (is (= #{"foo"} (refs-of "#[[foo]]bar"))
      "a tag starting with a page ref refers to that page"))
