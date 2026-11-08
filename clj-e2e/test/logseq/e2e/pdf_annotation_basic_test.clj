(ns logseq.e2e.pdf-annotation-basic-test
  "Clicking a [[uuid]] ref to a PDF annotation opens the PDF at the highlight
  (db-test#1511)."
  (:require
   [clojure.edn :as edn]
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

(defn- zlib-text-highlight
  "Geometry of a real text highlight on zlib.pdf, from the exporter fixture."
  []
  (-> (asset-path "deps/graph-parser/test/resources/exporter-test-graph/assets/zlib.edn")
      str
      slurp
      edn/read-string
      :highlights
      first))

(defn- create-annotation!
  [asset hl-text]
  (let [annotation (ls-api-call! :editor.insertBlock
                                 (:uuid asset)
                                 hl-text
                                 {:sibling false})
        annotation-uuid (get annotation "uuid")
        color-id (closed-value-id ":logseq.property/color.yellow")
        fixture (zlib-text-highlight)]
    ;; Pdf-annotation is a private tag and ls-type is a keyword property, so the
    ;; plugin API cannot set those. A full hl-value (id/page/position) is enough
    ;; for the click handler and for the viewer to render/scroll the overlay.
    (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property/asset" (:id asset))
    (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property.pdf/hl-page" (:page fixture))
    (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property.pdf/hl-value"
                  (-> fixture
                      (assoc :id annotation-uuid)
                      (assoc-in [:properties :color] "yellow")))
    (when color-id
      (ls-api-call! :editor.upsertBlockProperty annotation-uuid "logseq.property.pdf/hl-color" color-id))
    annotation-uuid))

(defn- pdf-viewer-open?
  []
  (boolean
   (w/eval-js "document.body.classList.contains('is-pdf-active')")))

(defn- notes-page-ref
  "The pasted [[uuid]] on the notes page, not the copy that appears in the sidebar."
  [hl-text]
  (loc/filter "#main-content-container a.page-ref" :has-text hl-text))

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
      (assert/assert-is-visible (notes-page-ref hl-text))

      (w/click (notes-page-ref hl-text)
               (doto (Locator$ClickOptions.)
                 (.setModifiers [KeyboardModifier/SHIFT])))
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar .sidebar-item" :has-text hl-text))
      (is (false? (pdf-viewer-open?))
          "Shift-click must not open the PDF viewer")

      (w/click (notes-page-ref hl-text))
      (w/wait-for "body.is-pdf-active")
      (assert/assert-is-visible ".extensions__pdf-viewer")
      (is (true? (pdf-viewer-open?)))
      ;; The overlay wrapper has no box of its own; the absolutely positioned
      ;; rect items are what the viewer paints and scrolls to.
      (let [hl-sel (str ".extensions__pdf-viewer #hl_" annotation-uuid
                        " .hls-text-region-item")]
        (w/wait-for hl-sel {:timeout 15000})
        (assert/assert-is-visible hl-sel)
        (-> (w/-query hl-sel) .first assert/assert-that .isInViewport))
      (is (= notes-page (page/get-page-name))
          "Must stay on the notes page instead of routing to the PDF asset path"))))
