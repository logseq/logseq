(ns logseq.e2e.export-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.util :as util]
   [wally.main :as w])
  (:import
   (java.nio.file Files)
   (java.util.zip ZipFile)))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- open-export!
  []
  (util/double-esc)
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Export"))
  (w/wait-for ".export"))

(defn- download!
  [label]
  (.waitForDownload
   (w/get-page)
   (reify Runnable
     (run [_]
       (w/click (loc/filter ".export a" :has-text label))))))

(defn- nonempty-download?
  [download]
  (and (not (string/blank? (.suggestedFilename download)))
       (pos? (Files/size (.path download)))))

(deftest graph-export-downloads-browser-artifacts-test
  (testing "browser graph export produces nonempty DB, zip, EDN, Markdown and transit files"
    (b/new-blocks ["export root" "export child #export-tag"])
    (b/indent)
    (open-export!)
    (doseq [label ["Export SQLite DB"
                   "Export EDN file"
                   "Export as standard Markdown"
                   "Export debug transit file"]]
      (let [download (download! label)]
        (is (nonempty-download? download) label)))
    (let [download (download! "Export both SQLite DB and assets")
          path (.path download)]
      (is (nonempty-download? download))
      (with-open [zip (ZipFile. (.toFile path))]
        (let [entries (map #(.getName %) (enumeration-seq (.entries zip)))]
          (is (some #(string/ends-with? % ".sqlite") entries))
          (is (every? #(not (string/blank? %)) entries)))))
    (assert/assert-is-hidden ".ui__loading, .loading-graph")))
