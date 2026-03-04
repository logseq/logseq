(ns logseq.e2e.cmdk-scroll-basic-test
  "E2E tests for Cmd+K scroll & highlight behavior."
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(def ^:private scroll-container ".cp__cmdk .overflow-y-auto")
(def ^:private kbd-highlight (str scroll-container " [data-kb-highlighted]"))
(def ^:private mouse-item (str scroll-container " .transition-colors.cursor-pointer"))

(defn- setup-search
  "Creates `n` pages with `prefix` and `suffix`, opens cmdk and types the `prefix`."
  ([prefix n] (setup-search prefix n ""))
  ([prefix n suffix]
   [prefix n suffix]
   (dotimes [i n] (p/new-page (str prefix i suffix)))
   (util/search prefix)
   (util/wait-timeout 500)))

(defn- simulate-mouse-move-into-results!
  "Dispatches a synthetic mousemove with non-zero movementX/Y on a result item.
   Playwright's CDP mouse.move does not populate movementX/Y, so we must
   construct the event in JS and patch those read-only fields."
  []
  (w/eval-js
   (str "(() => {
           const c = document.querySelector('" scroll-container "');
           if (!c) return;
           const items = c.querySelectorAll('.transition-colors');
           const target = items[2] || items[0] || c;
           const rect = target.getBoundingClientRect();
           const evt = new MouseEvent('mousemove', {
             bubbles: true, cancelable: true,
             clientX: rect.x + rect.width / 2,
             clientY: rect.y + rect.height / 2
           });
           Object.defineProperty(evt, 'movementX', {value: 5});
           Object.defineProperty(evt, 'movementY', {value: 3});
           target.dispatchEvent(evt);
         })()")))

(defn- kbd-highlight-in-viewport?
  "Returns true when the keyboard-highlighted element is fully within
   the visible scroll area.  Allows ±5 px tolerance for borders/padding."
  []
  (w/eval-js
   (str "(() => {
           const el = document.querySelector('" kbd-highlight "');
           if (!el) return false;
           const c  = document.querySelector('" scroll-container "');
           const cr = c.getBoundingClientRect();
           const er = el.getBoundingClientRect();
           return er.top >= cr.top - 5 && er.bottom <= cr.bottom + 5;
         })()")))

;; ---------------------------------------------------------------------------
;; Highlight mode switching
;;
;; Cycles  keyboard → mouse → keyboard → mouse  and verifies:
;;   • keyboard mode:  [data-kb-highlighted] = 1,  mouse-item count = 0
;;   • mouse    mode:  [data-kb-highlighted] = 0,  mouse-item count > 0
;; ---------------------------------------------------------------------------

(deftest cmdk-highlight-mode-switching
  (testing "keyboard & mouse highlight mode toggles correctly"
    (setup-search "cmdkhighlight" 8)

    (dotimes [_ 3] (k/arrow-down))
    (util/wait-timeout 100)
    (is (= 1 (util/count-elements kbd-highlight))
        "keyboard mode → keyboard-highlight = 1")
    (is (= 0 (util/count-elements mouse-item))
        "keyboard mode → mouse-mode items = 0")

    (simulate-mouse-move-into-results!)
    (util/wait-timeout 200)
    (is (= 0 (util/count-elements kbd-highlight))
        "mouse mode → keyboard-highlight = 0")
    (is (pos? (util/count-elements mouse-item))
        "mouse mode → mouse-mode items > 0")

    (k/arrow-down)
    (util/wait-timeout 100)
    (is (= 1 (util/count-elements kbd-highlight))
        "keyboard mode again → keyboard-highlight = 1")
    (is (= 0 (util/count-elements mouse-item))
        "keyboard mode again → mouse-mode items = 0")

    (simulate-mouse-move-into-results!)
    (util/wait-timeout 200)
    (is (= 0 (util/count-elements kbd-highlight))
        "mouse mode again → keyboard-highlight = 0")
    (is (pos? (util/count-elements mouse-item))
        "mouse mode again → mouse-mode items > 0")))

;; ---------------------------------------------------------------------------
;; Lazy-visible keyboard scroll verification
;;
;; Goal:
;;   Verify that keyboard navigation scrolls correctly through :nodes items
;;   that are wrapped in lazy-visible (always active for :nodes group).
;;   This exercises the data-item-index wrapper-div DOM query path in
;;   move-highlight, which finds the wrapper even when the inner list-item
;;   has not yet been mounted by IntersectionObserver.
;;
;; Layout:
;;   viewport_height = 65dvh × 720 px (Playwright default) = 468 px
;;   item_height ≈ 32 px,  group_header = 32 px
;;   Create (32) + nodes header (32) + 30 nodes items (30 × 32 = 960)
;;     = 1024 px total — significantly exceeds viewport
;;   Navigating 20 items → top ≈ 32 + 32 + 20×32 = 704 px
;;     → far below viewport bottom (468 px), deep into lazy territory
;; ---------------------------------------------------------------------------

(deftest cmdk-lazy-visible-keyboard-scroll
  (testing "keyboard navigation scrolls through lazy-visible :nodes items"
    (setup-search "cmdklazy" 30)

    ;; Expand :nodes group — sets :show :more.
    (k/arrow-down)
    (util/wait-timeout 100)
    (k/press "ControlOrMeta+ArrowDown")
    (util/wait-timeout 300)

    ;; Navigate down 20 steps — well past the viewport into lazy items.
    (k/press (vec (repeat 20 "ArrowDown")) {:delay 30})
    (util/wait-timeout 300)

    ;; Verify keyboard highlight exists.
    (is (= 1 (util/count-elements kbd-highlight))
        "keyboard highlight present after navigating through lazy items")

    ;; Verify the highlighted element is within the visible scroll area.
    (is (kbd-highlight-in-viewport?) "highlight is in viewport after navigating through lazy-visible items")))
