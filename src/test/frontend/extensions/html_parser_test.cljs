(ns frontend.extensions.html-parser-test
  #_(:require [clojure.test :as test :refer [deftest testing are]]
              [frontend.extensions.html-parser :as parser])
  )

;; Disabled temporally because document is not supported on Node
;; and jsdom can't be required

#_(deftest convert-test
  (testing "markdown"
    (are [x y] (= (parser/convert :markdown x) y)
      "<ul><li>a</li><ul><li>b</li></ul></ul>"
      "- a\n\n\t- b"

      "<ul><li>a</li><li>b</li></ul>"
      "- a\n- b"

      "<ul><li>a</li><li>b</li><ol><li>c</li><dl>d</dl></ol></ul>"
      "- a\n- b\n\n\t- c\n\n\t\t- d"

      "<b>bold</b> <i>italic</i> <mark>mark</mark>"
      "**bold** *italic* ==mark=="))

  (testing "org mode"
    (are [x y] (= (parser/convert :org x) y)
      "<ul><li>a</li><ul><li>b</li></ul></ul>"
      "* a\n\n\t* b"

      "<ul><li>a</li><li>b</li></ul>"
      "* a\n* b"

      "<ul><li>a</li><li>b</li><ol><li>c</li><dl>d</dl></ol></ul>"
      "* a\n* b\n\n\t* c\n\nd"

      "<b>bold</b> <i>italic</i> <mark>mark</mark>"
      "*bold* /italic/ ^^mark^^")))
