(ns logseq.graph-parser.property-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.graph-parser.property :as gp-property]))

(deftest remove-properties-keeps-body-after-drawer-test
  (is (= "** hello\nbody text\nmore"
         (gp-property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\nbody text\nmore"))))

(deftest remove-properties-with-end-before-drawer-start-test
  ;; The :END: line comes before :PROPERTIES:, so no line after the drawer
  ;; start closes it: the body is empty and only the title lines remain.
  (is (= "hello\n:END:"
         (gp-property/remove-properties :org "hello\n:END:\n:PROPERTIES:\n:x: y"))))
