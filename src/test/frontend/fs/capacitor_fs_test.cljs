(ns frontend.fs.capacitor-fs-test
  (:require [frontend.fs.capacitor-fs :as capacitor-fs]
            [clojure.test :refer [deftest is]]
            [frontend.mobile.util :as mobile-util]))

(deftest get-file-path
  (if (mobile-util/native-ios?)
    (let [dir "file:///private/var/mobile/Library/Mobile%20Documents/iCloud~com~logseq~logseq/Documents/"
          url-decoded-dir "file:///private/var/mobile/Library/Mobile Documents/iCloud~com~logseq~logseq/Documents/"]
      (is (= (str url-decoded-dir "pages/pages-metadata.edn")
             (capacitor-fs/normalize-file-protocol-path
              dir
              "file:///private/var/mobile/Library/Mobile Documents/iCloud~com~logseq~logseq/Documents/pages/pages-metadata.edn"))
          "full path returns as url decoded full path")

      (is (= (str url-decoded-dir "journals/2002_01_28.md")
             (capacitor-fs/normalize-file-protocol-path
              dir
              "/journals/2002_01_28.md"))
          "relative path returns as url decoded full path")

      (is (= dir
             (capacitor-fs/normalize-file-protocol-path
              dir
              nil))
          "nil path returns url encoded dir"))
    
    (let [dir "file:///storage/emulated/0/Graphs/Test"]
      (is (= (str dir "/pages/pages-metadata.edn")
             (capacitor-fs/normalize-file-protocol-path
              dir
              "file:///storage/emulated/0/Graphs/Test/pages/pages-metadata.edn"))
          "full path returns as url decoded full path")

      (is (= (str dir "/journals/2002_01_28.md")
             (capacitor-fs/normalize-file-protocol-path
              dir
              "/journals/2002_01_28.md"))
          "relative path returns as url decoded full path")

      (is (= dir
             (capacitor-fs/normalize-file-protocol-path
              dir
              nil))
          "nil path returns url encoded dir"))))
