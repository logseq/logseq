(ns logseq.cli.text-util-test
  (:require [cljs.test :refer [are deftest]]
            [logseq.cli.text-util :as cli-text-util]))

(deftest test-cut-by
  (are [x y] (= x y)
    ["" "" ""]
    (cli-text-util/cut-by "[[]]" "[[" "]]")

    ["" "abc" ""]
    (cli-text-util/cut-by "[[abc]]" "[[" "]]")

    ["012 " "6" " [[2]]"]
    (cli-text-util/cut-by "012 [[6]] [[2]]" "[[" "]]")

    ["" "prop" "value"]
    (cli-text-util/cut-by "prop::value" "" "::")

    ["prop" "" "value"]
    (cli-text-util/cut-by "prop::value" "::" "")

    ["some " "content" " here"]
    (cli-text-util/cut-by "some $pfts>$content$pfts<$ here" "$pfts>$" "$pfts<$")

    ["some " "content$pft" nil]
    (cli-text-util/cut-by "some $pfts>$content$pft" "$pfts>$" "$pfts<$")

    ["some $pf" nil nil]
    (cli-text-util/cut-by "some $pf" "$pfts>$" "$pfts<$")

    ["" "content" ""]
    (cli-text-util/cut-by "$pfts>$content$pfts<$" "$pfts>$" "$pfts<$")

    ["" "content$p" nil]
    (cli-text-util/cut-by "$pfts>$content$p" "$pfts>$" "$pfts<$")))
