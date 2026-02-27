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
(def ^:private kbd-highlight (str scroll-container " [data-keyboard-highlight]"))
(def ^:private mouse-item (str scroll-container " .transition-colors.cursor-pointer"))

(defn- setup-search
  "Creates `n` pages with `prefix`, opens cmdk and types the prefix."
  [prefix n]
  (dotimes [i n] (p/new-page (str prefix i)))
  (util/search prefix)
  (util/wait-timeout 500))

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

;; ---------------------------------------------------------------------------
;; Highlight mode switching
;;
;; Cycles  keyboard → mouse → keyboard → mouse  and verifies:
;;   • keyboard mode:  [data-keyboard-highlight] = 1,  mouse-item count = 0
;;   • mouse    mode:  [data-keyboard-highlight] = 0,  mouse-item count > 0
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
;; Rapid keyboard navigation → lerp settle verification
;;
;; Goal:
;;   Verify that our lerp-based scroll animation is effective and fast enough
;;
;; Test validity prerequisite:
;;   We also check that scrollTop is 0 immediately after dispatch, confirming
;;   the scroll is animated (async via rAF), not a synchronous instant jump.
;;
;; Why JS-dispatched KeyboardEvent instead of Playwright k/arrow-down:
;;   Playwright applies a 100 ms slow-mo delay (configured in config.clj)
;;   inside k/arrow-down.  During that 100 ms, ~6 rAF frames run and lerp
;;   fully converges *inside* the call.  Any subsequent wait-timeout becomes
;;   a no-op — even 0 ms passes.  By dispatching via JS directly, we bypass
;;   slow-mo so the 120 ms wait is the ONLY time available for lerp to settle.
;;
;; Layout & numeric derivation:
;;
;;   viewport_height = 65dvh × 720 px (Playwright default) = 468 px
;;   item_height     = py-1.5 (6+6 px) + text 20 px        =  32 px
;;   group_header    = h-8                                 =  32 px
;;
;;   Visible layout (scroll container, top → bottom):
;;     Create row (no header)  32 px  → all-items index 0
;;     Nodes header (h-8)      32 px  → NOT in all-items
;;     nodes item  0  32 px  → index 1   ← 1st ArrowDown
;;     ...
;;     nodes item 15  32 px  → index 16  ← highlight after 1 + 15 ArrowDowns
;;     nodes item 16  32 px  → index 17
;;
;;   JS-dispatched ArrowDown moves index 16 → 17 (nodes item 16):
;;     top    = 32 (create) + 32 (header) + 16 × 32  = 576 px
;;     bottom = 576 + 32                             = 608 px
;;     scroll target = bottom − viewport = 608 − 468 = 140 px
;;     item visible when scrollTop ≥ 135 px  (608 − 468 − 5 tolerance)
;;
;;   lerp convergence (T=0 is JS dispatch; React re-render adds ~1 ms;
;;   rAF fires ~16 ms later, factor = 0.3 + 0.5×(diff/120), min step 1 px):
;;     T≈0  ms: scrollTop = 0      (not visible)
;;     T≈17 ms: 0   → 112          (not visible)
;;     T≈33 ms: 112 → 124          (not visible)
;;     T≈50 ms: 124 → 130          (not visible)
;;     T≈67 ms: 130 → 133          (not visible)
;;     T≈83 ms: 133 → 135.5  ✓     (visible — converged)
;;
;;   wait-timeout = 120 ms: above lerp budget (83 ms),
;;   Native smooth scroll in real browsers is estimated at ~200–300 ms,
;;   but Chrome headless completes native smooth scroll instantly.
;; ---------------------------------------------------------------------------

(deftest cmdk-rapid-keyboard-settle
  (testing "lerp animation smoothly scrolls highlight into view (faster than native smooth)"
    (setup-search "cmdklerp" 20)

    ;; Set highlighted-group, then expand (show all items).
    (k/arrow-down)
    (util/wait-timeout 100)
    (k/press "ControlOrMeta+ArrowDown")
    (util/wait-timeout 300)

    ;; Navigate far down so the next ArrowDown triggers a scroll.
    (k/press (vec (repeat 15 "ArrowDown")) {:delay 30})
    (util/wait-timeout 300)

    ;; the keyboard highlight exists and is currently in viewport (pre-scroll)
    (is (= 1 (util/count-elements kbd-highlight))
        "keyboard highlight present after navigation")

    ;; --- Prerequisite check ---
    ;; Reset scrollTop to 0, dispatch ArrowDown via JS (bypassing slow-mo),
    ;; and immediately read scrollTop.  It must still be 0, confirming the
    ;; scroll is async (rAF-based animation), which validates that the
    ;; subsequent wait-timeout is meaningful.
    (let [scroll-after-dispatch
          (w/eval-js
           (str "(() => {
                   const c   = document.querySelector('" scroll-container "');
                   const inp = document.querySelector('.cp__cmdk-search-input');
                   if (!c || !inp) return -1;
                   c.scrollTop = 0;
                   inp.dispatchEvent(
                     new KeyboardEvent('keydown',
                       {key:'ArrowDown', bubbles:true, cancelable:true}));
                   return c.scrollTop;
                 })()"))]
      (is (zero? scroll-after-dispatch)
          "scrollTop must be 0 right after dispatch (scroll is async, not instant)"))

    ;; Wait 120 ms — lerp converges in ~80-100 ms, well within this window.
    ;; Native smooth scroll in real browsers takes ~200-300 ms (estimated)
    ;; and would NOT converge in 120 ms.
    (util/wait-timeout 120)

    ;; The highlighted element must be fully within the visible scroll area,
    ;; proving lerp converged within the 120 ms budget.
    (is (true?
         (w/eval-js
          (str "(() => {
                  const el = document.querySelector('" kbd-highlight "');
                  if (!el) return false;
                  const c  = document.querySelector('" scroll-container "');
                  const cr = c.getBoundingClientRect();
                  const er = el.getBoundingClientRect();
                  return er.top >= cr.top - 5 && er.bottom <= cr.bottom + 5;
                })()")))
        "after settle, highlight is in viewport")))

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
    (is (true?
         (w/eval-js
          (str "(() => {
                  const el = document.querySelector('" kbd-highlight "');
                  if (!el) return false;
                  const c  = document.querySelector('" scroll-container "');
                  const cr = c.getBoundingClientRect();
                  const er = el.getBoundingClientRect();
                  return er.top >= cr.top - 5 && er.bottom <= cr.bottom + 5;
                })()")))
        "highlight is in viewport after navigating through lazy-visible items")))
