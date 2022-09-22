(ns frontend.extensions.pdf.assets-test
  (:require [clojure.test :as test :refer [are deftest testing]]
            [frontend.extensions.pdf.assets :as assets]))

(deftest fix-local-asset-pagename
  (testing "matched filenames"
    (are [x y] (= y (assets/fix-local-asset-pagename x))
      "2015_Book_Intertwingled_1659920114630_0" "2015 Book Intertwingled"
      "hls__2015_Book_Intertwingled_1659920114630_0" "📒2015 Book Intertwingled"
      "hls/2015_Book_Intertwingled_1659920114630_0" "hls/2015 Book Intertwingled"))
  (testing "non matched filenames"
    (are [x y] (= y (assets/fix-local-asset-pagename x))
      "foo" "foo"
      "foo_bar" "foo_bar"
      "foo__bar" "foo__bar"
      "foo_bar.pdf" "foo_bar.pdf")))
