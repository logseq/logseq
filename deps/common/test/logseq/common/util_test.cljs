(ns logseq.common.util-test
  (:require [clojure.test :refer [deftest are]]
            [logseq.common.util :as common-util]))

(deftest valid-edn-keyword?
  (are [x y]
       (= (common-util/valid-edn-keyword? x) y)

       ":foo-bar"  true
       ":foo!"     true
       ":foo,bar"  false
       "4"         false
       "foo bar"   false
       "`property" false))

(deftest extract-file-extension?
  (are [x y]
       (= (common-util/path->file-ext x) y)
       "foo.bar" "bar"
       "foo"     nil
       "foo.bar.baz" "baz"
       "../assets/audio.mp3" "mp3"
       ;; From https://www.w3.org/TR/media-frags/
       "../assets/audio.mp3?t=10,20" "mp3"
       "../assets/audio.mp3?t=10,20#t=10" "mp3"
       "/root/Documents/audio.mp3" "mp3"
       "C:\\Users\\foo\\Documents\\audio.mp3" "mp3"
       "/root/Documents/audio" nil
       "/root/Documents/audio." nil
       "special/characters/aäääöüß.7z" "7z"
       "asldk lakls .lsad" "lsad"
       "中文asldk lakls .lsad" "lsad"))

(deftest url?
  (are [x y]
       (= (common-util/url? x) y)
       "http://logseq.com" true
       "prop:: value" false
       "a:" false))
