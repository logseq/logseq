(ns frontend.extensions.pdf.assets-test
  (:require [clojure.test :as test :refer [are deftest testing]]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.util :as util]
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

(deftest inflate-asset-normalizes-local-assets-url-on-windows
  (with-redefs [util/electron? (constantly true)
                util/win32? true]
    (test/is (= "assets:///C/logseq__colon/Users/charlie/sicp.pdf"
                (:url (pdf-assets/inflate-asset
                       "C:/Users/charlie/sicp.pdf"
                       {:href "assets:///C:/Users/charlie/sicp.pdf"}))))))
