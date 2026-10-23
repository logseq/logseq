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
   (com.microsoft.playwright Locator$ClickOptions
                             Page$WaitForDownloadOptions)
   (com.microsoft.playwright.options Position)
   (java.nio.file Files)
   (java.util.zip ZipFile)))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- open-export!
  []
  (util/double-esc)
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Export graph"))
  (w/wait-for ".export"))

(defn- download!
  ([label]
   (.waitForDownload
    (w/get-page)
    (reify Runnable
      (run [_]
        (w/click (loc/filter ".export a" :has-text label))))))
  ([label timeout]
   (.waitForDownload
    (w/get-page)
    (-> (Page$WaitForDownloadOptions.)
        (.setTimeout timeout))
    (reify Runnable
      (run [_]
        (w/click (loc/filter ".export a" :has-text label)))))))

(defn- nonempty-download?
  [download]
  (and (not (string/blank? (.suggestedFilename download)))
       (pos? (Files/size (.path download)))))

(defn- open-block-export!
  []
  (util/exit-edit)
  (util/right-click
   ".ls-page-blocks .ls-block:not(.block-add-button) .bullet-container")
  (w/wait-for ".ls-context-menu-content")
  (w/click (loc/filter "[role='menuitem']" :has-text "Copy / Export as"))
  (w/wait-for ".export textarea"))

(defn- export-option-checkbox
  [label]
  (.locator (w/get-page)
            (str ".export >> xpath=.//div[normalize-space()='"
                 label
                 "']/preceding-sibling::*[@role='checkbox'][1]")))

(defn- export-preview
  []
  (.inputValue (w/-query ".export textarea")))

(defn- wait-preview!
  [pred message]
  (let [deadline (+ (System/currentTimeMillis) 8000)]
    (loop []
      (let [preview (export-preview)]
        (cond
          (pred preview) preview
          (> (System/currentTimeMillis) deadline)
          (throw (ex-info message {:preview preview}))
          :else
          (do (Thread/sleep 50)
              (recur)))))))

(defn- click-checkbox-pos
  [checkbox x-ratio y-ratio]
  (let [box (.boundingBox checkbox)]
    (is (some? box) "export option checkbox should be visible")
    (.click checkbox
            (doto (Locator$ClickOptions.)
              (.setPosition (Position. (* (.-width box) x-ratio)
                                       (* (.-height box) y-ratio)))))))

(defn- toggle-export-option!
  [checkbox x-ratio y-ratio checked?]
  (click-checkbox-pos checkbox x-ratio y-ratio)
  (is (= checked? (.isChecked checkbox))))

(deftest export-dialog-option-checkboxes-toggle-test
  (testing "export option checkboxes check and uncheck from any point inside the box"
    (b/open-last-block)
    (b/save-block "hello [[Foo]] **bold**")
    (util/exit-edit)
    (assert/assert-is-visible
     (loc/filter ".page-reference .page-ref" :has-text "Foo"))
    (open-block-export!)
    (let [page-ref (export-option-checkbox "[[text]] -> text")
          emphasis (export-option-checkbox "remove emphasis")
          newline-after-block (export-option-checkbox "newline after block")]
      (is (false? (.isChecked page-ref)))
      (is (false? (.isChecked emphasis)))
      (is (false? (.isChecked newline-after-block)))
      (is (string/includes? (export-preview) "[[Foo]]"))
      (is (string/includes? (export-preview) "**bold**"))

      (doseq [[label x y] [["center" 0.5 0.5]
                           ["right" 0.85 0.5]
                           ["top-left" 0.15 0.15]]]
        (toggle-export-option! page-ref x y true)
        (wait-preview! #(and (string/includes? % "Foo")
                             (not (string/includes? % "[[Foo]]")))
                       (str "checking page-ref via " label " should strip brackets"))
        (toggle-export-option! page-ref x y false)
        (wait-preview! #(string/includes? % "[[Foo]]")
                       (str "unchecking page-ref via " label " should restore brackets")))

      (toggle-export-option! emphasis 0.5 0.5 true)
      (wait-preview! #(and (string/includes? % "bold")
                           (not (string/includes? % "**bold**")))
                     "checking emphasis should strip markers")
      (toggle-export-option! emphasis 0.5 0.5 false)
      (wait-preview! #(string/includes? % "**bold**")
                     "unchecking emphasis should restore markers")

      (toggle-export-option! newline-after-block 0.5 0.5 true)
      (is (true? (.isChecked newline-after-block)))
      (toggle-export-option! newline-after-block 0.5 0.5 false)
      (is (false? (.isChecked newline-after-block))))))

(deftest graph-export-downloads-browser-artifacts-test
  (testing "browser graph export produces nonempty DB, zip, EDN, Markdown and transit files"
    (b/new-blocks ["export root" "export child"])
    (util/set-tag "export-tag")
    (b/indent)
    (open-export!)
    (assert/assert-is-visible
     (loc/filter ".export a" :has-text "Export SQLite DB"))
    (doseq [label ["Export EDN file"
                   "Export as standard Markdown"
                   "Export debug transit file"]]
      (let [download (download! label)]
        (is (nonempty-download? download) label)))
    (let [download (download! "Export both SQLite DB and assets" 60000)
          path (.path download)]
      (is (nonempty-download? download))
      (with-open [zip (ZipFile. (.toFile path))]
        (let [entries (map #(.getName %) (enumeration-seq (.entries zip)))]
          (is (some #(string/ends-with? % ".sqlite") entries))
          (is (every? #(not (string/blank? %)) entries)))))
    (assert/assert-is-hidden ".ui__loading, .loading-graph")))
