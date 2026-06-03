(ns logseq.e2e.editor-basic-test
  (:require
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [jsonista.core :as json]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

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

(defn- multiline-heading-control-alignment
  [title icon?]
  (-> (w/eval-js
       (format
        "(async () => {
          const title = %s;
          const icon = %s;
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

          if (icon) {
            await window.logseq.api.set_block_icon(block.getAttribute('blockid'), 'tabler-icon', 'star');
            for (let i = 0; i < 20; i++) {
              await nextFrame();
              if (block.querySelector('.bullet-container .icon-cp-container')) {
                break;
              }
            }
          }

          wrapper.style.maxWidth = '160px';
          await nextFrame();

          const control = icon ? block.querySelector('.bullet-container .icon-cp-container') : bullet;
          if (!control) {
            throw new Error('Expected heading icon control');
          }

          const controlRect = control.getBoundingClientRect();
          const headingRect = heading.getBoundingClientRect();
          const lineHeight = Number.parseFloat(window.getComputedStyle(heading).lineHeight);
          const firstLineCenterY = headingRect.top + (lineHeight / 2);
          const controlCenterY = controlRect.top + (controlRect.height / 2);

          return JSON.stringify({
            controlCenterY,
            firstLineCenterY,
            delta: Math.abs(controlCenterY - firstLineCenterY)
          });
        })();"
        (json/write-value-as-string title)
        (json/write-value-as-string icon?)))
      (json/read-value json/keyword-keys-object-mapper)))

(deftest multiline-heading-centers-bullet-on-first-heading-line
  (testing "wrapped heading block bullet stays centered with the first visual heading line"
    (doseq [heading (map #(str "h" %) (range 1 7))]
      (let [title (format "Multiline %s heading bullet should center on the first visual heading line" heading)]
        (b/new-block title)
        (util/input-command heading)
        (util/exit-edit)
        (let [{:keys [delta] :as alignment} (multiline-heading-control-alignment title false)]
          (is (<= delta 3) (assoc alignment :heading heading)))))))

(deftest multiline-heading-centers-icon-on-first-heading-line
  (testing "wrapped heading block icon stays centered with the first visual heading line"
    (doseq [heading (map #(str "h" %) (range 1 7))]
      (let [title (format "Multiline %s heading icon should center on the first visual heading line" heading)]
        (b/new-block title)
        (util/input-command heading)
        (util/exit-edit)
        (let [{:keys [delta] :as alignment} (multiline-heading-control-alignment title true)]
          (is (<= delta 3) (assoc alignment :heading heading)))))))

(defn- select-blocks-while-scrolling!
  [block-count]
  (w/eval-js
   (format
    "(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const blocks = Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)')).slice(0, %d);

      if (blocks.length !== %d) {
        throw new Error(`Expected %d blocks, got ${blocks.length}`);
      }

      const firstContent = blocks[0].querySelector('.block-content');
      firstContent.scrollIntoView({ block: 'center' });
      await nextFrame();

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

      let previousTarget = firstContent;
      for (const block of blocks.slice(1)) {
        block.scrollIntoView({ block: 'center' });
        await nextFrame();

        const target = block.querySelector('.block-main-container');
        previousTarget.dispatchEvent(new MouseEvent('mouseout', {
          ...pointerInit,
          relatedTarget: target
        }));
        target.dispatchEvent(new MouseEvent('mouseover', {
          ...pointerInit,
          relatedTarget: previousTarget
        }));
        previousTarget = target;
        await delay(30);
      }

      document.querySelector('#app-container-wrapper')?.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 0,
        clientX,
        clientY
      }));

      return Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block.selected'))
        .map((block) => block.textContent.trim());
    })();"
    block-count
    block-count
    block-count)))

(defn- enable-virtualized-rendering!
  []
  (w/eval-js
   "() => {
      history.replaceState(null, '', location.pathname + location.hash);
    }")
  (w/refresh)
  (assert/assert-graph-loaded?))

(defn- js-json
  [script]
  (json/read-value (w/eval-js script) json/keyword-keys-object-mapper))

(defn- select-block-titles-while-scrolling!
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

      const scrollToBlock = async (title) => {
        for (let i = 0; i < 80; i++) {
          const block = blockByTitle(title);
          if (block) {
            block.scrollIntoView({ block: 'center' });
            await nextFrame();
            return block;
          }
          scrollContainer.scrollTop += 260;
          await nextFrame();
        }
        throw new Error(`Could not find mounted block ${title}`);
      };

      if (!document.querySelector('[data-virtuoso-scroller]')) {
        throw new Error('Expected virtualized list scroller');
      }

      if (!blockByTitle(blockTitles[0])) {
        scrollContainer.scrollTop = 0;
        await delay(500);
      }

      const appWrapper = document.querySelector('#app-container-wrapper');
      appWrapper?.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        clientX: 1,
        clientY: 1
      }));
      appWrapper?.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 0,
        clientX: 1,
        clientY: 1
      }));
      await nextFrame();

      const firstBlock = await scrollToBlock(blockTitles[0]);
      const firstContent = firstBlock.querySelector('.block-content');
      await delay(500);
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

      let previousTarget = firstContent;
      for (const title of blockTitles.slice(1)) {
        const block = await scrollToBlock(title);
        const target = block.querySelector('.block-main-container');
        const targetRect = target.getBoundingClientRect();
        const targetX = Math.floor(targetRect.left + 24);
        const targetY = Math.floor(targetRect.top + Math.min(20, targetRect.height / 2));
        const targetPointer = {
          ...pointerInit,
          clientX: targetX,
          clientY: targetY
        };
        if (previousTarget.isConnected) {
          previousTarget.dispatchEvent(new MouseEvent('mouseout', {
            ...targetPointer,
            relatedTarget: target
          }));
        }
        target.dispatchEvent(new MouseEvent('mouseover', {
          ...targetPointer,
          relatedTarget: previousTarget
        }));
        previousTarget = target;
        await delay(30);
      }

      document.querySelector('#app-container-wrapper')?.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 0,
        clientX,
        clientY
      }));

      return Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block.selected'))
        .map((block) => block.textContent.trim());
    })();"
    (json/write-value-as-string blocks))))

(defn- insert-current-page-blocks!
  [blocks]
  (w/eval-js
   (format
    "(async () => {
      const page = await window.logseq.api.get_current_page();
      await window.logseq.api.insert_batch_block(
        page.uuid,
        %s.map((content) => ({ content })),
        { sibling: false }
      );
      await window.logseq.api.exit_editing_mode(false);
      window.logseq.api.push_state('page', { name: page.uuid }, null);
    })();"
    (json/write-value-as-string blocks))))

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

(defn- seed-journals!
  [journals]
  (w/eval-js
   (format
    "(async () => {
      const journals = %s;

      for (const journal of journals) {
        const page = await window.logseq.api.create_journal_page(journal.date);
        await window.logseq.api.insert_batch_block(
          page.uuid,
          journal.blocks.map((content) => ({ content })),
          { sibling: false }
        );
      }

      await window.logseq.api.exit_editing_mode(false);
      window.logseq.api.push_state('all-journals', null, null);
    })();"
    (json/write-value-as-string journals))))

(defn- seed-journals-with-linked-ref!
  []
  (w/eval-js
   "(async () => {
      const target = await window.logseq.api.create_journal_page('2026-03-01T12:00:00');
      const source = await window.logseq.api.create_journal_page('2026-02-28T12:00:00');

      await window.logseq.api.insert_batch_block(
        target.uuid,
        [{ content: 'journals linked refs visible target' }],
        { sibling: false }
      );
      await window.logseq.api.insert_batch_block(
        source.uuid,
        [{ content: `journals linked refs visible source [[${target.name}]]` }],
        { sibling: false }
      );

      await window.logseq.api.exit_editing_mode(false);
      window.logseq.api.push_state('all-journals', null, null);
    })();"))

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
        const item = findText();
        if (item) {
          item.scrollIntoView({ block: 'center' });
          await nextFrame();
          return true;
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

(defn- journals-long-remount-metrics
  [long-block-title]
  (js-json
   (format
    "(async () => {
      const longBlockTitle = %s;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const scrollContainer = document.querySelector('#main-content-container');

      const findLongJournal = () => Array.from(document.querySelectorAll('#journals .journal-item'))
        .find((item) => item.textContent.includes(longBlockTitle));

      const waitForLongJournal = async () => {
        for (let i = 0; i < 80; i++) {
          const journal = findLongJournal();
          if (journal) {
            return journal;
          }
          await delay(100);
        }
        throw new Error('Expected long journal item');
      };

      const stableLongJournalHeight = async () => {
        let previous = null;
        let stableCount = 0;
        for (let i = 0; i < 80; i++) {
          const journal = await waitForLongJournal();
          const height = Math.round(journal.getBoundingClientRect().height);
          if (previous !== null && Math.abs(height - previous) <= 1) {
            stableCount += 1;
          } else {
            stableCount = 0;
          }
          previous = height;
          if (stableCount >= 3) {
            return height;
          }
          await delay(100);
        }
        return previous;
      };

      const snapshot = async (label) => {
        const journal = await waitForLongJournal();
        return {
          label,
          'scroll-top': Math.round(scrollContainer.scrollTop),
          'scroll-height': Math.round(scrollContainer.scrollHeight),
          'long-journal-height': Math.round(journal.getBoundingClientRect().height)
        };
      };

      const initialLongJournalHeight = await stableLongJournalHeight();
      const initial = await snapshot('initial');

      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      await delay(500);
      scrollContainer.scrollTop = 0;
      await nextFrame();
      const afterReturn = await snapshot('after-return');
      await delay(800);
      const afterSettle = await snapshot('after-settle');
      await delay(5500);
      const afterFallback = await snapshot('after-fallback');

      return JSON.stringify({
        'initial': { ...initial, 'long-journal-height': initialLongJournalHeight },
        'after-return': afterReturn,
        'after-settle': afterSettle,
        'after-fallback': afterFallback
      });
    })();"
    (json/write-value-as-string long-block-title))))

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

(deftest copy-blocks-selected-while-scrolling
  (testing "copy includes blocks selected by dragging while the page scrolls"
    (let [blocks (mapv #(format "scroll-copy-block-%02d" %) (range 1 26))]
      (b/new-blocks blocks)
      (util/exit-edit)
      (is (= (count blocks)
             (count (select-blocks-while-scrolling! (count blocks)))))
      (b/copy)
      (let [clipboard (w/clipboard-text)]
        (doseq [block blocks]
          (is (string/includes? clipboard block)))))))

(deftest multiline-heading-keeps-bullet-on-first-line
  (testing "heading block bullet aligns with the first line when the heading wraps"
    (doseq [heading (map #(str "h" %) (range 1 7))]
      (let [title (format "Multiline %s heading bullet should stay on the first visual line" heading)]
        (b/new-block title)
        (util/input-command heading)
        (util/exit-edit)
        (let [{:keys [delta] :as alignment} (multiline-heading-bullet-alignment title)]
          (is (<= delta 3) (assoc alignment :heading heading)))))))

(deftest copy-blocks-selected-while-scrolling-virtualized-list
  (testing "copy includes virtualized blocks selected by dragging while the page scrolls"
    (let [blocks (mapv #(format "virtual-scroll-copy-block-%02d" %) (range 1 31))]
      (b/new-blocks blocks)
      (util/exit-edit)
      (enable-virtualized-rendering!)
      (is (pos? (count (select-block-titles-while-scrolling! blocks))))
      (b/copy)
      (let [clipboard (w/clipboard-text)]
        (doseq [block blocks]
          (is (string/includes? clipboard block)))))))

(deftest copy-blocks-selected-after-fast-scroll-virtualized-list
  (testing "copy includes virtualized blocks selected after fast scrolling a long page"
    (let [blocks (mapv #(format "fast-scroll-copy-block-%03d" %) (range 1 101))]
      (insert-current-page-blocks! blocks)
      (enable-virtualized-rendering!)
      (is (set/subset? (set blocks)
                       (set (select-block-range-with-fast-scroll! blocks))))
      (b/copy)
      (let [clipboard (w/clipboard-text)]
        (doseq [block blocks]
          (is (string/includes? clipboard block)))))))

(deftest copy-blocks-selected-while-scrolling-journals-list
  (testing "copy includes blocks selected across virtualized journals while scrolling"
    (let [later-journal-blocks (mapv #(format "journals selection prelude block %03d %s"
                                               %
                                               (string/join " " (repeat 30 "wrapped-content")))
                                     (range 1 101))
          journals (mapv (fn [idx]
                           {:date (format "2026-02-%02dT12:00:00" idx)
                            :blocks (mapv #(format "journal %02d scroll copy block %02d" idx %)
                                          (range 1 31))})
                         (range 1 5))
          blocks (mapcat :blocks (reverse journals))]
      (seed-journals!
       [{:date "2026-03-21T12:00:00"
         :blocks later-journal-blocks}])
      (seed-journals! journals)
      (w/wait-for "#journals [data-virtuoso-scroller]")
      (scroll-journals-to-text! (first blocks))
      (is (pos? (count (select-block-titles-while-scrolling! blocks))))
      (b/copy)
      (let [clipboard (w/clipboard-text)]
        (doseq [block blocks]
          (is (string/includes? clipboard block)))))))

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
    (let [blocks (mapv #(format "journals long stable block %03d" %) (range 1 81))]
      (seed-journals!
       [{:date "2026-03-06T12:00:00"
         :blocks blocks}])
      (enable-virtualized-rendering!)
      (w/wait-for "#journals [data-virtuoso-scroller]")
      (scroll-journals-to-text! (first blocks))
      (let [{:keys [journals-scroller-count] :as metrics} (journals-layout-metrics)]
        (is (= 1 journals-scroller-count) metrics)))))

(deftest journals-list-keeps-long-journal-height-after-remount
  (testing "long journals do not restart progressive rendering from a low measured height after remount"
    (let [long-block-title "journals remount stable block 001"
          long-blocks (mapv #(format "journals remount stable block %03d %s"
                                      %
                                      (string/join " " (repeat 24 "wrapped-content")))
                            (range 1 81))
          older-journals (mapv (fn [idx]
                                  {:date (format "2026-03-%02dT12:00:00" idx)
                                   :blocks [(format "journals remount spacer block %02d" idx)]})
                                (range 1 18))]
      (seed-journals!
       (into [{:date "2026-03-20T12:00:00"
               :blocks long-blocks}]
             older-journals))
      (enable-virtualized-rendering!)
      (w/wait-for (format ".ls-page-blocks .ls-block:has-text('%s')" long-block-title))
      (let [{:keys [initial after-return after-settle after-fallback] :as metrics} (journals-long-remount-metrics long-block-title)
            initial-height (:long-journal-height initial)
            initial-scroll-height (:scroll-height initial)]
        (is (>= (:long-journal-height after-return) (dec initial-height)) metrics)
        (is (>= (:scroll-height after-return) (dec initial-scroll-height)) metrics)
        (is (>= (:long-journal-height after-settle) (dec initial-height)) metrics)
        (is (>= (:scroll-height after-settle) (dec initial-scroll-height)) metrics)
        (is (>= (:long-journal-height after-fallback) (dec initial-height)) metrics)
        (is (>= (:scroll-height after-fallback) (dec initial-scroll-height)) metrics)))))

(deftest journals-list-keeps-single-scroller-with-iframe-embeds
  (testing "iframe embeds render inside journals without adding nested virtualized measurement owners"
    (seed-journals!
     [{:date "2026-03-07T12:00:00"
       :blocks ["{{video https://www.youtube.com/watch?v=7xTGNNLPyMI}}"]}])
    (enable-virtualized-rendering!)
    (w/wait-for "#journals iframe")
    (let [{:keys [journals-scroller-count] :as metrics} (journals-layout-metrics)]
      (is (= 1 journals-scroller-count) metrics))))

(deftest journals-linked-refs-remain-visible
  (testing "journals linked refs stay visible while journals layout owns the outer measurement"
    (seed-journals-with-linked-ref!)
    (scroll-journals-to-text! "journals linked refs visible target")
    (let [{:keys [collapsed body-mounted body-height] :as metrics} (journals-linked-refs-metrics)]
      (is (false? collapsed) metrics)
      (is (true? body-mounted) metrics)
      (is (pos? body-height) metrics))))

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
    (util/press-seq " #" {:delay 20})
    (util/press-seq "Page")
    (assert/assert-is-hidden (format "#ac-0.menu-link:has-text('%s')" "Page"))))

(deftest move-blocks-mod+shift+m
  (testing "move blocks using `mod+shift+m`"
    (p/new-page "Target page")
    (p/new-page "Source page")
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (k/press "ControlOrMeta+Shift+m")
    (choose-move-target! "Target page")
    (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block" 0)))

(deftest move-blocks-cmdk
  (testing "move blocks using cmdk"
    (p/new-page "Target page 2")
    (p/new-page "Source page 2")
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (util/search-and-click "Move blocks to")
    (choose-move-target! "Target page 2")
    (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block" 0)))

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
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/enter)
    (p/goto-page "Library")
    (let [contents (set (util/get-page-blocks-contents))]
      (is (set/subset? (set ["block1" "block2" "block3"]) contents)))
    (p/goto-page "test page")
    (b/new-blocks ["block4" "block5"])
    (b/select-blocks 2)
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (k/press "ControlOrMeta+Shift+m")
    (w/fill "input[placeholder=\"Move blocks to\"]" "Library")
    (w/wait-for (w/get-by-test-id "Library"))
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/enter)
    (p/goto-page "Library")
    (let [contents (set (util/get-page-blocks-contents))]
      (is (set/subset? (set ["block1" "block2" "block3" "block4" "block5"]) contents)))))

(deftest create-nested-pages-in-library
  (testing "create nested pages in Library"
    (p/goto-page "Library")
    (b/new-blocks ["page parent" "page child"])
    (b/indent)
    (b/new-block "another nested child")
    (b/indent)))
