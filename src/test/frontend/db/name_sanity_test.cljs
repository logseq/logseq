(ns frontend.db.name-sanity-test
  (:require [cljs.test :refer [deftest testing is]]
            [clojure.string :as string]
            [frontend.common.file.util :as wfu]
            [frontend.util.fs :as fs-util]
            [logseq.graph-parser.extract :as extract]))

(defn- test-page-name
  "Check if page name can be preserved after escaping"
  [page-name]
  (testing (str "Test sanitization page-name: " page-name)
    (let [file-name   (#'wfu/tri-lb-file-name-sanity page-name)
          page-name'  (#'extract/tri-lb-title-parsing file-name)
          url-single  (js/encodeURIComponent file-name)
          url-double  (js/encodeURIComponent url-single)
          file-name'  (js/decodeURIComponent url-single)
          file-name'' (js/decodeURIComponent (js/decodeURIComponent url-double))]
      (is (= page-name page-name'))
      (is (not (fs-util/include-reserved-chars? file-name)))
      (is (not (contains? fs-util/windows-reserved-filebodies file-name)))
      (is (not (string/ends-with? file-name ".")))
      (is (= file-name' file-name))
      (is (= file-name'' file-name)))))

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
  (test-page-name "__ont.?__byte/#__0xbbcont_ cont%/_ lsdksdf__")
  (test-page-name "__ont.?__byte/#_&amp;ont_ cont%/_ lsdksdf__")
  (test-page-name "__ont.?__byte&lowbar;/#_&amp;ont_ cont%/_ lsdksdf__")
  (test-page-name "dsa&amp&semi;l dsalfjk jkl")
  (test-page-name "dsa&amp&semi;l dsalfjk jkl.")
  (test-page-name "hls__&amp&semi;l dsalfjk jkl.")
  (test-page-name "CON.")
  (test-page-name ".NET.")
  (mapv test-page-name fs-util/windows-reserved-filebodies))
