(ns frontend.db.name-sanity-test
  (:require [cljs.test :refer [deftest testing is are]]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :as conversion-handler]
            [frontend.util.fs :as fs-util]))

(defn- test-page-name
  "Check if page name can be preserved after escaping"
  [page-name]
  (testing (str "Test sanitization page-name: " page-name)
    (let [file-name   (#'fs-util/tri-lb-file-name-sanity page-name)
          page-name'  (#'gp-util/tri-lb-title-parsing file-name)
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

(deftest ^:focus page-name-sanitization-tests
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
  (mapv test-page-name fs-util/windows-reserved-filebodies))

(deftest new-path-computation-tests
  (is (= (#'page-handler/compute-new-file-path "/data/app/dsal dsalfjk aldsaf.jkl" "ddd") "/data/app/ddd.jkl"))
  (is (= (#'page-handler/compute-new-file-path "c://data/a sdfpp/dsal dsalf% * _ dsaf.mnk" "c d / f") "c://data/a sdfpp/c d / f.mnk")))

(deftest break-change-conversion-tests
  (let [conv-legacy #(:target (#'conversion-handler/calc-previous-name :legacy :triple-lowbar %))]
    (is (= "dsal dsalfjk aldsaf___jkl" (conv-legacy "dsal dsalfjk aldsaf.jkl")))
    (is (= nil (conv-legacy "dsal dsalfjk jkl")))
    (is (= nil (conv-legacy "dsa&amp;l dsalfjk jkl")))
    (is (= nil (conv-legacy "dsa&lt;l dsalfjk jkl")))
    (is (= nil (conv-legacy "dsal dsal%2Ffjk jkl")))
    (is (= nil (conv-legacy "dsal dsal%2Cfjk jkl")))) ;; %2C already parsed as `,` in the previous ver.
  )

(deftest formalize-conversion-tests
  (let [conv-informal #(:target (#'conversion-handler/calc-current-name :triple-lowbar % nil))]
    (is (= "sdaf ___dsakl" (conv-informal "sdaf %2Fdsakl")))
    (is (= "sdaf ___dsakl" (conv-informal "sdaf /dsakl")))
    (is (= nil (conv-informal "sdaf .dsakl")))))

(deftest manual-title-prop-test
  (are [x y z] (= z (#'conversion-handler/is-manual-title-prop? :legacy x y))
    "aaa.bbb.ccc" "aaa/bbb/ccc"   false
    "aa__.bbb.ccc" "aa?#/bbb/ccc" false
    "aa?#.bbb.ccc" "aa__/bbb/ccc" true
    "aaa__bbb__ccc" "aaa/bbb/ccc" true
    "aaa__bbb__cccon" "aaa/bbb/cccon"  true
    "aaa.bbb.ccc"     "adbcde/aks/sdf" true
    "a__.bbb.ccc"     "adbcde/aks/sdf" true
    ))

(deftest rename-previous-tests
  (are [x y] (= y (#'conversion-handler/calc-previous-name :legacy :triple-lowbar x))
    "aa?#.bbb.ccc"   {:status :breaking,
                      :target "aa%3F%23___bbb___ccc",
                      :old-title "aa?#/bbb/ccc",
                      :changed-title "aa?#.bbb.ccc"}
    "aaa__bbb__ccc"  nil
    "aaa__bbb__cccon" nil
    "aaa.bbb.ccc"    {:status :breaking,
                      :target "aaa___bbb___ccc",
                      :old-title "aaa/bbb/ccc",
                      :changed-title "aaa.bbb.ccc"}
    "a__.bbb.ccc"    {:status :breaking,
                      :target "a_%5F___bbb___ccc",
                      :old-title "a__/bbb/ccc",
                      :changed-title "a__.bbb.ccc"})
  ;; is not a common used case
  (are [x y] (= y (#'conversion-handler/calc-previous-name :triple-lowbar :legacy x))
    "aa%3F%23.bbb.ccc" {:status :unreachable,
                        :target "aa%3F%23.bbb.ccc",
                        :old-title "aa?#.bbb.ccc",
                        :changed-title "aa?#/bbb/ccc"}))

(deftest rename-tests
  ;; z: new title structure; x: old ver title; y: title property (if available)
  (are [x y z] (= z (#'conversion-handler/calc-rename-target-impl :legacy :triple-lowbar x y))
    "aaa.bbb.ccc" "aaa/bbb/ccc"   {:status :informal,
                                   :target "aaa___bbb___ccc",
                                   :old-title "aaa/bbb/ccc",
                                   :changed-title "aaa/bbb/ccc"}
    "aaa.bbb.ccc" nil             {:status :breaking,
                                   :target "aaa___bbb___ccc",
                                   :old-title "aaa/bbb/ccc",
                                   :changed-title "aaa.bbb.ccc"}
    "aa__.bbb.ccc" "aa?#/bbb/ccc" {:status :informal,
                                   :target "aa%3F%23___bbb___ccc",
                                   :old-title "aa?#/bbb/ccc",
                                   :changed-title "aa?#/bbb/ccc"}
    "aa?#.bbb.ccc" "aa__/bbb/ccc" nil
    "aaa__bbb__ccc" "aaa/bbb/ccc" nil
    "aaa__bbb__cccon" "aaa/bbb/cccon" nil
    "aaa__bbb__ccc" nil               nil
    "aaa_bbb_ccc"   nil               nil
    "aaa.bbb.ccc"   "adbcde/aks/sdf"  nil
    "a__.bbb.ccc"   "adbcde/aks/sdf"  nil
    "CON" "CON" {:status :informal,
                 :target "CON___",
                 :old-title "CON",
                 :changed-title "CON"}
    "CON" nil   {:status :informal,
                 :target "CON___",
                 :old-title "CON",
                 :changed-title "CON"}
    "abc." "abc." {:status :informal,
                   :target "abc.___",
                   :old-title "abc.",
                   :changed-title "abc."}
    "abc." nil    {:status :breaking,
                   :target "abc", ;; abc/ is an invalid file name
                   :old-title "abc/",
                   :changed-title "abc."}))
