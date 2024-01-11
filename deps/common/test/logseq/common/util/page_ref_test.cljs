(ns logseq.common.util.page-ref-test
  (:require [logseq.common.util.page-ref :as page-ref]
            [cljs.test :refer [are deftest]]))

(deftest page-ref?
  (are [x y] (= (page-ref/page-ref? x) y)
       "[[page]]" true
       "[[another page]]" true
       "[[some [[nested]] page]]" true
       "[single bracket]" false
       "no brackets" false))
