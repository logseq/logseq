(ns frontend.extensions.pdf.assets-test
  (:require [clojure.test :as test :refer [are deftest testing]]
            [frontend.extensions.pdf.utils :as pdf-utils]))

(deftest fix-local-asset-pagename
  (testing "matched filenames"
    (are [x y] (= y (pdf-utils/fix-local-asset-pagename x))
      "2015_Book_Intertwingled_1659920114630_0" "2015 Book Intertwingled"
      "hls__2015_Book_Intertwingled_1659920114630_0" "2015 Book Intertwingled"
      "hls/2015_Book_Intertwingled_1659920114630_0" "hls/2015 Book Intertwingled"
      "hls__sicp__-1234567" "sicp"))
  (testing "non matched filenames"
    (are [x y] (= y (pdf-utils/fix-local-asset-pagename x))
      "foo" "foo"
      "foo_bar" "foo_bar"
      "foo__bar" "foo__bar"
      "foo_bar.pdf" "foo_bar.pdf")))

(deftest encode-pdf-asset-url
  (testing "matched filenames"
    (are [x y] (= y (pdf-utils/encode-pdf-asset-url x))
      "file:///Library/assets/lorem-ipsum_#2_1680047312801_0.pdf"
      "file:///Library/assets/lorem-ipsum_%232_1680047312801_0.pdf"

      "file:///人民邮电出版社 #2/assets/Lorem_%E7%AC%AC2%E7%89%88_=_#3_&4_?5_1680045214560_0.pdf#page=2&zoom=200"
      "file:///人民邮电出版社 %232/assets/Lorem_%E7%AC%AC2%E7%89%88_%3D_%233_%264_%3F5_1680045214560_0.pdf#page=2&zoom=200"))
  (testing "non matched filenames"
    (are [x] (= x (pdf-utils/encode-pdf-asset-url x))
      "file:///Library/assets/lorem-ipsum_1680044789755_0.pdf"
      "file:///Library/assets/Lorem_%E7%AC%AC2%E7%89%88_1680044796030_0.pdf"
      "file:///人民邮电出版社/assets/Lorem_%E7%AC%AC2%E7%89%88_1680044796030_0.pdf#page=2&zoom=200")))
