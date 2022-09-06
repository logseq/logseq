(ns frontend.fs.sync-test
  (:require [frontend.fs.sync :as sync]
            [clojure.test :refer [deftest are]]))

(deftest ignored?
  []
  (are [x y] (= y (sync/ignored? x))
    ".git" true
    ".gitignore" true
    ".DS_store" true
    "foo/.DS_store" true
    "logseq/graphs-txid.edn" true
    "logseq/version-files/1.md" true
    "logseq/bak/1.md" true
    "node_modules/test" true
    "foo/node_modules/" true
    "backup~" true
    "foo/backup~" true
    "foo/.test.md" true
    "pages/test.md" false
    "journals/2022_01_01.md" false
    ))
