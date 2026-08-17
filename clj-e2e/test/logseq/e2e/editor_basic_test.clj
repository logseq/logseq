(ns logseq.e2e.editor-basic-test
  (:require
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [jsonista.core :as json]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.custom-report :as custom-report]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w])
  (:import
   (com.microsoft.playwright Locator$ClickOptions)
   (com.microsoft.playwright.options KeyboardModifier)
   (java.util.function Consumer)))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- open-recycle!
  []
  (w/click ".toolbar-dots-btn")
  (w/click "[role='menuitem'] div:text('Recycle')"))

(defn- recycle-root
  [page-name]
  (loc/filter ".ls-recycle-page-content section > div > div"
              :has-text page-name))

(defn- open-left-sidebar!
  []
  (when-not (w/visible? "#left-sidebar.is-open")
    (w/click "#left-menu")
    (w/wait-for "#left-sidebar.is-open")))

(deftest recycle-restore-removes-row-immediately-test
  (let [page-name (str "recycle-restore-" (random-uuid))]
    (p/new-page page-name)
    (p/delete-page page-name)
    (open-recycle!)
    (let [root (recycle-root page-name)]
      (assert/assert-is-visible root)
      (w/click (.locator root "button:text('Restore')"))
      (assert/assert-have-count root 0)
      (w/wait-for-not-visible
       (loc/filter ".ui__toast.success" :has-text page-name)))))

(deftest recycle-delete-removes-row-and-recent-entry-test
  (let [page-name (str "recycle-delete-" (random-uuid))
        recent-item (loc/filter ".recent .recent-item" :has-text page-name)]
    (open-left-sidebar!)
    (p/new-page page-name)
    (b/save-block "recycle delete content")
    (p/delete-page page-name)
    (open-recycle!)
    (let [root (recycle-root page-name)]
      (assert/assert-is-visible root)
      (let [dialog* (atom nil)
            handler (reify Consumer
                      (accept [_ dialog]
                        (reset! dialog* {:type (.type dialog)
                                         :message (.message dialog)})
                        (.accept dialog)))]
        (.onDialog (w/get-page) handler)
        (try
          (w/click (.locator root "button:text('Delete')"))
          (finally
            (.offDialog (w/get-page) handler)))
        (is (= "confirm" (:type @dialog*)))
        (is (string/includes? (:message @dialog*) "cannot be undone")))
      (assert/assert-have-count root 0)
      (assert/assert-have-count recent-item 0)
      (w/wait-for-not-visible
       (loc/filter ".ui__toast.success" :has-text page-name)))))

(defn- open-block-context-menu!
  []
  (b/new-blocks ["hover target"])
  (util/exit-edit)
  (util/right-click
   ".ls-page-blocks .ls-block:not(.block-add-button) .bullet-container")
  (w/wait-for ".ls-context-menu-content"))

(deftest block-context-menu-clickable-controls-use-pointer-test
  (open-block-context-menu!)
  (let [heading-button (w/-query "button[title='Auto heading']")
        item (loc/filter "[role='menuitem']" :has-text "Add comment")
        sub-trigger (loc/filter "[role='menuitem']" :has-text "Add reaction")]
    (.hover heading-button)
    (is (= "pointer"
           (.evaluate heading-button "element => getComputedStyle(element).cursor")))
    (.hover item)
    (is (= "pointer"
           (.evaluate item "element => getComputedStyle(element).cursor")))
    (.hover sub-trigger)
    (is (= "pointer"
           (.evaluate sub-trigger "element => getComputedStyle(element).cursor")))))

(deftest block-context-menu-color-hover-shows-ring-test
  (open-block-context-menu!)
  (let [color (w/-query "a[title='Yellow'] .heading-bg")
        before (.evaluate color "element => getComputedStyle(element).boxShadow")]
    (.hover color)
    (let [after (.evaluate color "element => getComputedStyle(element).boxShadow")]
      (is (not= before after))
      (is (not= "none" after)))))

(deftest notification-appears-at-top-right-test
  (let [message-key "notification-position-test"
        toast (loc/filter ".ui__toast" :has-text "notification position test")]
    (ls-api-call! :show_msg
                  "notification position test"
                  "success"
                  {"key" message-key
                   "timeout" 0})
    (try
      (w/wait-for toast)
      (is (= "top-right"
             (w/eval-js
              "(() => {
                 const toast = Array.from(document.querySelectorAll('.ui__toast'))
                   .find((element) => element.textContent.includes('notification position test'));
                 const rect = toast.getBoundingClientRect();
                 const vertical = rect.top < window.innerHeight / 2 ? 'top' : 'bottom';
                 const horizontal = window.innerWidth - rect.right <= 48 ? 'right' : 'left';
                 return `${vertical}-${horizontal}`;
               })()")))
      (finally
        (ls-api-call! :ui.close_msg message-key)
        (w/wait-for-not-visible toast)))))

(deftest favorites-and-recents-load-after-refresh-test
  (let [page-name (str "sidebar-startup-" (random-uuid))
        favorite-item (loc/filter ".favorites .favorite-item" :has-text page-name)
        recent-item (loc/filter ".recent .recent-item" :has-text page-name)]
    (p/new-page page-name)
    (k/press "ControlOrMeta+Shift+f")
    (assert/assert-is-visible favorite-item)
    (assert/assert-is-visible recent-item)

    (util/refresh-until-graph-loaded)

    (util/wait-timeout 500)
    (is (= [1 1]
           [(.count favorite-item)
            (.count recent-item)]))))

(deftest favorite-menu-and-sidebar-follow-page-updates-test
  (let [page-name (str "favorite-reactivity-" (random-uuid))
        renamed-page (str "renamed-favorite-" (random-uuid))
        favorite-item #(loc/filter ".favorites .favorite-item" :has-text %)
        recent-item #(loc/filter ".recent .recent-item" :has-text %)]
    (p/new-page page-name)
    (util/exit-edit)
    (open-left-sidebar!)
    (k/press "ControlOrMeta+Shift+f")
    (assert/assert-is-visible (favorite-item page-name))

    (w/click ".toolbar-dots-btn")
    (w/click (loc/filter "[role='menuitem']" :has-text "Unfavorite page"))
    (assert/assert-have-count (favorite-item page-name) 0)

    (w/click ".toolbar-dots-btn")
    (w/click (loc/filter "[role='menuitem']" :has-text "Add to Favorites"))
    (assert/assert-is-visible (favorite-item page-name))

    (p/rename-page page-name renamed-page)
    (assert/assert-is-visible (favorite-item renamed-page))
    (assert/assert-is-visible (recent-item renamed-page))
    (assert/assert-have-count (favorite-item page-name) 0)
    (assert/assert-have-count (recent-item page-name) 0)))

(deftest page-alias-can-be-added-and-removed-from-the-property-picker-test
  (let [target-page (str "alias-target-" (random-uuid))
        source-page (str "alias-source-" (random-uuid))
        target-result (format ".property-select :text-is('%s')" target-page)
        target-value (loc/filter ".ls-page-properties .property-value"
                                 :has-text target-page)]
    (p/new-page target-page)
    (b/save-block "alias target content")
    (util/exit-edit)
    (p/new-page source-page)
    (b/save-block "alias source content")
    (util/exit-edit)

    (w/click "button:text('Set property')")
    (w/click (loc/and "strong" (util/get-by-text "Alias" true)))
    (w/fill "input[placeholder='Set Alias']" target-page)
    (w/click target-result)
    (k/esc)
    (is (= [target-page]
           (mapv #(get % "title")
                 (get (ls-api-call! :editor.getPage source-page) "alias"))))
    (assert/assert-is-visible target-value)

    (.press (.locator target-value ".multi-values.jtrigger") "Enter")
    (w/fill "input[placeholder='Set Alias']" target-page)
    (w/click target-result)
    (assert/assert-have-count target-value 0)
    (w/click (w/get-by-test-id "page title"))))

(deftest theme-preview-images-load-test
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Settings"))
  (assert/assert-is-visible ".cp__theme-modes-options")
  (is
   (true?
    (w/eval-js
     "(async () => {
        const previews = Array.from(
          document.querySelectorAll('.cp__theme-modes-options > li > i')
        );
        const urls = previews.map((preview) => {
          const match = getComputedStyle(preview).backgroundImage.match(/^url\\([\"']?(.*?)[\"']?\\)$/);
          return match?.[1];
        });
        if (urls.length !== 3 || urls.some((url) => !url)) {
          return false;
        }
        const loaded = await Promise.all(urls.map((url) => new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image.naturalWidth > 0);
          image.onerror = () => resolve(false);
          image.src = url;
        })));
        return loaded.every(Boolean);
      })()"))))

(deftest language-select-shows-dropdown-indicator-test
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Settings"))
  (assert/assert-is-visible ".ui__select-trigger")
  (assert/assert-have-count
   ".ui__select-trigger .ui__select-icon svg"
   1))

(deftest main-scrollbar-track-uses-main-background-test
  (is (true?
       (w/eval-js
        "(() => {
           const main = document.querySelector('#main-content-container');
           const style = getComputedStyle(main);
           const probe = document.createElement('span');
           probe.style.color = style.getPropertyValue('--ls-primary-background-color');
           document.body.appendChild(probe);
           const mainBackground = getComputedStyle(probe).color;
           probe.remove();
           return style.scrollbarColor.endsWith(mainBackground);
         })()"))))

(defn- choose-move-target!
  [target]
  (w/fill "input[placeholder=\"Move blocks to\"]" target)
  (let [result (.first (w/get-by-test-id target))]
    (assert/assert-is-visible result)
    (w/click result)))

(defn- drag-and-drop-file!
  [file-name file-type]
  (w/eval-js
   (format "(() => {
      const container = document.querySelector('#main-content-container');
      if (!container) {
        throw new Error('main-content-container not found');
      }
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(['logseq-e2e-drag-drop'], %s, { type: %s }));
      container.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true }));
      container.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
    })();"
           (pr-str file-name)
           (pr-str file-type))))

(defn- enable-virtualized-rendering!
  []
  (w/eval-js
   "() => {
      const url = new URL(location.href);
      url.searchParams.set('virtualized', 'true');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }")
  (w/refresh)
  (w/wait-for (.first (w/get-by-test-id "page title")) {:timeout 15000})
  (assert/assert-graph-loaded?))

(defn- js-json
  [script]
  (json/read-value (w/eval-js script) json/keyword-keys-object-mapper))

(defn- start-edit-exit-frame-capture!
  []
  (w/eval-js
   "(() => {
      const editor = document.querySelector('.editor-wrapper textarea');
      const block = editor?.closest('.ls-block');
      if (!block) throw new Error('Expected an editing block');

      window.__e2eEditExitFrames = [];
      const startedAt = performance.now();
      const sample = () => {
        const currentEditor = block.querySelector('.editor-wrapper textarea');
        const title = block.querySelector('.block-title-wrap');
        const pageRef = block.querySelector('.page-reference .page-ref');
        window.__e2eEditExitFrames.push({
          editing: Boolean(currentEditor),
          text: title?.textContent || '',
          pageRefText: pageRef?.textContent || ''
        });
        if (performance.now() - startedAt < 400) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      return true;
    })()"))

(defn- edit-exit-read-frames
  []
  (util/wait-timeout 450)
  (->> (js-json "JSON.stringify(window.__e2eEditExitFrames)")
       (remove :editing)
       vec))

(defn- insert-current-page-blocks!
  [blocks]
  (let [page (ls-api-call! :editor.getCurrentPage)
        page-uuid (get page "uuid")]
    (ls-api-call! :editor.insertBatchBlock
                  page-uuid
                  (mapv #(hash-map :content %) blocks)
                  {:sibling false})
    (ls-api-call! :editor.exitEditingMode false)
    (ls-api-call! :app.pushState "page" {:name page-uuid} nil)))

(deftest click-rendered-block-focuses-editor
  (testing "clicking a rendered block leaves the editor textarea focused"
    (let [title "click rendered block focuses editor"]
      (insert-current-page-blocks! [title])
      (w/click (format ".ls-block .block-content:has-text('%s')" title))
      (assert/assert-editor-mode)
      (let [{:keys [activeId activeTag editorId editorFocused]}
            (json/read-value
             (w/eval-js
              "(() => {
                 const editor = document.querySelector('.editor-wrapper textarea');
                 return JSON.stringify({
                   activeId: document.activeElement && document.activeElement.id,
                   activeTag: document.activeElement && document.activeElement.tagName,
                   editorId: editor && editor.id,
                   editorFocused: editor === document.activeElement
                 });
               })();")
             json/keyword-keys-object-mapper)]
        (is editorFocused
            {:active-id activeId
             :active-tag activeTag
             :editor-id editorId})))))

(defn- select-block-range-with-fast-scroll!
  [blocks]
  (w/eval-js
   (format
    "(async () => {
      const blockTitles = %s;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const scrollContainer = document.querySelector('#main-content-container');

      const blockByTitle = (title) => Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)'))
        .find((block) => block.textContent.includes(title));

      const scrollToBlock = async (title, step) => {
        for (let i = 0; i < 120; i++) {
          const block = blockByTitle(title);
          if (block) {
            block.scrollIntoView({ block: 'center' });
            await nextFrame();
            return block;
          }
          scrollContainer.scrollTop += step;
          await nextFrame();
        }
        throw new Error(`Could not find mounted block ${title}`);
      };

      if (!document.querySelector('[data-virtuoso-scroller]')) {
        throw new Error('Expected virtualized list scroller');
      }

      scrollContainer.scrollTop = 0;
      await nextFrame();

      const firstBlock = await scrollToBlock(blockTitles[0], -1000);
      const firstContent = firstBlock.querySelector('.block-content');
      const firstRect = firstContent.getBoundingClientRect();
      const clientX = Math.floor(firstRect.left + 24);
      const clientY = Math.floor(firstRect.top + Math.min(20, firstRect.height / 2));
      const pointerInit = {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        clientX,
        clientY
      };

      firstContent.dispatchEvent(new PointerEvent('pointerdown', pointerInit));
      await delay(100);

      await scrollToBlock(blockTitles[blockTitles.length - 1], 1400);
      await delay(200);

      document.querySelector('#app-container-wrapper')?.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 0,
        clientX,
        clientY
      }));

      return ((await window.logseq.api.get_selected_blocks()) || [])
        .map((block) => block.title || block.content);
    })();"
    (json/write-value-as-string blocks))))

(defn- wait-for-copied-blocks!
  [blocks]
  (loop [remaining-attempts 50]
    (let [clipboard (w/clipboard-text)
          missing-blocks (filterv #(not (string/includes? clipboard %)) blocks)]
      (if (or (empty? missing-blocks)
              (zero? remaining-attempts))
        {:clipboard-length (count clipboard)
         :missing-blocks missing-blocks}
        (do
          (util/wait-timeout 100)
          (recur (dec remaining-attempts)))))))

(defn- seed-journals!
  [journals]
  (doseq [{:keys [date blocks]} journals]
    (let [page (ls-api-call! :editor.createJournalPage date)]
      (ls-api-call! :editor.insertBatchBlock
                    (get page "uuid")
                    (mapv #(hash-map :content %) blocks)
                    {:sibling false})))
  (ls-api-call! :editor.exitEditingMode false)
  (util/goto-journals)
  (w/wait-for "#journals"))

(defn- seed-journals-with-linked-ref!
  []
  (let [target (ls-api-call! :editor.createJournalPage
                             "2026-03-01T12:00:00")
        source (ls-api-call! :editor.createJournalPage
                             "2026-02-28T12:00:00")]
    (ls-api-call! :editor.insertBatchBlock
                  (get target "uuid")
                  [{:content "journals linked refs visible target"}]
                  {:sibling false})
    (ls-api-call! :editor.insertBatchBlock
                  (get source "uuid")
                  [{:content (format
                              "journals linked refs visible source [[%s]]"
                              (get target "name"))}]
                  {:sibling false})
    (ls-api-call! :editor.exitEditingMode false)
    (util/goto-journals)
    (w/wait-for "#journals")))

(defn- scroll-journals-to-text!
  [text]
  (w/eval-js
   (format
    "(async () => {
      const text = %s;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const scrollContainer = document.querySelector('#main-content-container');

      if (!scrollContainer) {
        throw new Error('Expected main content scroller');
      }

      const findText = () => Array.from(document.querySelectorAll('#journals .journal-item'))
        .find((item) => item.textContent.includes(text));

      scrollContainer.scrollTop = 0;
      await nextFrame();

      for (let i = 0; i < 240; i++) {
        for (let settle = 0; settle < 40; settle++) {
          const item = findText();
          if (item) {
            item.scrollIntoView({ block: 'center' });
            await nextFrame();
            return true;
          }

          const visibleItems = Array.from(document.querySelectorAll('#journals .journal-item'))
            .filter((journal) => {
              const rect = journal.getBoundingClientRect();
              const containerRect = scrollContainer.getBoundingClientRect();
              return rect.bottom > containerRect.top && rect.top < containerRect.bottom;
            });
          if (visibleItems.length > 0 && visibleItems.every((journal) => journal.textContent.trim())) {
            break;
          }
          await delay(50);
        }

        scrollContainer.scrollTop += Math.max(280, Math.floor(scrollContainer.clientHeight * 0.7));
        await delay(80);
      }

      throw new Error(`Could not find mounted journal text ${text}`);
    })();"
    (json/write-value-as-string text))))

(defn- journals-layout-metrics
  []
  (js-json
   "(async () => {
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      for (let i = 0; i < 40; i++) {
        if (document.querySelector('#journals .journal-item')) {
          break;
        }
        await nextFrame();
      }

      const journalItem = document.querySelector('#journals .journal-item');
      if (!journalItem) {
        throw new Error('Expected a mounted journal item');
      }

      const style = getComputedStyle(journalItem);
      return JSON.stringify({
        'journal-item-margin-bottom': Number.parseFloat(style.marginBottom),
        'journal-item-padding-bottom': Number.parseFloat(style.paddingBottom),
        'journals-scroller-count': document.querySelectorAll('#journals [data-virtuoso-scroller]').length
      });
    })();"))

(defn- journals-linked-refs-metrics
  []
  (js-json
   "(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      let references = null;
      let foldableContent = null;
      let viewBody = null;

      for (let i = 0; i < 80; i++) {
        references = document.querySelector('#journals .references');
        foldableContent = references?.querySelector('.ls-foldable-content');
        viewBody = references?.querySelector('.ls-view-body');
        const expanded = foldableContent?.getAttribute('aria-hidden') !== 'true';
        const bodyHeight = viewBody?.getBoundingClientRect().height || 0;

        if (references && expanded && bodyHeight > 0) {
          break;
        }
        await delay(100);
      }

      if (!references) {
        throw new Error('Expected linked references in journals');
      }

      return JSON.stringify({
        'collapsed': foldableContent?.getAttribute('aria-hidden') === 'true',
        'body-mounted': Boolean(viewBody),
        'body-height': viewBody?.getBoundingClientRect().height || 0
      });
    })();"))

(defn- set-journals-scroll-position!
  [position]
  (w/eval-js
   (format
    "(() => {
      const scrollContainer = document.querySelector('#main-content-container');
      if (!scrollContainer) {
        throw new Error('Expected main content scroller');
      }
      scrollContainer.scrollTop = %s;
    })();"
    (case position
      :start "0"
      :end "scrollContainer.scrollHeight"))))

(defn- mounted-journal-height
  [block-title]
  (w/eval-js
   "title => {
      const journal = Array.from(document.querySelectorAll('#journals .journal-item'))
        .find((item) => item.textContent.includes(title));
      if (!journal) {
        throw new Error(`Expected mounted journal containing ${title}`);
      }
      return Math.round(journal.getBoundingClientRect().height);
    }"
   block-title))

(defn- multiline-heading-bullet-alignment
  [title]
  (-> (w/eval-js
       (format
        "(async () => {
          const title = %s;
          const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const block = Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)'))
            .find((block) => block.textContent.includes(title));

          if (!block) {
            throw new Error(`Block not found: ${title}`);
          }

          const wrapper = block.querySelector('.block-content-wrapper');
          const bullet = block.querySelector('.bullet-container');
          const heading = block.querySelector('.block-title-wrap.as-heading');

          if (!wrapper || !bullet || !heading) {
            throw new Error('Expected heading block with bullet controls');
          }

          wrapper.style.maxWidth = '160px';
          await nextFrame();

          const bulletRect = bullet.getBoundingClientRect();
          const headingRect = heading.getBoundingClientRect();
          const lineHeight = Number.parseFloat(window.getComputedStyle(heading).lineHeight);
          const firstLineCenterY = headingRect.top + (lineHeight / 2);
          const bulletCenterY = bulletRect.top + (bulletRect.height / 2);

          return JSON.stringify({
            bulletCenterY,
            firstLineCenterY,
            delta: Math.abs(bulletCenterY - firstLineCenterY)
          });
        })();"
        (json/write-value-as-string title)))
      (json/read-value json/keyword-keys-object-mapper)))

(deftest multiline-heading-keeps-bullet-on-first-line
  (testing "heading block bullet aligns with the first line when the heading wraps"
    (doseq [heading ["h1" "h6"]]
      (let [title (format "Multiline %s heading bullet should stay on the first visual line" heading)]
        (b/new-block title)
        (util/input-command heading)
        (util/exit-edit)
        (assert/assert-is-visible
         (loc/filter ".block-title-wrap.as-heading" :has-text title))
        (let [{:keys [delta] :as alignment} (multiline-heading-bullet-alignment title)]
          (is (<= delta 3) (pr-str (assoc alignment :heading heading))))))))

(deftest copy-blocks-selected-after-fast-scroll-virtualized-list
  (testing "copy includes virtualized blocks selected after fast scrolling a long page"
    (let [blocks (mapv #(format "fast-scroll-copy-block-%03d" %) (range 1 31))]
      (insert-current-page-blocks! blocks)
      (enable-virtualized-rendering!)
      (is (set/subset? (set blocks)
                       (set (select-block-range-with-fast-scroll! blocks))))
      (b/copy)
      (let [{:keys [missing-blocks] :as copy-result}
            (wait-for-copied-blocks! blocks)]
        (is (empty? missing-blocks) (pr-str copy-result))))))

(deftest journals-list-uses-measured-spacing-without-item-margins
  (testing "journals list spacing does not use item margins that destabilize Virtuoso measurement"
    (seed-journals!
     [{:date "2026-03-05T12:00:00"
       :blocks ["journals measured spacing first"]}
      {:date "2026-03-04T12:00:00"
       :blocks ["journals measured spacing second"]}])
    (w/wait-for "#journals .journal-item")
    (let [{:keys [journal-item-margin-bottom journal-item-padding-bottom] :as metrics} (journals-layout-metrics)]
      (is (zero? journal-item-margin-bottom) metrics)
      (is (pos? journal-item-padding-bottom) metrics))))

(deftest journals-list-does-not-nest-virtualized-scrollers-in-long-journal
  (testing "long journals keep a single virtualized measurement owner"
    (let [blocks (mapv #(format "journals long stable block %03d" %) (range 1 13))]
      (seed-journals!
       [{:date "2026-03-06T12:00:00"
         :blocks blocks}])
      (w/wait-for (format "#journals .journal-item:has-text('%s')"
                          (first blocks)))
      (enable-virtualized-rendering!)
      (w/wait-for "#journals [data-virtuoso-scroller]")
      (scroll-journals-to-text! (first blocks))
      (let [{:keys [journals-scroller-count] :as metrics} (journals-layout-metrics)]
        (is (= 1 journals-scroller-count) metrics)))))

(deftest journals-list-remounts-complete-long-journal-with-one-scroller
  (testing "an outer journal remount restores all content without a nested virtualizer"
    (let [first-block-title "journals remount stable block 001"
          last-block-title "journals remount stable block 012"
          long-blocks (mapv #(format "journals remount stable block %03d %s"
                                      %
                                      (string/join " " (repeat 24 "wrapped-content")))
                            (range 1 13))
          older-journals (mapv (fn [idx]
                                  {:date (format "2026-03-%02dT12:00:00" idx)
                                   :blocks [(format "journals remount spacer block %02d" idx)]})
                                (range 1 7))]
      (seed-journals!
       (into [{:date "2026-03-20T12:00:00"
               :blocks long-blocks}]
             older-journals))
      (enable-virtualized-rendering!)
      (let [journal-selector (format "#journals .journal-item:has-text('%s')"
                                     first-block-title)
            last-block-selector (format "%s .ls-block:has-text('%s')"
                                        journal-selector last-block-title)]
        (w/wait-for last-block-selector)
        (let [initial-height (mounted-journal-height first-block-title)]
          (set-journals-scroll-position! :end)
          (w/wait-for-not-visible journal-selector)
          (set-journals-scroll-position! :start)
          (w/wait-for last-block-selector)
          (let [{:keys [journals-scroller-count] :as metrics}
                (journals-layout-metrics)
                remounted-height (mounted-journal-height first-block-title)]
            (is (>= remounted-height (dec initial-height))
                (str (assoc metrics
                            :initial-height initial-height
                            :remounted-height remounted-height)))
            (is (= 1 journals-scroller-count) metrics)
            (assert/assert-have-count
             (format "%s [data-virtuoso-scroller]" journal-selector)
             0)))))))

(deftest journals-linked-refs-remain-visible
  (testing "journals linked refs stay visible while journals layout owns the outer measurement"
    (seed-journals!
     (mapv (fn [day]
             {:date (format "2026-03-%02dT12:00:00" day)
              :blocks [(format "journals linked refs spacer %02d" day)]})
           (range 2 6)))
    (seed-journals-with-linked-ref!)
    (scroll-journals-to-text! "journals linked refs visible target")
    (let [{:keys [collapsed body-mounted body-height] :as metrics} (journals-linked-refs-metrics)]
      (is (false? collapsed) metrics)
      (is (true? body-mounted) metrics)
      (is (pos? body-height) metrics))))

(defn- console-logs
  []
  (->> (some-> custom-report/*pw-page->console-logs* deref vals)
       (mapcat identity)
       vec))

(defn- worker-op-logs
  [logs op-names]
  (->> logs
       (filter #(and (string/includes? % ":db-worker/outliner-op-perf")
                     (string/includes? % (str ":op-names " op-names))))))

(defn- editor-input-state
  []
  (json/read-value
   (w/eval-js
    "(() => {
       const editor = document.querySelector('.editor-wrapper textarea');
       return JSON.stringify({
         value: editor?.value ?? null,
         focused: editor === document.activeElement,
         selectionStart: editor?.selectionStart ?? null,
         selectionEnd: editor?.selectionEnd ?? null,
         blockTitles: Array.from(document.querySelectorAll('.ls-page-blocks .block-title-wrap'))
           .map((node) => node.textContent.trim())
       });
     })();")
   json/keyword-keys-object-mapper))

(deftest consecutive-enter-keeps-text-and-cursor-on-the-new-block
  (b/new-block "rapid enter start")
  (k/enter)
  (util/press-seq "rapid enter alpha")
  (k/enter)
  (util/press-seq "rapid enter beta")
  (util/wait-timeout 800)
  (let [{:keys [value focused selectionStart selectionEnd]}
        (editor-input-state)]
    (is (= "rapid enter beta" value))
    (is focused)
    (is (= (count value) selectionStart selectionEnd)))
  (util/exit-edit)
  (let [block-titles (:blockTitles (editor-input-state))]
    (is (some #{"rapid enter alpha"} block-titles) block-titles)
    (is (some #{"rapid enter beta"} block-titles) block-titles)))

(deftest enter-delete-keeps-text-and-cursor-on-the-previous-block
  (b/new-block "rapid delete start")
  (k/enter)
  (k/backspace)
  (util/press-seq " tail")
  (util/wait-timeout 800)
  (let [{:keys [value focused selectionStart selectionEnd]}
        (editor-input-state)]
    (is (= "rapid delete start tail" value))
    (is focused)
    (is (= (count value) selectionStart selectionEnd)))
  (util/exit-edit)
  (let [block-titles (:blockTitles (editor-input-state))]
    (is (some #{"rapid delete start tail"} block-titles) block-titles)))

(deftest parent-and-child-rapid-edits-keep-the-latest-child-title
  (p/new-page "parent child pending edits")
  (let [page-uuid (get (ls-api-call! :editor.getBlock "parent child pending edits") "uuid")
        [parent child]
        (ls-api-call! :editor.insertBatchBlock
                      page-uuid
                      [{:content "a"
                        :children [{:content "b"}]}])
        parent-uuid (get parent "uuid")
        child-uuid (get child "uuid")]
    (w/click (str "#block-content-" parent-uuid))
    (w/fill util/editor-q "ax")
    (w/click (str "#block-content-" child-uuid))
    (w/fill util/editor-q "bx")
    (w/fill util/editor-q "b")
    (k/arrow-up)
    (util/wait-timeout 800)
    (is (= "b" (get (ls-api-call! :editor.getBlock child-uuid) "content")))))

(deftest page-level-node-reference-renders-linked-references
  (let [target-name (str "linked-reference-target-" (random-uuid))
        source-name (str "linked-reference-source-" (random-uuid))]
    (p/new-page target-name)
    (let [target-uuid (get (ls-api-call! :editor.getBlock target-name) "uuid")]
      (p/new-page source-name)
      (b/save-block (str "[[" target-name "]]"))
      (util/exit-edit)
      (let [source-uuid (get (ls-api-call! :editor.getBlock source-name) "uuid")]
        (ls-api-call! :editor.upsertBlockProperty
                      source-uuid
                      "linked-reference-node"
                      target-uuid
                      {:schema {:type "node"}})
        (let [source (ls-api-call! :editor.getBlock source-uuid)]
          (is (some (fn [[key value]]
                      (when (and (string/ends-with? key "/linked-reference-node")
                                 value)
                        value))
                    source)
              source))
        (p/goto-page target-name)
        (assert/assert-is-visible
         (loc/filter ".references" :has-text source-name))
        (assert/assert-have-count
         (loc/filter ".references" :has-text "Unexpected error")
         0)))))

(deftest consecutive-enter-and-delete-ops-complete-without-worker-errors
  (util/wait-timeout 500)
  (let [old-logs (set (console-logs))]
    (doseq [idx (range 3)]
      (b/new-block (str "render budget " idx))
      (let [block-uuid (.getAttribute (util/get-edit-block-container) "blockid")]
        (b/delete-blocks)
        (assert/assert-have-count (str "#ls-block-" block-uuid) 0)))
    (util/wait-timeout 800)
    (let [logs (remove old-logs (console-logs))
          enter-logs (concat
                      (worker-op-logs logs "[:insert-blocks]")
                      (worker-op-logs logs "[:save-block :insert-blocks]"))
          delete-logs (worker-op-logs logs "[:delete-blocks]")]
      (is (= 3 (count enter-logs)) (pr-str enter-logs))
      (is (= 3 (count delete-logs)) (pr-str delete-logs))
      (is (not-any? #(some (fn [message] (string/includes? % message))
                            ["DB worker API failed"
                             "Missing renderer resource entity"
                             "Unsupported view resource row"
                             "Invalid renderer resource UUID"])
                    logs)))))

(deftest backspace-at-start-removes-pending-block-dom-test
  (b/new-blocks ["source"])
  (b/new-block "")
  (b/save-block "pending block")
  (let [block-uuid (.getAttribute (util/get-edit-block-container) "blockid")]
    (util/move-cursor-to-start)
    (k/backspace)
    (is (nil? (ls-api-call! :editor.getBlock block-uuid)))
    (assert/assert-have-count (str "#ls-block-" block-uuid) 0)))

(deftest today-queries-render-without-resource-errors
  (let [page (ls-api-call! :editor.createJournalPage
                           (str (java.time.Instant/now)))]
    (ls-api-call! :app.pushState "page" {:name (get page "uuid")} nil))
  (util/wait-timeout 1500)
  (assert/assert-have-count "#today-queries" 1)
  (assert/assert-have-count "#today-queries .block-content-fallback-ui" 0))

(deftest drag-and-drop-asset-does-not-create-blank-asset
  (testing "dragging and dropping a file should keep non-empty asset title"
    (let [asset-title "drag-drop-regression"
          file-name (str asset-title ".png")]
      (b/new-block "")
      (drag-and-drop-file! file-name "image/png")
      (w/wait-for ".ls-page-blocks .ls-block .asset-container img")
      ;; Exit edit mode to trigger a save; this used to overwrite the new asset with blank content.
      (util/exit-edit)
      (assert/assert-have-count ".ls-page-blocks .ls-block .asset-container img" 1)
      (assert/assert-is-visible
       (format ".ls-page-blocks .ls-block .block-title-wrap:text('%s')" asset-title)))))

(deftest toggle-between-page-and-block
  (testing "Convert block to page and back"
    (b/new-block "b1")
    (util/set-tag "Page" {:hidden? true})
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-hidden ".ls-page-blocks .ls-block .ls-icon-file")))

(deftest toggle-between-page-and-block-for-selected-blocks
  (testing "Convert selected blocks to pages and back"
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (w/wait-for (format ".menu-link:has-text('%s')" "Page"))
    (k/esc)
    (b/toggle-property "Tags" "Page")
    (w/wait-for-not-visible ".ls-page-blocks .ls-block .ls-icon-file")))

(deftest disallow-adding-page-tag-to-normal-pages
  (testing "Disallow adding #Page to normal pages"
    (k/arrow-up)
    (util/move-cursor-to-end)
    (let [editor (w/-query "*:focus")
          original-title (.inputValue editor)]
      (util/press-seq " #" {:delay 20})
      (util/press-seq "Page")
      (assert/assert-is-hidden (format "#ac-0.menu-link:has-text('%s')" "Page"))
      (w/fill editor original-title)
      (is (= original-title (.inputValue editor))))
    (util/exit-edit)))

(deftest move-blocks-mod+shift+m
  (testing "move blocks using `mod+shift+m`"
    (p/new-page "Target page")
    (p/new-page "Source page")
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (k/press "ControlOrMeta+Shift+m")
    (choose-move-target! "Target page")
    (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)" 0)))

(deftest move-blocks-cmdk
  (testing "move blocks using cmdk"
    (let [target-page (str "Target page " (random-uuid))
          source-page (str "Source page " (random-uuid))]
      (p/new-page target-page)
      (p/new-page source-page)
      (b/new-blocks ["b1" "b2" "b3"])
      (b/select-blocks 3)
      (util/search-and-click "Move blocks to")
      (choose-move-target! target-page)
      (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)" 0))))

(deftest move-editing-block-cmdk
  (testing "move the current editing block using cmdk"
    (let [target-page (str "Editing block target " (random-uuid))
          source-page (str "Editing block source " (random-uuid))]
      (p/new-page target-page)
      (p/new-page source-page)
      (b/new-blocks ["editing block"])
      (util/search-and-click "Move blocks to")
      (choose-move-target! target-page)
      (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)" 0)
      (p/goto-page target-page)
      (w/wait-for ".ls-page-blocks .ls-block:has-text('editing block')")
      (is (contains? (set (util/get-page-blocks-contents)) "editing block")))))

(deftest shift-open-page-in-sidebar
  (testing "Shift+Enter opens an ordinary page search result in the sidebar"
    (p/new-page "Ordinary sidebar page")
    (b/new-blocks ["ordinary page block"])
    (p/new-page "Sidebar search source")
    (util/search "Ordinary sidebar page")
    (let [result (.first (w/get-by-test-id "Ordinary sidebar page"))]
      (assert/assert-is-visible result)
      (.hover result))
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/shift+enter)
    (assert/assert-is-visible
     ".cp__right-sidebar .sidebar-item :text('Ordinary sidebar page')")))

(deftest shift-click-page-title-opens-in-sidebar
  (testing "Shift+click opens an ordinary page title in the sidebar"
    (p/new-page "Shift click sidebar page")
    (util/exit-edit)
    (w/click "div[data-testid='page title'] .block-title-wrap"
             (doto (Locator$ClickOptions.)
               (.setModifiers [KeyboardModifier/SHIFT])))
    (assert/assert-is-visible
     ".cp__right-sidebar .sidebar-item :text('Shift click sidebar page')")))

(deftest cmdk-block-results-render-breadcrumbs-test
  (testing "CmdK block results include their ready breadcrumb"
    (let [page-name (p/get-page-name)
          title (str "cmdk breadcrumb target " (random-uuid))]
      (b/new-block title)
      (util/exit-edit)
      (util/search title)
      (assert/assert-is-visible
       (loc/filter ".cp__cmdk .breadcrumb" :has-text page-name)))))

(deftest comments-update-and-title-edit
  (testing "a submitted comment renders immediately and its thread title is editable"
    (p/new-page "Comments reactivity")
    (b/new-blocks ["comment target"])
    (util/search-and-click "Add comment")
    (assert/assert-is-visible ".ls-comments-area")
    (assert/assert-is-hidden ".ls-block.is-comments-area .block-tags")
    (w/fill ".ls-comment-add textarea" "first comment")
    (w/click ".ls-comment-submit")
    (assert/assert-is-visible ".ls-comment-row :text('first comment')")
    (w/click ".ls-comments-label")
    (assert/assert-is-visible ".ls-comments-title-editor textarea")
    (assert/assert-is-hidden ":text('Something went wrong')")))

(deftest first-comment-actions-stay-inside-scroll-container
  (p/new-page "Comment actions clipping")
  (b/new-blocks ["comment target"])
  (util/search-and-click "Add comment")
  (w/fill ".ls-comment-add textarea" "first comment")
  (w/click ".ls-comment-submit")
  (assert/assert-is-visible ".ls-comment-row")
  (is
   (w/eval-js
    "(() => {
       const list = document.querySelector('.ls-comments-list');
       const actions = document.querySelector('.ls-comment-row .ls-comment-actions');
       const listRect = list.getBoundingClientRect();
       const actionsRect = actions.getBoundingClientRect();
       return actionsRect.top >= listRect.top && actionsRect.bottom <= listRect.bottom;
     })()")))

(deftest move-pages-to-library
  (testing "move pages using `mod+shift+m`"
    (p/goto-page "Library")
    (p/new-page "test page")
    (b/new-blocks ["block1" "block2" "block3"])
    (b/select-blocks 3)
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (k/press "ControlOrMeta+Shift+m")
    (w/fill "input[placeholder=\"Move blocks to\"]" "Library")
    (w/wait-for (w/get-by-test-id "Library"))
    (w/click (w/get-by-test-id "Library"))
    (assert/assert-have-count
     (loc/filter ".ls-page-blocks .ls-block" :has-text "block1")
     0)
    (p/goto-page "Library")
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "block1"))
    (let [contents (set (util/get-page-blocks-contents))]
      (is (set/subset? (set ["block1" "block2" "block3"]) contents)))))

(deftest create-nested-pages-in-library
  (testing "create nested pages in Library"
    (p/goto-page "Library")
    (b/new-blocks ["page parent" "page child"])
    (b/indent)
    (b/new-block "another nested child")
    (b/indent)))

(defn- selection-range
  []
  (w/eval-js
   "(() => {
      const editor = document.querySelector('.editor-wrapper textarea');
      return `${editor.selectionStart}:${editor.selectionEnd}`;
    })()"))

(defn- assert-editor-value!
  [value]
  (-> (w/-query util/editor-q)
      assert/assert-that
      (.hasValue value)))

(defn- clipboard-text!
  [text]
  (w/eval-js "text => navigator.clipboard.writeText(text)" text))

(deftest editor-exit-and-unicode-persistence-test
  (testing "Esc, outside click and navigation save Unicode once and clear transient editor state"
    (let [content "中文🙂 e\u0301 editor persistence"
          page-name (p/get-page-name)]
      (b/new-block content)
      (let [block-uuid (.getAttribute (util/get-edit-block-container) "blockid")]
        (k/esc)
        (assert/assert-have-count util/editor-q 0)
        (assert/assert-is-visible
         (loc/filter ".ls-page-blocks" :has-text content))
        (w/click "#main-content-container")
        (assert/assert-have-count ".ui__popover-content, .autocomplete" 0)
        (p/new-page "editor exit destination")
        (p/goto-page page-name)
        (assert/assert-is-visible
         (loc/filter ".ls-page-blocks" :has-text content))
        (util/refresh-until-graph-loaded)
        (is (= content
               (get (ls-api-call! :editor.getBlock block-uuid) "content")))))))

(deftest empty-enter-and-soft-line-break-test
  (testing "empty Enter obeys tree rules while Shift+Enter stays inside one block"
    (b/new-block "")
    (let [before (util/page-blocks-count)]
      (k/enter)
      (is (= (inc before) (util/page-blocks-count)))
      (assert/assert-have-count util/editor-q 1))
    (b/save-block "first line second line")
    (k/press "Home")
    (dotimes [_ 10] (k/arrow-right))
    (k/press "Shift+Enter")
    (is (= "first line\n second line" (util/get-edit-content)))
    (util/exit-edit)
    (is (= 1
           (count (filter #(string/includes? % "first line")
                          (util/get-page-blocks-contents)))))
    (b/new-blocks ["empty parent" ""])
    (b/indent)
    (let [before-count (util/page-blocks-count)
          [before-x _] (util/bounding-xy (util/get-editor))]
      (k/enter)
      (let [[after-x _] (util/bounding-xy (util/get-editor))]
        (is (= before-count (util/page-blocks-count)))
        (is (< after-x before-x))))))

(deftest cursor-boundaries-word-motion-and-kill-test
  (testing "cursor motion follows boundaries and range deletion is one undoable edit"
    (let [word-modifier (if util/mac? "Alt" "Control")]
      (b/new-blocks ["first cursor line" "second cursor line"])
      (k/shift+enter)
      (util/press-seq "continued")
      (let [multiline "second cursor line\ncontinued"
            second-line-start (inc (count "second cursor line"))]
        (is (= multiline (util/get-edit-content)))
        (k/press "Home")
        (is (= (str second-line-start ":" second-line-start)
               (selection-range)))
        (k/arrow-up)
        (is (= multiline (util/get-edit-content))))
      (k/press "Home")
      (is (= "0:0" (selection-range)))
      (k/arrow-up)
      (b/wait-editor-text "first cursor line")
      (is (= "first cursor line" (util/get-edit-content)))
      (util/move-cursor-to-end)
      (let [before (util/get-edit-content)]
        (k/press (str word-modifier "+ArrowLeft"))
        (is (not= (str (count before) ":" (count before))
                  (selection-range))))
      (k/press (str word-modifier "+Backspace"))
      (assert-editor-value! "first line")
      (b/undo)
      (assert-editor-value! "first cursor line")
      (k/press "ControlOrMeta+a")
      (k/backspace)
      (assert-editor-value! "")
      (b/undo)
      (assert-editor-value! "first cursor line"))))

(deftest text-format-shortcuts-and-source-roundtrip-test
  (testing "format shortcuts wrap only the selection and rendered text round-trips"
    (doseq [[shortcut source expected]
            [["ControlOrMeta+b" "bold" "**bold**"]
             ["ControlOrMeta+i" "italic" "*italic*"]
             ["ControlOrMeta+Shift+h" "highlight" "==highlight=="]]]
      (b/new-block source)
      (k/press "ControlOrMeta+a")
      (k/press shortcut)
      (let [formatted (util/get-edit-content)]
        (is (= expected formatted))
        (util/exit-edit)
        (assert/assert-is-visible
         (loc/filter ".block-title-wrap" :has-text source))
        (w/click (loc/filter ".block-title-wrap" :has-text source))
        (is (= formatted (util/get-edit-content)))))
    (b/new-block "escape \\* literal 🙂 longwordwithoutbreak0123456789")
    (util/exit-edit)
    (assert/assert-is-visible
     (loc/filter ".block-title-wrap" :has-text "longwordwithoutbreak"))))

(deftest escape-save-never-paints-stale-block-content-test
  (testing "the first rendered frame after Escape contains the saved text"
    (let [title (str "escape-save-frame-" (random-uuid))]
      (b/new-block "")
      (w/fill util/editor-q title)
      (start-edit-exit-frame-capture!)
      (k/esc)
      (assert/assert-non-editor-mode)
      (let [frames (edit-exit-read-frames)]
        (is (seq frames))
        (is (every? #(= title (:text %)) frames)
            frames)))))

(deftest new-page-reference-renders-on-the-first-frame-after-save-test
  (testing "a newly created page reference is never blank after Escape"
    (let [page-title (str "reference-first-frame-" (random-uuid))]
      (b/new-block "")
      (w/fill util/editor-q (str "[[" page-title "]]"))
      (start-edit-exit-frame-capture!)
      (k/esc)
      (assert/assert-non-editor-mode)
      (let [frames (edit-exit-read-frames)]
        (is (seq frames))
        (is (every? #(= page-title (:pageRefText %)) frames)
            frames)))))

(deftest saved-page-reference-reopens-with-page-title-test
  (testing "keyboard editing uses the page title instead of its UUID"
    (let [page-title (str "reference-reedit-" (random-uuid))
          source (format "[[%s]]" page-title)]
      (b/new-block "")
      (w/fill util/editor-q source)
      (k/esc)
      (assert/assert-non-editor-mode)
      (assert/assert-is-visible
       (loc/filter ".page-reference .page-ref" :has-text page-title))
      (k/enter)
      (assert/assert-editor-mode)
      (is (= source (util/get-edit-content))))))

(deftest page-and-tag-autocomplete-test
  (testing "page and tag autocomplete update, insert and open existing/new targets"
    (p/new-page "autocomplete existing page")
    (p/new-page "autocomplete host")
    (b/new-block "")
    (util/press-seq "[[autocomplete existing page")
    (assert/assert-is-visible
     (loc/filter ".ui__popover-content a.menu-link.chosen"
                 :has-text "autocomplete existing page"))
    (k/enter)
    (is (string/includes? (util/get-edit-content)
                          "[[autocomplete existing page]]"))
    (util/exit-edit)
    (w/click
     (loc/filter ".page-reference .page-ref"
                 :has-text "autocomplete existing page"))
    (is (= "autocomplete existing page" (p/get-page-name)))
    (p/goto-page "autocomplete host")
    (b/new-block "")
    (util/press-seq "#autocomplete-new-tag")
    (assert/assert-is-visible ".ui__popover-content")
    (k/enter)
    (assert/assert-is-visible
     (loc/filter ".block-tag" :has-text "autocomplete-new-tag"))))

(deftest slash-menu-filter-scroll-and-cleanup-test
  (testing "slash search keeps one highlighted result and Esc clears its state"
    (b/new-block "")
    (util/press-seq "/")
    (assert/assert-is-visible ".ui__popover-content")
    (util/press-seq "property")
    (assert/assert-is-visible
     (loc/filter ".ui__popover-content" :has-text "property"))
    (k/arrow-down)
    (k/arrow-up)
    (assert/assert-have-count
     ".ui__popover-content a.menu-link.chosen, .ui__popover-content [data-kb-highlighted]"
     1)
    (k/esc)
    (assert/assert-is-hidden ".ui__popover-content")
    (is (= "/property" (util/get-edit-content)))
    (util/press-seq "/")
    (assert/assert-is-visible ".ui__popover-content")))

(deftest task-date-and-priority-slash-lifecycle-test
  (testing "task commands add, update and clear visible properties immediately"
    (b/new-block "sample task")
    (util/input-command "TODO")
    (util/exit-edit)
    (let [block (loc/filter ".ls-page-blocks .ls-block"
                            :has-text "sample task")
          uuid (.getAttribute block "blockid")
          block-selector (format "#ls-block-%s" uuid)]
      (assert/assert-is-visible
       (loc/filter (str block-selector " .block-tag") :has-text "Task"))
      (w/click (str block-selector " .block-title-wrap"))
      (util/move-cursor-to-end)
      (util/input-command "Priority High")
      (util/exit-edit)
      (assert/assert-have-count
       (str block-selector " .positioned-properties.block-left .property-value-inner")
       2)
      (is (= "High"
             (get-in (ls-api-call! :editor.getBlock uuid)
                     [":logseq.property/priority" "title"])))
      (w/click (str block-selector " .block-title-wrap"))
      (util/move-cursor-to-end)
      (util/input-command "Scheduled")
      (w/click
       "[role='gridcell'][aria-selected='true'] button")
      (util/exit-edit)
      (assert/assert-is-visible
       (loc/filter (str block-selector " .bottom-property-pill")
                   :has-text "Scheduled"))
      (w/click (str block-selector " .block-title-wrap"))
      (util/move-cursor-to-end)
      (util/input-command "No priority")
      (util/exit-edit)
      (is (= ":logseq.property/empty-placeholder"
             (get-in (ls-api-call! :editor.getBlock uuid)
                     [":logseq.property/priority" "ident"]))))))

(deftest virtualized-late-editor-and-code-editor-test
  (testing "late-mounted rows and CodeMirror keep separate targets and persisted content"
    (let [page-name (p/get-page-name)
          page-uuid (get (ls-api-call! :editor.getPage page-name) "uuid")]
      (ls-api-call! :editor.insertBatchBlock
                    page-uuid
                    (mapv #(hash-map :content (str "late editor row " %))
                          (range 30)))
      (w/click (loc/filter ".block-title-wrap" :has-text "late editor row 29"))
      (util/move-cursor-to-end)
      (util/press-seq " edited")
      (is (= "late editor row 29 edited" (util/get-edit-content))))
    (b/new-block "")
    (util/input-command "Code block")
    (assert/assert-is-visible ".CodeMirror, .cm-editor")
    (let [code-block-uuid
          (.getAttribute (w/-query ".ls-block:has(.CodeMirror)") "blockid")]
      (w/click (.first (w/-query "pre.CodeMirror-line")))
      (util/input "const value = 1;\nvalue + 1;")
      (k/esc)
      (util/exit-edit)
      (assert/assert-is-visible
       (loc/filter ".extensions__code" :has-text "const value = 1"))
      (util/refresh-until-graph-loaded)
      (is (string/includes?
           (get (ls-api-call! :editor.getBlock code-block-uuid) "content")
           "const value = 1")))))

(deftest multi-selection-indent-roundtrip-test
  (testing "multi-indent preserves order/subtrees and is one undo step"
    (let [page-name (p/get-page-name)]
      (b/new-blocks ["multi a" "multi a child" "multi b" "multi b child"])
      (k/tab)
      (k/arrow-up)
      (k/arrow-up)
      (k/tab)
      (is (= 2 (count (ls-api-call! :editor.getPageBlocksTree page-name))))
      (k/arrow-down)
      (k/arrow-down)
      (b/select-blocks 2)
      (k/tab)
      (let [indented (ls-api-call! :editor.getPageBlocksTree page-name)]
        (is (= 1 (count indented))))
      (b/undo)
      (is (= 2 (count (ls-api-call! :editor.getPageBlocksTree page-name))))
      (b/redo)
      (is (= 1 (count (ls-api-call! :editor.getPageBlocksTree page-name)))))))

(deftest collapse-single-multiple-and-sidebar-test
  (testing "single and selected collapse states update mounted containers predictably"
    (let [page-name (p/get-page-name)
          parent (ls-api-call! :editor.appendBlockInPage page-name "collapse parent")
          uuid (get parent "uuid")]
      (ls-api-call! :editor.insertBlock uuid "collapse child" {:sibling false})
      (w/click (format ".ls-page-blocks #control-%s" uuid))
      (assert/assert-is-hidden
       (loc/filter (format "#ls-block-%s" uuid) :has-text "collapse child"))
      (ls-api-call! :editor.openInRightSidebar uuid)
      (assert/assert-is-visible (format ".cp__right-sidebar #ls-block-%s" uuid))
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar" :has-text "collapse child"))
      (w/click
       (format ".cp__right-sidebar #control-%s" uuid))
      (assert/assert-is-hidden
       (loc/filter ".cp__right-sidebar" :has-text "collapse child"))
      (w/click
       (format ".cp__right-sidebar #control-%s" uuid))
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar" :has-text "collapse child"))
      (w/refresh)
      (assert/assert-is-hidden ".ui__loading, .loading-graph")
      (assert/assert-is-visible
       (format ".ls-page-blocks #ls-block-%s" uuid)))))

(deftest selection-direction-and-hierarchical-select-all-test
  (testing "range and select-all remain inside the current visible container"
    (b/new-blocks ["select a" "select b" "select c" "select d"])
    (b/select-blocks 3)
    (assert/assert-have-count ".ls-page-blocks .ls-block.selected" 3)
    (is (= ["select b" "select c" "select d"]
           (mapv string/trim
                 (w/all-text-contents
                  ".ls-page-blocks .ls-block.selected .block-title-wrap"))))
    (k/press "ControlOrMeta+a")
    (assert/assert-have-count ".ls-page-blocks .ls-block.selected" 4)
    (assert/assert-have-count ".cp__right-sidebar .ls-block.selected" 0)))

(deftest structured-and-plain-text-copy-test
  (testing "structured copy preserves trees while plain copy exposes readable indentation"
    (let [target-page "copy target"]
      (b/new-blocks ["copy parent" "copy child" "copy sibling"])
      (k/arrow-up)
      (b/indent)
      (k/arrow-down)
      (b/select-blocks 3)
      (b/copy)
      (p/new-page target-page)
      (b/paste)
      (util/exit-edit)
      (let [tree (ls-api-call! :editor.getPageBlocksTree target-page)]
        (is (= ["copy parent" "copy sibling"]
               (mapv #(get % "content") tree)))
        (is (= ["copy child"]
               (mapv #(get % "content") (get (first tree) "children")))))
      (w/click (loc/filter ".block-title-wrap" :has-text "copy sibling"))
      (b/select-blocks 3)
      (k/press "ControlOrMeta+Shift+c")
      (let [{:keys [missing-blocks] :as copy-result}
            (wait-for-copied-blocks! ["copy parent" "copy child"])]
        (is (empty? missing-blocks) (pr-str copy-result))))))

(deftest plain-multiline-and-html-paste-test
  (testing "paste mode preserves cursor text, multiline structure and safe rich content"
    (b/new-block "before-after")
    (k/press "Home")
    (dotimes [_ 7] (k/arrow-right))
    (clipboard-text! "middle")
    (b/paste)
    (is (= "before-middleafter" (util/get-edit-content)))
    (clipboard-text! "root\n  child\nsibling")
    (b/new-block "")
    (b/paste)
    (util/exit-edit)
    (assert/assert-is-visible (loc/filter ".ls-page-blocks" :has-text "child"))
    (b/new-block "")
    (w/eval-js
     "(() => {
        const transfer = new DataTransfer();
        transfer.setData('text/html',
          '<h2>Rich title</h2><ul><li><strong>Bold item</strong></li></ul><script>window.__e2eInjected=true</script>');
        transfer.setData('text/plain', 'Rich title\\nBold item');
        document.querySelector('.editor-wrapper textarea').dispatchEvent(
          new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData: transfer})
        );
      })()")
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks" :has-text "Rich title"))
    (k/esc)
    (util/exit-edit)
    (assert/assert-is-visible
     (loc/filter ".block-title-wrap" :has-text "Rich title"))
    (is (not (true? (w/eval-js "window.__e2eInjected === true"))))))

(deftest mixed-height-virtual-page-keeps-blocks-separated-test
  (testing "mixed text, code and headings do not overlap after fast scrolling"
    (let [long-text (apply str (repeat 8 "long mixed-height content "))
          blocks (vec
                  (mapcat
                   (fn [index]
                     [(format "mixed plain %03d" index)
                      (str "## mixed heading " index)
                      (str "```clojure\n(+ " index " 1)\n```")
                      (str long-text index)])
                   (range 8)))]
      (insert-current-page-blocks! blocks)
      (enable-virtualized-rendering!)
      (assert/assert-is-visible
       (util/-query-last ".ls-page-blocks [data-virtuoso-scroller]"))
      (doseq [position [1.0 0.0 0.5 0.9 0.1]]
        (w/eval-js
         "position => {
            const scroller = Array.from(document.querySelectorAll(
              '.ls-page-blocks [data-virtuoso-scroller]'
            )).find((node) => node.getClientRects().length > 0);
            scroller.scrollTop =
              Math.max(0, (scroller.scrollHeight - scroller.clientHeight) * position);
            scroller.dispatchEvent(new Event('scroll'));
          }"
         position)
        (util/wait-timeout 100)
        (let [{:strs [overlap visibleCount]}
              (w/eval-js
               "(() => {
                  const blocks = Array.from(
                    document.querySelectorAll('.ls-page-blocks .ls-block')
                  ).filter((node) => {
                    const rect = node.getBoundingClientRect();
                    return rect.bottom > 0 && rect.top < innerHeight;
                  });
                  const rects = blocks.map((node) => node.getBoundingClientRect());
                  return {
                    visibleCount: rects.length,
                    overlap: rects.some(
                      (rect, index) => index > 0 && rect.top < rects[index - 1].bottom
                    )
                  };
                })()")]
          (is (pos? visibleCount))
          (is (false? overlap)))))))

(deftest journals-consecutive-input-test
  (testing "consecutive journal input creates one stable editor and distinct blocks"
    (util/goto-journals)
    (b/new-blocks ["journal e2e first" "journal e2e second" "journal e2e third"])
    (assert/assert-have-count util/editor-q 1)
    (is (= "journal e2e third" (util/get-edit-content)))
    (util/exit-edit)
    (let [journal-selector "#journals .journal-item:has-text('journal e2e third')"
          block-selector (str journal-selector
                              " .ls-block:not(.block-add-button) .block-title-wrap")]
      (w/wait-for journal-selector)
      (is (= ["journal e2e first" "journal e2e second" "journal e2e third"]
             (take-last 3 (w/all-text-contents block-selector)))))))

(deftest worker-missing-read-is-recoverable-test
  (testing "a missing worker entity returns nil without poisoning a later read"
    (let [missing-uuid (str (random-uuid))]
      (is (nil? (ls-api-call! :editor.getBlock missing-uuid))))
    (assert/assert-is-hidden ".ui__loading, .loading-graph")
    (b/new-block "worker recovery target")
    (let [uuid (.getAttribute (util/get-edit-block-container) "blockid")]
      (util/exit-edit)
      (is (string? uuid))
      (is (= "worker recovery target"
             (get (ls-api-call! :editor.getBlock uuid) "content"))))))

(deftest enter-splits-block-at-cursor-test
  (testing "Enter in the middle preserves both halves and moves focus to the second"
    (b/new-block "alphaomega")
    (k/press "Home")
    (dotimes [_ 5] (k/arrow-right))
    (k/enter)
    (util/press-seq "middle-")
    (assert/assert-have-count util/editor-q 1)
    (is (= "middle-omega" (util/get-edit-content)))
    (util/exit-edit)
    (is (= ["alpha" "middle-omega"]
           (take-last 2 (util/get-page-blocks-contents))))))

(deftest node-reference-autocomplete-test
  (testing "node reference search inserts a reference and rerenders target updates"
    (let [source-page (p/get-page-name)]
      (b/new-block "reference autocomplete unique target")
      (let [target-uuid (.getAttribute (util/get-edit-block-container) "blockid")]
        (b/new-block "")
        (util/press-seq "[[reference autocomplete unique")
        (assert/assert-is-visible ".ui__popover-content")
        (assert/assert-is-visible
         (loc/filter ".ui__popover-content .breadcrumb" :has-text source-page))
        (w/click (.first (loc/filter ".ui__popover-content a" :has-text
                                     "reference autocomplete unique target")))
        (util/exit-edit)
        (assert/assert-is-visible
         (loc/filter ".page-reference"
                     :has-text "reference autocomplete unique target"))
        (b/jump-to-block "reference autocomplete unique target")
        (k/press "ControlOrMeta+a")
        (util/press-seq "reference autocomplete updated target")
        (util/exit-edit)
        (assert/assert-is-visible
         (loc/filter ".page-reference"
                     :has-text "reference autocomplete updated target"))
        (is (= source-page (p/get-page-name)))
        (w/click (.first (loc/filter ".page-reference .page-ref"
                                     :has-text "reference autocomplete updated target")))
        (is (string/includes? (.url (w/get-page)) target-uuid))
        (assert/assert-is-visible
         (loc/filter ".ls-page-blocks .block-title-wrap"
                     :has-text "reference autocomplete updated target"))))))

(deftest quick-add-moves-all-blocks-to-today-test
  (testing "Quick add moves every temporary block to today's journal exactly once"
    (k/press (if util/mac? "Meta+e" "Control+Alt+e"))
    (assert/assert-is-visible ".ls-dialog-quick-add")
    (w/wait-for util/editor-q)
    (b/new-blocks ["quick add first" "quick add second"])
    (w/click
     (loc/filter ".ls-dialog-quick-add button" :has-text "Add to today"))
    (w/wait-for-not-visible ".ls-dialog-quick-add")
    (util/goto-journals)
    (assert/assert-have-count
     (loc/filter "#journals .block-title-wrap" :has-text "quick add first")
     1)
    (assert/assert-have-count
     (loc/filter "#journals .block-title-wrap" :has-text "quick add second")
     1)))

(deftest external-property-update-preserves-edit-buffer-test
  (testing "an external property/child delta does not replace unrelated active text"
    (b/new-block "active editor text")
    (let [uuid (.getAttribute (util/get-edit-block-container) "blockid")]
      (util/move-cursor-to-end)
      (util/press-seq " local draft")
      (ls-api-call! :editor.upsertBlockProperty uuid "external-property" "updated")
      (ls-api-call! :editor.insertBlock uuid "external child" {:sibling false})
      (is (= "active editor text local draft" (util/get-edit-content)))
      (assert/assert-is-visible
       (loc/filter ".property-pair" :has-text "external-property"))
      (assert/assert-is-visible
       (loc/filter ".ls-block" :has-text "external child")))))

(deftest operation-completion-restores-mounted-focus-test
  (testing "completed insert/update/delete operations expose their DOM result immediately"
    (let [page-name (p/get-page-name)
          inserted (ls-api-call! :editor.appendBlockInPage page-name "completion inserted")
          uuid (get inserted "uuid")]
      (assert/assert-have-count (str "#ls-block-" uuid) 1)
      (ls-api-call! :editor.updateBlock uuid "completion updated")
      (assert/assert-is-visible
       (format "#ls-block-%s .block-title-wrap:text('completion updated')" uuid))
      (w/click (format "#ls-block-%s .block-content" uuid))
      (util/move-cursor-to-end)
      (util/press-seq " and focused")
      (is (= "completion updated and focused" (util/get-edit-content)))
      (ls-api-call! :editor.removeBlock uuid)
      (assert/assert-have-count (str "#ls-block-" uuid) 0))))
