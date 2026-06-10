(ns logseq.e2e.pdf-annotation-basic-test
  (:require
   [clojure.test :refer [deftest is testing use-fixtures]]
   [jsonista.core :as json]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.util :as util]
   [wally.main :as w])
  (:import
   [java.nio.file Paths]
   [java.util.function Consumer]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(def ^:private pdf-file
  (-> (Paths/get "../deps/graph-parser/test/resources/zotero/storage/RX5JS7SY/zlib.pdf"
                 (into-array String []))
      (.toAbsolutePath)
      (.normalize)))

(defn- js-json
  [script]
  (json/read-value (w/eval-js script) json/keyword-keys-object-mapper))

(defn- upload-pdf-asset!
  []
  (let [page (w/get-page)]
    (.onFileChooser page
                    (reify Consumer
                      (accept [_ file-chooser]
                        (.setFiles file-chooser (into-array java.nio.file.Path [pdf-file]))))))
  (b/new-block "")
  (util/input-command "Upload an asset")
  (util/exit-edit)
  (w/wait-for ".ls-page-blocks .ls-block:has-text('zlib') a.asset-ref.is-pdf")
  (w/click ".ls-page-blocks .ls-block:has-text('zlib') a.asset-ref.is-pdf")
  (w/wait-for ".extensions__pdf-viewer .textLayer span"))

(defn- click-highlight-action!
  [color]
  (w/wait-for (format ".extensions__pdf-hls-ctx-menu [data-action='%s']" color))
  (w/eval-js
   (format "document.querySelector('.extensions__pdf-hls-ctx-menu [data-action=%s]').click();"
           (json/write-value-as-string color))))

(defn- annotation-prefix-count
  []
  (util/count-elements ".ls-page-blocks .page-blocks-inner .block-title-wrap .prefix-link"))

(defn- wait-for-annotation-prefix-count!
  [expected]
  (loop [n 30]
    (when (and (not (pos? n))
               (< (annotation-prefix-count) expected))
      (throw (ex-info "Timed out waiting for PDF annotation block"
                      {:expected expected
                       :actual (annotation-prefix-count)})))
    (when (< (annotation-prefix-count) expected)
      (util/wait-timeout 100)
      (recur (dec n)))))

(defn- wait-for-highlight!
  [selector]
  (js-json
   (format
    "(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 40; i++) {
        await delay(100);
        const node = document.querySelector(%s);
        const highlight = node && (node.closest('[id^=\"hl_\"]') || node);
        if (highlight) {
          const h = highlight.getBoundingClientRect();
          return JSON.stringify({
            'highlight-id': highlight.id,
            'highlight-count': document.querySelectorAll('.extensions__pdf-viewer [id^=\"hl_\"]').length,
            'in-viewport': h.bottom >= 0 && h.top <= window.innerHeight && h.right >= 0 && h.left <= window.innerWidth
          });
        }
      }
      throw new Error('PDF highlight was not visible');
    })();"
    (json/write-value-as-string selector))))

(defn- create-text-highlight!
  [color]
  (let [before (annotation-prefix-count)
        result (js-json
                "(async () => {
                   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                   const viewer = document.querySelector('.extensions__pdf-viewer');
                   const span = Array.from(document.querySelectorAll('.extensions__pdf-viewer .textLayer span'))
                     .find((node) => node.textContent && node.textContent.trim().length > 12);
                   if (!viewer || !span) {
                     throw new Error('PDF text layer is not ready');
                   }

                   const rect = span.getBoundingClientRect();
                   const x = rect.left + Math.min(80, Math.max(10, rect.width / 2));
                   const y = rect.top + Math.max(4, rect.height / 2);
                   span.dispatchEvent(new MouseEvent('mousedown', {
                     bubbles: true,
                     cancelable: true,
                     button: 0,
                     buttons: 1,
                     clientX: x,
                     clientY: y
                   }));

                   const range = document.createRange();
                   range.selectNodeContents(span);
                   const selection = window.getSelection();
                   selection.removeAllRanges();
                   selection.addRange(range);
                   document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
                   document.dispatchEvent(new MouseEvent('mouseup', {
                     bubbles: true,
                     cancelable: true,
                     button: 0,
                     clientX: x,
                     clientY: y
                   }));

                   for (let i = 0; i < 30; i++) {
                     await delay(100);
                     if (document.querySelector('.extensions__pdf-hls-ctx-menu [data-action]')) {
                       return JSON.stringify({
                         'selected-text': selection.toString(),
                         'menu-count': document.querySelectorAll('.extensions__pdf-hls-ctx-menu').length
                       });
                     }
                   }
                   throw new Error('PDF text highlight menu did not open');
                 })();")]
    (is (pos? (:menu-count result)) result)
    (click-highlight-action! color)
    (let [highlight-selector (format ".extensions__pdf-hls-text-region .hls-text-region-item[data-color='%s']" color)]
      (w/wait-for highlight-selector)
      (wait-for-annotation-prefix-count! (inc before))
      {:annotation-index before
       :highlight-selector highlight-selector
       :highlight (wait-for-highlight! highlight-selector)})))

(defn- create-area-highlight!
  [color]
  (let [before (annotation-prefix-count)
        result (js-json
                "(async () => {
                   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                   const toolbarButton = document.querySelector('.extensions__pdf-toolbar a.button[title^=\"Area highlight\"]');
                   if (!toolbarButton) {
                     throw new Error('Area highlight toolbar button not found');
                   }
                   toolbarButton.click();
                   await delay(200);

                   const root = document.querySelector('.extensions__pdf-viewer');
                   const page = Array.from(document.querySelectorAll('.extensions__pdf-viewer .page'))
                     .find((node) => {
                       const rect = node.getBoundingClientRect();
                       return rect.bottom > 120 && rect.top < window.innerHeight - 120;
                     });
                   if (!root || !page) {
                     throw new Error('Visible PDF page not found');
                   }

                   const rect = page.getBoundingClientRect();
                   const start = {
                     x: Math.round(rect.left + rect.width * 0.35),
                     y: Math.round(Math.max(120, rect.top + rect.height * 0.35))
                   };
                   const end = { x: start.x + 130, y: start.y + 90 };
                   const init = (point, buttons) => ({
                     bubbles: true,
                     cancelable: true,
                     shiftKey: true,
                     button: 0,
                     buttons,
                     clientX: point.x,
                     clientY: point.y,
                     pageX: point.x + window.scrollX,
                     pageY: point.y + window.scrollY
                   });

                   page.dispatchEvent(new MouseEvent('mousedown', init(start, 1)));
                   root.dispatchEvent(new MouseEvent('mousemove', init(end, 1)));
                   root.dispatchEvent(new MouseEvent('mouseup', init(end, 0)));

                   for (let i = 0; i < 30; i++) {
                     await delay(100);
                     if (document.querySelector('.extensions__pdf-hls-ctx-menu [data-action]')) {
                       return JSON.stringify({
                         'menu-count': document.querySelectorAll('.extensions__pdf-hls-ctx-menu').length,
                         page: page.dataset.pageNumber
                       });
                     }
                   }
                   throw new Error('PDF area highlight menu did not open');
                 })();")]
    (is (pos? (:menu-count result)) result)
    (click-highlight-action! color)
    (let [highlight-selector (format ".extensions__pdf-hls-area-region[data-color='%s']" color)]
      (w/wait-for highlight-selector)
      (wait-for-annotation-prefix-count! (inc before))
      {:annotation-index before
       :highlight-selector highlight-selector
       :highlight (wait-for-highlight! highlight-selector)})))

(defn- click-annotation-prefix-and-wait-for-highlight!
  [annotation-index highlight-selector]
  (w/click (.nth (w/-query ".ls-page-blocks .page-blocks-inner .block-title-wrap .prefix-link .hl-page")
                 annotation-index))
  (js-json
   (format
    "(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 40; i++) {
        await delay(100);
         const highlight = document.querySelector(%s);
         if (highlight) {
           const h = highlight.getBoundingClientRect();
           const result = {
             'highlight-id': highlight.id,
             'highlight-count': document.querySelectorAll('.extensions__pdf-viewer [id^=\"hl_\"]').length,
             'in-viewport': h.bottom >= 0 && h.top <= window.innerHeight && h.right >= 0 && h.left <= window.innerWidth
           };
           if (result['in-viewport']) {
             return JSON.stringify(result);
           }
         }
       }
       throw new Error('Clicked annotation did not show the PDF highlight');
     })();"
    (json/write-value-as-string highlight-selector))))

(deftest pdf-text-and-area-annotation-highlights-test
  (testing "Text and area highlights create annotation blocks that jump to the PDF highlight"
    (upload-pdf-asset!)
    (let [{text-annotation-index :annotation-index
           text-highlight-selector :highlight-selector
           text-highlight :highlight} (create-text-highlight! "yellow")
          text-jump (click-annotation-prefix-and-wait-for-highlight! text-annotation-index
                                                                     text-highlight-selector)]
      (is (pos? (:highlight-count text-highlight)) text-highlight)
      (is (:in-viewport text-jump) text-jump)
      (util/wait-timeout 1300))

    (let [{area-annotation-index :annotation-index
           area-highlight-selector :highlight-selector
           area-highlight :highlight} (create-area-highlight! "red")
          area-jump (click-annotation-prefix-and-wait-for-highlight! area-annotation-index
                                                                     area-highlight-selector)]
      (is (pos? (:highlight-count area-highlight)) area-highlight)
      (is (:in-viewport area-jump) area-jump)
      (util/wait-timeout 1300))))
