(ns logseq.graph-parser.util.file-name-test
  (:require [logseq.common.util :as common-util]
            [cljs.test :refer [is deftest]]))

;; This is a copy of frontend.util.fs/multiplatform-reserved-chars for reserved chars testing
(def multiplatform-reserved-chars ":\\*\\?\"<>|\\#\\\\")

;; Stuffs should be parsable (don't crash) when users dump some random files
(deftest page-name-parsing-tests
  (is (string? (#'common-util/tri-lb-title-parsing  "___-_-_-_---___----")))
  (is (string? (#'common-util/tri-lb-title-parsing  "_____///____---___----")))
  (is (string? (#'common-util/tri-lb-title-parsing  "/_/////---/_----")))
  (is (string? (#'common-util/tri-lb-title-parsing  "/\\#*%lasdf\\//__--dsll_____----....-._0x2B")))
  (is (string? (#'common-util/tri-lb-title-parsing  "/\\#*%l;;&&;&\\//__--dsll_____----....-._0x2B")))
  (is (string? (#'common-util/tri-lb-title-parsing  multiplatform-reserved-chars)))
  (is (string? (#'common-util/tri-lb-title-parsing  "dsa&amp&semi;l dsalfjk jkl"))))

(deftest uri-decoding-tests
  (is (= (common-util/safe-url-decode "%*-sd%%%saf%=lks") "%*-sd%%%saf%=lks")) ;; Contains %, but invalid
  (is (= (common-util/safe-url-decode "%2FDownloads%2FCNN%3AIs%5CAll%3AYou%20Need.pdf") "/Downloads/CNN:Is\\All:You Need.pdf"))
  (is (= (common-util/safe-url-decode "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla") "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla")))

(deftest page-name-sanitization-backward-tests
  (is (= "abc.def.ghi.jkl" (#'common-util/tri-lb-title-parsing "abc.def.ghi.jkl")))
  (is (= "abc/def/ghi/jkl" (#'common-util/tri-lb-title-parsing "abc%2Fdef%2Fghi%2Fjkl")))
  (is (= "abc%/def/ghi/jkl" (#'common-util/tri-lb-title-parsing "abc%25%2Fdef%2Fghi%2Fjkl")))
  (is (= "abc%2——ef/ghi/jkl" (#'common-util/tri-lb-title-parsing "abc%2——ef%2Fghi%2Fjkl")))
  (is (= "abc&amp;2Fghi/jkl" (#'common-util/tri-lb-title-parsing "abc&amp;2Fghi%2Fjkl")))
  (is (= "abc&lt;2Fghi/jkl" (#'common-util/tri-lb-title-parsing "abc&lt;2Fghi%2Fjkl")))
  (is (= "abc&percnt;2Fghi/jkl" (#'common-util/tri-lb-title-parsing "abc&percnt;2Fghi%2Fjkl")))
  (is (= "abc&semi;&;2Fghi/jkl" (#'common-util/tri-lb-title-parsing "abc&semi;&;2Fghi%2Fjkl")))
  ;; happens when importing some compatible files on *nix / macOS
  (is (= multiplatform-reserved-chars (#'common-util/tri-lb-title-parsing multiplatform-reserved-chars))))

(deftest path-utils-tests
  (is (= "asldk lakls " (common-util/path->file-body "/data/app/asldk lakls .lsad")))
  (is (= "asldk lakls " (common-util/path->file-body "asldk lakls .lsad")))
  (is (= "asldk lakls" (common-util/path->file-body "asldk lakls")))
  (is (= "asldk lakls" (common-util/path->file-body "/data/app/asldk lakls")))
  (is (= "asldk lakls" (common-util/path->file-body "file://data/app/asldk lakls.as")))
  (is (= "中文asldk lakls" (common-util/path->file-body "file://中文data/app/中文asldk lakls.as")))
  (is (= "lsad" (common-util/path->file-ext "asldk lakls .lsad")))
  (is (= "lsad" (common-util/path->file-ext "中文asldk lakls .lsad"))))
