(ns frontend.fs.capacitor-fs-test
  (:require [frontend.fs.capacitor-fs :as capacitor-fs]
            [clojure.test :refer [deftest is]]))

(deftest get-file-path
  (let [dir "file:///private/var/mobile/Library/Mobile%20Documents/iCloud~com~logseq~logseq/Documents/"
        url-decoded-dir "file:/private/var/mobile/Library/Mobile Documents/iCloud~com~logseq~logseq/Documents/"]
    (is (= (str url-decoded-dir "pages/pages-metadata.edn")
           (capacitor-fs/get-file-path
            dir
            "file:///private/var/mobile/Library/Mobile Documents/iCloud~com~logseq~logseq/Documents/pages/pages-metadata.edn"))
        "full path returns as url decoded full path")

    (is (= (str url-decoded-dir "journals/2002_01_28.md")
           (capacitor-fs/get-file-path
            dir
            "/journals/2002_01_28.md"))
        "relative path returns as url decoded full path")

    (is (= dir
           (capacitor-fs/get-file-path
            dir
            nil))
        "nil path returns url encoded dir")))
