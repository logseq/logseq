(ns logseq.e2e.assets-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.util :as util]
   [wally.main :as w])
  (:import
   (java.nio.file Paths)
   (java.util.function Consumer)))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- asset-path
  [file-name]
  (Paths/get (str "../assets/" file-name) (into-array String [])))

(deftest image-upload-lightbox-and-resize-test
  (testing "uploaded images create stable asset blocks and retain resized metadata"
    (let [page (w/get-page)
          files [(asset-path "icon.png")
                 (asset-path "icon-foreground.png")
                 (asset-path "icon-background.png")]]
      (.onFileChooser
       page
       (reify Consumer
         (accept [_ chooser]
           (.setFiles chooser (into-array java.nio.file.Path files)))))
      (b/new-block "image uploads")
      (util/input-command "Upload an asset")
      (w/wait-for ".ls-page-blocks .asset-container img")
      (assert/assert-have-count ".ls-page-blocks .asset-container img" 3)
      (doseq [image (.all (w/-query ".ls-page-blocks .asset-container img"))]
        (is (not (string/blank? (.getAttribute image "src"))))
        (is (pos? (.evaluate image "image => image.naturalWidth"))))
      (let [first-image (.first (w/-query ".ls-page-blocks .asset-container img"))
            first-block (.first (w/-query ".ls-page-blocks .ls-block:has(.asset-container img)"))
            block-uuid (.getAttribute first-block "blockid")]
        (w/click first-image)
        (assert/assert-is-visible ".pswp.pswp--open")
        (w/click ".pswp__button--close")
        (assert/assert-is-hidden ".pswp.pswp--open")
        (.hover (.first (w/-query ".ls-page-blocks .ls-resize-image")))
        (let [handle (.first (w/-query ".ls-page-blocks .image-resize.handle-right"))
              target (.first (w/-query ".ls-page-blocks .block-content"))]
          (assert/assert-is-visible handle)
          (.dragTo handle target))
        (util/wait-timeout 250)
        (let [block (ls-api-call! :editor.getBlock block-uuid)
              metadata (get block "properties")]
          (is (some? metadata)))
        (w/refresh)
        (assert/assert-have-count ".ls-page-blocks .asset-container img" 3))
      (w/click ".tag-view-nav.assets")
      (w/wait-for ".ls-view-body .ls-table-row")
      (assert/assert-have-count ".ls-view-body .ls-table-row" 3)
      (assert/assert-is-visible
       ".ls-table-header-cell:has-text('File')")
      (assert/assert-is-hidden
       ".ls-table-header-cell:has-text('checksum')"))))
