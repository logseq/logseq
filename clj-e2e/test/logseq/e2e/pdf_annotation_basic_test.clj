(ns logseq.e2e.pdf-annotation-basic-test
  "Clicking a [[uuid]] ref to a PDF annotation opens the PDF at the highlight
  (db-test#1511)."
  (:require
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.page :as page]
   [logseq.e2e.util :as util]
   [wally.main :as w])
  (:import
   (com.microsoft.playwright Locator$ClickOptions)
   (com.microsoft.playwright.options KeyboardModifier)
   (java.nio.file Paths)
   (java.util.function Consumer)))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- asset-path
  [relative-path]
  (-> (Paths/get (str "../" relative-path) (into-array String []))
      (.toAbsolutePath)
      (.normalize)))

(defn- upload-pdf!
  []
  (let [pw-page (w/get-page)
        chooser-handler (reify Consumer
                          (accept [_ chooser]
                            (.setFiles chooser
                                       (into-array java.nio.file.Path
                                                   [(asset-path "deps/graph-parser/test/resources/zotero/storage/RX5JS7SY/zlib.pdf")]))))]
    (.onFileChooser pw-page chooser-handler)
    (b/new-block "pdf asset")
    (util/input-command "Upload an asset")
    (w/wait-for "a.asset-ref.is-pdf")
    (.offFileChooser pw-page chooser-handler)
    (util/exit-edit)
    (let [asset-block (.first (w/-query ".ls-page-blocks .ls-block:has(a.asset-ref.is-pdf)"))
          asset-uuid (.getAttribute asset-block "blockid")
          asset (ls-api-call! :editor.getBlock asset-uuid)]
      {:uuid asset-uuid
       :id (get asset "id")})))

(defn- closed-value-id
  [ident]
  (ls-api-call! :datascriptQuery
                (str "[:find ?e . :where [?e :db/ident " ident "]]")))

(defn- create-annotation!
  [asset hl-text]
  (let [annotation (ls-api-call! :editor.insertBlock
                                 (:uuid asset)
                                 hl-text
                                 {:sibling false})
        annotation-uuid (get annotation "uuid")
        color-id (closed-value-id ":logseq.property/color.yellow")]
    ;; Pdf-annotation is a private tag and ls-type is a keyword property, so the
    ;; plugin API cannot set those. hl-value is enough for the click handler.
    (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property/asset" (:id asset))
    (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property.pdf/hl-page" 1)
    (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property.pdf/hl-value"
                  {:id annotation-uuid :page 1})
    (when color-id
      (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property.pdf/hl-color" color-id))
    annotation-uuid))

(defn- pdf-viewer-open?
  []
  (boolean
   (w/eval-js "document.body.classList.contains('is-pdf-active')")))

(deftest pdf-annotation-ref-click-opens-viewer-test
  (testing "normal click on an annotation page-ref opens the PDF, shift-click opens the sidebar"
    (let [asset (upload-pdf!)
          hl-text "highlighted passage from pdf"
          annotation-uuid (create-annotation! asset hl-text)
          notes-page (str "pdf-annotation-notes-" (random-uuid))]
      (is (string? annotation-uuid))
      (page/new-page notes-page)
      (b/new-block (str "See [[" annotation-uuid "]]"))
      (util/exit-edit)
      (assert/assert-is-visible
       (loc/filter "a.page-ref" :has-text hl-text))

      (w/click (loc/filter "a.page-ref" :has-text hl-text)
               (doto (Locator$ClickOptions.)
                 (.setModifiers [KeyboardModifier/SHIFT])))
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar .sidebar-item" :has-text hl-text))
      (is (false? (pdf-viewer-open?))
          "Shift-click must not open the PDF viewer")

      (w/click (loc/filter "a.page-ref" :has-text hl-text))
      (w/wait-for "body.is-pdf-active")
      (assert/assert-is-visible ".extensions__pdf-viewer")
      (is (true? (pdf-viewer-open?)))
      (is (= notes-page (page/get-page-name))
          "Must stay on the notes page instead of routing to the PDF asset path"))))
