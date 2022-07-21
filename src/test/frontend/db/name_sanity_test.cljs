(ns frontend.db.name-sanity-test
  (:require [cljs.test :refer [deftest testing is use-fixtures]]
            [logseq.graph-parser.util :as gp-util]
            [frontend.util :as util]
            [frontend.test.fixtures :as fixtures]))

(use-fixtures :each fixtures/reset-db)

(defn- test-page-name
  [page-name]
  (testing (str "Test sanitization page-name: " page-name)
    (let [file-name   (gp-util/file-name-sanity page-name)
          page-name'  (gp-util/page-name-parsing file-name)
          url-single  (js/encodeURIComponent file-name)
          url-double  (js/encodeURIComponent url-single)
          file-name'  (js/decodeURIComponent url-single)
          file-name'' (-> url-double
                          js/decodeURIComponent
                          js/decodeURIComponent)]
      (is (= page-name page-name'))
      (is (not (util/include-reserved-chars? file-name)))
      (is (= file-name' file-name))
      (is (= file-name'' file-name)))))

(defn- test-parsing
  [file-name]
  (testing (str "Test parsing file-name: " file-name)
    (is (string? (gp-util/page-name-parsing file-name)))))

(deftest page-name-sanitization-tests
  (test-page-name "Some.Content!")
  (test-page-name "More _/_ Con tents")
  (test-page-name "More _________/________ Con tents")
  (test-page-name "More _________/___-_-_-_---___----__/_ Con tents")
  (test-page-name "Cont./__cont_ cont/ lsdksdf")
  (test-page-name "Cont.?/#__cont_ cont%/_ lsdksdf")
  (test-page-name "Cont.?__byte/#__cont_ cont%/_ lsdksdf")
  (test-page-name "__ont.?__byte/#__cont_ cont%/_ lsdksdf")
  (test-page-name "______ont.?__byte/#__cont_ cont%/_ lsdksdf")
  (test-page-name "__ont.?__byte/#__cont_ cont%/_ lsdksdf__")
  (test-page-name "+*++***+++__byte/#__cont_ cont%/_ lsdksdf__")
  (test-page-name "+*++_.x2A_.x2A***+++__byte/#__cont_ cont%/_ lsdksdf__")
  (test-page-name "__ont.?__byte/#__0xbbcont_ cont%/_ lsdksdf__"))

;; Stuffs should be parsable (don't crash) when users dump some random files
(deftest page-name-parsing-tests
  (test-parsing "___-_-_-_---___----")
  (test-parsing "_____///____---___----")
  (test-parsing "/_/////---/_----")
  (test-parsing "/\\#*%lasdf\\//__--dsll_____----....-._0x2B")
  (test-parsing (str gp-util/windows-reserved-chars
                     gp-util/android-reserved-chars 
                     gp-util/other-reserved-chars)))

(deftest uri-decoding-tests
  (is (gp-util/safe-url-decode "%*-sd%%%saf%=lks") "%*-sd%%%saf%=lks") ;; Contains %, but invalid
  (is (gp-util/safe-url-decode "%2FDownloads%2FCNN%3AIs%5CAll%3AYou%20Need.pdf") "/Downloads/CNN:Is\\All:You Need.pdf")
  (is (gp-util/safe-url-decode "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla") "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla"))
