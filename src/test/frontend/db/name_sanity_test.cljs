(ns frontend.db.name-sanity-test
  (:require [cljs.test :refer [deftest testing is use-fixtures]]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :as conversion-handler]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [frontend.test.fixtures :as fixtures]))

(use-fixtures :each fixtures/reset-db)

(def all-reserved-chars (str fs-util/windows-reserved-chars
                             fs-util/android-reserved-chars
                             fs-util/other-reserved-chars))

(defn- test-page-name
  "Check if page name can be preserved after "
  [page-name]
  (testing (str "Test sanitization page-name: " page-name)
    (let [file-name   (fs-util/file-name-sanity page-name)
          page-name'  (gp-util/title-parsing file-name)
          url-single  (js/encodeURIComponent file-name)
          url-double  (js/encodeURIComponent url-single)
          file-name'  (js/decodeURIComponent url-single)
          file-name'' ( js/decodeURIComponent (js/decodeURIComponent url-double))]
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
  (test-page-name "CON.")
  (map test-page-name fs-util/windows-reserved-filebodies))

(defn- test-parsing
  [file-name]
  (testing (str "Test parsing file-name: " file-name)
    (is (string? (gp-util/title-parsing file-name)))))

;; Stuffs should be parsable (don't crash) when users dump some random files
(deftest page-name-parsing-tests
  (test-parsing "___-_-_-_---___----")
  (test-parsing "_____///____---___----")
  (test-parsing "/_/////---/_----")
  (test-parsing "/\\#*%lasdf\\//__--dsll_____----....-._0x2B")
  (test-parsing "/\\#*%l;;&&;&\\//__--dsll_____----....-._0x2B")
  (test-parsing all-reserved-chars)
  (test-parsing "dsa&amp&semi;l dsalfjk jkl"))

(deftest uri-decoding-tests
  (is (= (gp-util/safe-url-decode "%*-sd%%%saf%=lks") "%*-sd%%%saf%=lks")) ;; Contains %, but invalid
  (is (= (gp-util/safe-url-decode "%2FDownloads%2FCNN%3AIs%5CAll%3AYou%20Need.pdf") "/Downloads/CNN:Is\\All:You Need.pdf"))
  (is (= (gp-util/safe-url-decode "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla") "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla")))

(deftest page-name-sanitization-backward-tests
  (is (= "abc.def.ghi.jkl" (gp-util/title-parsing "abc.def.ghi.jkl")))
  (is (= "abc/def/ghi/jkl" (gp-util/title-parsing "abc%2Fdef%2Fghi%2Fjkl")))
  (is (= "abc%/def/ghi/jkl" (gp-util/title-parsing "abc%25%2Fdef%2Fghi%2Fjkl")))
  (is (= "abc%2——ef/ghi/jkl" (gp-util/title-parsing "abc%2——ef%2Fghi%2Fjkl")))
  (is (= "abc&amp;2Fghi/jkl" (gp-util/title-parsing "abc&amp;2Fghi%2Fjkl")))
  (is (= "abc&lt;2Fghi/jkl" (gp-util/title-parsing "abc&lt;2Fghi%2Fjkl")))
  (is (= "abc&percnt;2Fghi/jkl" (gp-util/title-parsing "abc&percnt;2Fghi%2Fjkl")))
  (is (= "abc&semi;&;2Fghi/jkl" (gp-util/title-parsing "abc&semi;&;2Fghi%2Fjkl")))
  (is (= all-reserved-chars (gp-util/title-parsing all-reserved-chars))))

(deftest new-path-computation-tests
  (is (= (#'page-handler/compute-new-file-path "/data/app/dsal dsalfjk aldsaf.jkl" "ddd") "/data/app/ddd.jkl"))
  (is (= (#'page-handler/compute-new-file-path "c://data/a sdfpp/dsal dsalf% * _ dsaf.mnk" "c d / f") "c://data/a sdfpp/c d / f.mnk")))

(deftest path-utils-tests
  (is (= "asldk lakls " (gp-util/path->file-body "/data/app/asldk lakls .lsad")))
  (is (= "asldk lakls " (gp-util/path->file-body "asldk lakls .lsad")))
  (is (= "asldk lakls" (gp-util/path->file-body "asldk lakls")))
  (is (= "asldk lakls" (gp-util/path->file-body "/data/app/asldk lakls")))
  (is (= "lsad" (gp-util/path->file-ext "asldk lakls .lsad"))))

(deftest break-change-conversion-tests
  (let [conv-legacy #(#'conversion-handler/calc-previous-name % nil conversion-handler/legacy-title-parsing)]
    (is (= "dsal dsalfjk aldsaf__jkl" (conv-legacy "dsal dsalfjk aldsaf.jkl")))
    (is (= nil (conv-legacy "dsal dsalfjk jkl")))
    (is (= nil (conv-legacy "dsa&amp;l dsalfjk jkl")))
    (is (= nil (conv-legacy "dsa&lt;l dsalfjk jkl")))
    (is (= nil (conv-legacy "dsal dsal%2Ffjk jkl")))
    (is (= nil (conv-legacy "dsal dsal%2Cfjk jkl")))) ;; %2C already parsed as `,` in the previous ver.
  )

(deftest formalize-conversion-tests
  (let [conv-informal #(#'conversion-handler/calc-current-name % nil)]
    (is (= "sdaf __dsakl" (conv-informal "sdaf %2Fdsakl")))
    (is (= "sdaf __dsakl" (conv-informal "sdaf /dsakl")))
    (is (= nil (conv-informal "sdaf .dsakl")))))

(deftest rename-dir-ver-3-tests
  (is (= "aaa__bbb__ccc" (#'conversion-handler/calc-dir-ver-3-rename-target "aaa.bbb.ccc" "aaa/bbb/ccc")))
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "aa?#.bbb.ccc" "aa__/bbb/ccc")))
  (is (= (fs-util/file-name-sanity "a?#/bbb/ccc") (#'conversion-handler/calc-dir-ver-3-rename-target "a__.bbb.ccc" "a?#/bbb/ccc")))
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "aaa__bbb__ccc" "aaa/bbb/ccc")))
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "aaa__bbb__cccon" "aaa/bbb/cccon")))
  ;; likely to be converted already
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "aaa__bbb__ccc" nil)))
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "aaa_bbb_ccc" nil)))
  ;; manually edited title properties, don't rename
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "aaa.bbb.ccc" "adbcde/aks/sdf")))
  (is (= nil (#'conversion-handler/calc-dir-ver-3-rename-target "a__.bbb.ccc" "adbcde/aks/sdf")))
  (is (= "CON__" (#'conversion-handler/calc-dir-ver-3-rename-target "CON" "CON")))
  (is (= "CON__" (#'conversion-handler/calc-dir-ver-3-rename-target "CON" nil)))
  (is (= "abc.__" (#'conversion-handler/calc-dir-ver-3-rename-target "abc." "abc.")))
  (is (= "abc" (#'conversion-handler/calc-dir-ver-3-rename-target "abc." nil))))
