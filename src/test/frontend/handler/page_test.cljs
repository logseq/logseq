(ns frontend.handler.page-test
  ;; namespace local config for private function tests
  {:clj-kondo/config {:linters {:private-call {:level :off}}}}
  (:require [cljs.test :refer [deftest is are testing use-fixtures]]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.mobile.util :as mobile-util]
            [frontend.handler.page :as page-handler]
            [frontend.test.helper :as test-helper]))

(defn- replace-page-ref!
  [content old-name new-name]
  (let [[original-old-name original-new-name] (map string/trim [old-name new-name])
        [old-ref new-ref] (map #(util/format "[[%s]]" %) [old-name new-name])
        [old-name new-name] (map #(if (string/includes? % "/")
                                    (string/replace % "/" ".")
                                    %)
                                 [original-old-name original-new-name])
        old-org-ref (re-find
                     (re-pattern
                      (util/format
                       "\\[\\[file:\\.*/.*%s\\.org\\]\\[(.*?)\\]\\]" old-name))
                     content)]
    (-> (if old-org-ref
          (let [[old-full-ref old-label] old-org-ref
                new-label (if (= old-label original-old-name)
                            original-new-name
                            old-label)
                new-full-ref (-> (string/replace old-full-ref old-name new-name)
                                 (string/replace (str "[" old-label "]")
                                                 (str "[" new-label "]")))]
            (string/replace content old-full-ref new-full-ref))
          content)
        (string/replace old-ref new-ref))))

(defn- replace-old-page!
  [content old-name new-name]
  (when (and (string? content) (string? old-name) (string? new-name))
    (-> content
        (replace-page-ref! old-name new-name)
        (page-handler/replace-tag-ref! old-name new-name))))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

;; A hacky way of setting :block/page. I'm not sure why it isn't set by default
;; in this test case
(defn- add-block-page
  [block]
  (assoc block :block/page block))

;; Test resolution of files in the journal folder
(defn- test-get-page-ref-text-org-journals
  []
  (testing "Testing resolution of paths from within the journals folder."
    ;; journals/failure.org
    (with-redefs [state/get-edit-block (constantly (add-block-page (db-utils/pull [:block/name "failure"])))]
      ;; check non-existent file resolution (platform-dependent) with space in name
      (is (= "[[file:../pages/test case.org][Test Case]]" (frontend.handler.page/get-page-ref-text "Test Case")))
      ;; check existing file resolution (not platform-dependent)
      (is (= "[[file:../pages/foo.org][foo]]" (frontend.handler.page/get-page-ref-text "foo")))
      ;; check existing file resolution created with absolute path
      (is (= "[[file:/test-db/fooart.org][fooart]]" (frontend.handler.page/get-page-ref-text "fooart")))
      ;; check existing journal file resolution (not platform-dependent)
      (is (= "[[file:./2024-01-16.org][2024-01-16]]" (frontend.handler.page/get-page-ref-text "2024-01-16")))
      ;; check non-existent journal file resolution (platform dependent)
      (is (= "[[file:./2024-01-15.org][2024-01-15]]" (frontend.handler.page/get-page-ref-text "2024-01-15")))
      ;; check existent journal file outside of journal folder
      (is (= "[[file:../2024-01-13.org][2024-01-13]]" (frontend.handler.page/get-page-ref-text "2024-01-13")))
      ;; check existent journal file with absolute path
      (is (= "[[file:/test-db/2024-01-01.org][2024-01-01]]" (frontend.handler.page/get-page-ref-text "2024-01-01")))
      ;; Check resolution of existing file in non-standard location
      (is (= "[[file:../nonstandard/location.org][location]]" (frontend.handler.page/get-page-ref-text "location")))
      ;; Check resolution of existing file at root of graph
      (is (= "[[file:../root.org][root]]" (frontend.handler.page/get-page-ref-text "root")))
      ;;
      )

    ;; journals/2024-01-16.org
    (with-redefs [state/get-edit-block (constantly (add-block-page (db-utils/pull [:block/name "2024-01-16"])))]
      ;; check non-existent file resolution (platform-dependent) with space in name
      (is (= "[[file:../pages/test case.org][Test Case]]" (frontend.handler.page/get-page-ref-text "Test Case")))
      ;; check existing file resolution (not platform-dependent)
      (is (= "[[file:../pages/foo.org][foo]]" (frontend.handler.page/get-page-ref-text "foo")))
      ;; check existing file resolution created with absolute path
      (is (= "[[file:/test-db/fooart.org][fooart]]" (frontend.handler.page/get-page-ref-text "fooart")))
      ;; check existing journal file resolution (not platform-dependent)
      (is (= "[[file:./2024-01-16.org][2024-01-16]]" (frontend.handler.page/get-page-ref-text "2024-01-16")))
      ;; check non-existent journal file resolution (platform dependent)
      (is (= "[[file:./2024-01-15.org][2024-01-15]]" (frontend.handler.page/get-page-ref-text "2024-01-15")))
      ;; check existent journal file outside of journal folder
      (is (= "[[file:../2024-01-13.org][2024-01-13]]" (frontend.handler.page/get-page-ref-text "2024-01-13")))
      ;; check existent journal file with absolute path
      (is (= "[[file:/test-db/2024-01-01.org][2024-01-01]]" (frontend.handler.page/get-page-ref-text "2024-01-01")))
      ;; Check resolution of existing file in non-standard location
      (is (= "[[file:../nonstandard/location.org][location]]" (frontend.handler.page/get-page-ref-text "location")))
      ;; Check resolution of existing file at root of graph
      (is (= "[[file:../root.org][root]]" (frontend.handler.page/get-page-ref-text "root")))
      ;;
      )))

;; Test resolution of files at non-standard locations
(defn- test-get-page-ref-text-org-nonstandard
  []
  (testing "Resolution of files from within non-standard folders."
    ;; root.org
    (with-redefs [state/get-edit-block (constantly (add-block-page (db-utils/pull [:block/name "root"])))]
      ;; check non-existent file resolution (platform-dependent) with space in name
      (is (= "[[file:./pages/test case.org][Test Case]]" (frontend.handler.page/get-page-ref-text "Test Case")))
      ;; check existing file resolution (not platform-dependent)
      (is (= "[[file:./pages/foo.org][foo]]" (frontend.handler.page/get-page-ref-text "foo")))
      ;; check existing file resolution created with absolute path
      (is (= "[[file:/test-db/fooart.org][fooart]]" (frontend.handler.page/get-page-ref-text "fooart")))
      ;; check existing journal file resolution (not platform-dependent)
      (is (= "[[file:./journals/2024-01-16.org][2024-01-16]]" (frontend.handler.page/get-page-ref-text "2024-01-16")))
      ;; check non-existent journal file resolution (platform dependent)
      (is (= "[[file:./journals/2024-01-15.org][2024-01-15]]" (frontend.handler.page/get-page-ref-text "2024-01-15")))
      ;; check existent journal file outside of journal folder
      (is (= "[[file:./2024-01-13.org][2024-01-13]]" (frontend.handler.page/get-page-ref-text "2024-01-13")))
      ;; check existent journal file with absolute path
      (is (= "[[file:/test-db/2024-01-01.org][2024-01-01]]" (frontend.handler.page/get-page-ref-text "2024-01-01")))
      ;; Check resolution of existing file in non-standard location
      (is (= "[[file:./nonstandard/location.org][location]]" (frontend.handler.page/get-page-ref-text "location")))
      ;;
      )

    ;; nonstandard/location.org
    (with-redefs [state/get-edit-block (constantly (add-block-page (db-utils/pull [:block/name "location"])))]
      ;; check non-existent file resolution (platform-dependent) with space in name
      (is (= "[[file:../pages/test case.org][Test Case]]" (frontend.handler.page/get-page-ref-text "Test Case")))
      ;; check existing file resolution (not platform-dependent)
      (is (= "[[file:../pages/foo.org][foo]]" (frontend.handler.page/get-page-ref-text "foo")))
      ;; check existing file resolution created with absolute path
      (is (= "[[file:/test-db/fooart.org][fooart]]" (frontend.handler.page/get-page-ref-text "fooart")))
      ;; check existing journal file resolution (not platform-dependent)
      (is (= "[[file:../journals/2024-01-16.org][2024-01-16]]" (frontend.handler.page/get-page-ref-text "2024-01-16")))
      ;; check non-existent journal file resolution (platform dependent)
      (is (= "[[file:../journals/2024-01-15.org][2024-01-15]]" (frontend.handler.page/get-page-ref-text "2024-01-15")))
      ;; check existent journal file outside of journal folder
      (is (= "[[file:../2024-01-13.org][2024-01-13]]" (frontend.handler.page/get-page-ref-text "2024-01-13")))
      ;; check existent journal file with absolute path
      (is (= "[[file:/test-db/2024-01-01.org][2024-01-01]]" (frontend.handler.page/get-page-ref-text "2024-01-01")))
      ;; Check resolution of existing file at root of graph
      (is (= "[[file:../root.org][root]]" (frontend.handler.page/get-page-ref-text "root")))
      ;;
      )))

;; Test resolution of files in pages folder
(defn- test-get-page-ref-text-org-pages
  []
  (testing "Resolution of files from within the pages/ folder."
 ;; /pages/foo.org
    (with-redefs [state/get-edit-block (constantly (add-block-page (db-utils/pull [:block/name "foo"])))]
      ;; check non-existent file resolutino (platform-dependent) with space in name
      (is (= "[[file:./test case.org][Test Case]]" (frontend.handler.page/get-page-ref-text "Test Case")))
      ;; check existing file resolution created with absolute path
      (is (= "[[file:/test-db/fooart.org][fooart]]" (frontend.handler.page/get-page-ref-text "fooart")))
      ;; check existing file resolution (not platform-dependent) for journal
      (is (= "[[file:../journals/2024-01-16.org][2024-01-16]]" (frontend.handler.page/get-page-ref-text "2024-01-16")))
      ;; check non-existent journal file resolution (platform dependent)
      (is (= "[[file:../journals/2024-01-15.org][2024-01-15]]" (frontend.handler.page/get-page-ref-text "2024-01-15")))
      ;; check existent journal file outside of journal folder
      (is (= "[[file:../2024-01-13.org][2024-01-13]]" (frontend.handler.page/get-page-ref-text "2024-01-13")))
      ;; check existent journal file with absolute path
      (is (= "[[file:/test-db/2024-01-01.org][2024-01-01]]" (frontend.handler.page/get-page-ref-text "2024-01-01")))
      ;; Check resolution of existing file at root of graph
      (is (= "[[file:../root.org][root]]" (frontend.handler.page/get-page-ref-text "root")))
      ;; Check resolution of existing file in non-standard location
      (is (= "[[file:../nonstandard/location.org][location]]" (frontend.handler.page/get-page-ref-text "location")))
      ;;
      )))

;; we want the same resolution of these pasts /not/ dependent on platform
(defn- test-get-page-ref-text-org
  []
  (with-redefs [state/get-current-repo (constantly test-helper/test-db)]

    (test-helper/with-config {:preferred-format "Org"
                              :org-mode/insert-file-link? true
                              :journal/page-title-format "yyyy-MM-dd"
                              :journal/file-name-format "yyyy-MM-dd"}

      (test-helper/load-test-files [{:file/path "pages/foo.org"
                                     :file/content "* Normal page in the pages folder."}
                                    {:file/path "2024-01-13.org"
                                     :file/content "* Journal file at root of the graph."}
                                    {:file/path "journals/2024-01-16.org"
                                     :file/content "* Journal file in journal folder."}
                                    {:file/path "journals/failure.org"
                                     :file/content "* Non-standard journal file in the journal folder."}
                                    {:file/path "root.org"
                                     :file/content "* This file is at the root of the graph."}
                                    {:file/path "nonstandard/location.org"
                                     :file/content "* This file is in a non-standard location."}
                                    ;; hopefully these don't happen in practice, but we should at
                                    ;; least parse them in a sane way instead of giving an incorrect
                                    ;; parsed file:// url
                                    {:file/path "/test-db/fooart.org"
                                     :file/content "* Absolute Paths?"}
                                    {:file/path "/test-db/2024-01-01.org"
                                     :file/content "* Absolute Paths?"}])

      (test-get-page-ref-text-org-journals)
      (test-get-page-ref-text-org-pages)
      (test-get-page-ref-text-org-nonstandard)
      ;;
      )))

(deftest ^:focus test-get-page-ref-text-mobile
  (testing "test page reference resolution for mobile-native platform."

    (with-redefs  [mobile-util/native-platform? (constantly true)]
      (test-get-page-ref-text-org))))

(deftest ^:focus test-get-page-ref-text-native
  (testing "test page reference resolution for org on native."
    (test-get-page-ref-text-org)))

;; In theory this test should work, but electron does seem to work with unit tests..
;; (deftest ^:focus test-get-page-ref-text-electron
;;   (testing "test page reference resolution for org on electron."

;;     (with-redefs [util/electron? (constantly true)]
;;       (test-get-page-ref-text-org))))

(deftest test-replace-page-ref!
  (are [x y] (= (let [[content old-name new-name] x]
                  (replace-page-ref! content old-name new-name))
                y)
    ["bla [[foo]] bla" "foo" "bar"] "bla [[bar]] bla"

    ["bla [[logseq/foo]] bla" "logseq/foo" "logseq/bar"] "bla [[logseq/bar]] bla"

    ["bla [[file:./foo.org][foo]] bla" "foo" "bar"]
    "bla [[file:./bar.org][bar]] bla"

    ["bla [[file:./logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:./logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:../pages/logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:../pages/logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:./pages/logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:./pages/logseq.foo.org][logseq/foo]] bla [[logseq/foo]]" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][logseq/bar]] bla [[logseq/bar]]"

    ["bla [[file:./pages/logseq.foo.org][don't change this label]] bla [[logseq/foo]]" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][don't change this label]] bla [[logseq/bar]]"))

(deftest test-replace-tag-ref!
  (are [x y] (= (let [[content old-name new-name] x]
                  (page-handler/replace-tag-ref! content old-name new-name))
                y)
    ["#foo" "foo" "bar"] "#bar"
    ["#foo" "foo" "new bar"] "#[[new bar]]"

    ["bla #foo bla" "foo" "bar"] "bla #bar bla"
    ["bla #foo bla" "foo" "new bar"] "bla #[[new bar]] bla"

    ["bla #foo" "foo" "bar"] "bla #bar"
    ["bla #foo" "foo" "new bar"] "bla #[[new bar]]"

    ["#foo #foobar" "foo" "bar"]
    "#bar #foobar"

    ["#foo #foobar bar#foo #foo" "foo" "bar"]
    "#bar #foobar bar#foo #bar"

    ["#foo #foobar bar#foo #foo,," "foo" "bar"]
    "#bar #foobar bar#foo #bar,,"

    ["#foo #foobar bar#foo #foo #foo ball" "foo" "bar"]
    "#bar #foobar bar#foo #bar #bar ball"

    ["#foo #foobar bar#foo #foo\t#foo ball" "foo" "bar"]
    "#bar #foobar bar#foo #bar\t#bar ball"

    ["#foo #foobar bar#foo #foo" "foo" "new bar"]
    "#[[new bar]] #foobar bar#foo #[[new bar]]"

    ["#logseq/foo #logseq/foobar bar#logseq/foo #logseq/foo" "logseq/foo" "logseq/bar"]
    "#logseq/bar #logseq/foobar bar#logseq/foo #logseq/bar"

    ;; #6451
    ["#中文" "中文" "中文2"] "#中文2"
    ["#2中文" "2中文" "中文234"] "#中文234"
    ["#2中文2" "2中文2" "中文1999"] "#中文1999"
    ["#2中文,SLKDF" "2中文" "中文1999"] "#2中文,SLKDF"
    ["#2中文, SLKDF" "2中文" "中文1999"] "#中文1999, SLKDF"
    ["#2中文看来减肥了" "2中文" "中文1999"] "#2中文看来减肥了"
    ["两份健康 #2中文 看来减肥了" "2中文" "中文1999"] "两份健康 #中文1999 看来减肥了"
    ["sdaflk  #2中文   看asdf了" "2中文" "中文1999"] "sdaflk  #中文1999   看asdf了"
    ["sdaflk  #2中文" "2中文" "中文1999"] "sdaflk  #中文1999"))

(deftest test-replace-old-page!
  (are [x y] (= (let [[content old-name new-name] x]
                  (replace-old-page! content old-name new-name))
                y)
    ["#foo bla [[foo]] bla #foo" "foo" "bar"]
    "#bar bla [[bar]] bla #bar"

    ["#logseq/foo bla [[logseq/foo]] bla [[file:./pages/logseq.foo.org][logseq/foo]] bla #logseq/foo" "logseq/foo" "logseq/bar"]
    "#logseq/bar bla [[logseq/bar]] bla [[file:./pages/logseq.bar.org][logseq/bar]] bla #logseq/bar"))

#_(cljs.test/test-ns 'frontend.handler.page-test)
