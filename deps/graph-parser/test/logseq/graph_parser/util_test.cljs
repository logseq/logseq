(ns logseq.graph-parser.util-test
  (:require [clojure.test :refer [deftest are]]
            [logseq.graph-parser.util :as gp-util]))

(deftest valid-edn-keyword?
  (are [x y]
       (= (gp-util/valid-edn-keyword? x) y)

       ":foo-bar"  true
       ":foo!"     true
       ":foo,bar"  false
       "4"         false
       "foo bar"   false
       "`property" false))
