(ns frontend.parser
  (:require [cljs.test :refer [is deftest]]
            [frontend.format.mldoc :as mldoc :refer [->edn]]))

(def md-config (mldoc/default-config :markdown))

(deftest src-test
  (is (=
       (first (->edn "```
: hello
```" md-config))
       [["Src"
         {:lines [": hello" "\n"],
          :pos_meta {:start_pos 4, :end_pos 12},
          :full_content "```\n: hello\n```"}]
        {:start_pos 0, :end_pos 15}])))

(deftest name-definition-test
  (is (=
       (first (->edn "term
: definition" md-config))
       [["List"
         [{:content [["Paragraph" [["Plain" "definition"]]]],
           :items [],
           :name [["Plain" "term"]],
           :indent 0,
           :ordered false}]]
        {:start_pos 0, :end_pos 17}])))
