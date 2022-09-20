(ns frontend.db.name-sanity-test
  (:require [cljs.test :refer [deftest testing is]]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :as conversion-handler]
            [frontend.util.fs :as fs-util]))

(defn- test-page-name
  "Check if page name can be preserved after escaping"
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
  (mapv test-page-name fs-util/windows-reserved-filebodies))

(deftest new-path-computation-tests
  (is (= (#'page-handler/compute-new-file-path "/data/app/dsal dsalfjk aldsaf.jkl" "ddd") "/data/app/ddd.jkl"))
  (is (= (#'page-handler/compute-new-file-path "c://data/a sdfpp/dsal dsalf% * _ dsaf.mnk" "c d / f") "c://data/a sdfpp/c d / f.mnk")))

(deftest break-change-conversion-tests
  (let [conv-legacy #(#'conversion-handler/calc-previous-name % nil gp-util/legacy-title-parsing)]
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
  ;; windows reserved file names, rename
  (is (= "CON__" (#'conversion-handler/calc-dir-ver-3-rename-target "CON" "CON")))
  (is (= "CON__" (#'conversion-handler/calc-dir-ver-3-rename-target "CON" nil)))
  (is (= "abc.__" (#'conversion-handler/calc-dir-ver-3-rename-target "abc." "abc.")))
  (is (= "abc" (#'conversion-handler/calc-dir-ver-3-rename-target "abc." nil))) ;; shown as `abc` in the previous ver.
  )
