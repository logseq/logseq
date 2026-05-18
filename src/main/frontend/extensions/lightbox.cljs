(ns frontend.extensions.lightbox
  (:require [cljs-bean.core :as bean]))

(defn- swallow-outside-pswp!
  "Capture-phase listener that absorbs any pointer/mouse/click event whose
   target is NOT inside `.pswp`. Used while the lightbox is mounted so
   the underlying popup (e.g. the asset picker) doesn't dismiss itself
   or route stray clicks to the app. Events inside `.pswp` pass through
   untouched, so PhotoSwipe's own controls and `bgClickAction: 'close'`
   continue to work normally."
  [^js e]
  (when-not (some-> (.-target e) (.closest ".pswp"))
    (.stopImmediatePropagation e)
    (.preventDefault e)))

(def ^:private swallow-events
  ["pointerdown" "mousedown" "click" "contextmenu"])

(defn preview-images!
  "Opens PhotoSwipe over any currently-open shui popup (e.g. the asset
   picker's hover preview).

   Three coordinated mechanisms keep the underlying popup visually open
   while the lightbox is the only interactive layer:

   1. `lightbox.css` forces `.pswp { pointer-events: auto !important }`.
      Radix's modal-mode popup sets `body.style.pointerEvents = 'none'`,
      which would otherwise cascade into PhotoSwipe and kill its
      backdrop click handler.

   2. `inert` on every Radix popper wrapper while the lightbox is open.
      Browser spec suppresses hover, focus, and pointer events on the
      inert subtree (without changing hit-testing, so the popup stays
      visible). Restored on `destroy`.

   3. Window-capture listeners for the discrete pointer/mouse/click
      events AND `keydown` (for Escape). The pointer swallow blocks
      Radix's DismissableLayer from seeing outside clicks; the Escape
      handler intercepts the key before Radix's `onEscapeKeyDown` fires
      and calls `pswp.close()` itself, so Escape closes only the
      lightbox.

   Callers without an open popup (block.cljs, pdf/assets.cljs,
   handbooks/core.cljs) are unaffected — `roots` is empty, the swallow
   has nothing to swallow because clicks naturally land on `.pswp`, and
   the Escape handler is identical to PhotoSwipe's own."
  [images]
  (let [roots (vec (js/document.querySelectorAll "[data-radix-popper-content-wrapper]"))
        _ (doseq [^js el roots] (set! (.-inert el) true))
        options {:dataSource images
                 :pswpModule js/window.PhotoSwipe
                 :showHideAnimationType "fade"}
        ^js lightbox (js/window.PhotoSwipeLightbox. (bean/->js options))
        esc-handler (fn [^js e]
                      (when (= "Escape" (.-key e))
                        (.stopImmediatePropagation e)
                        (.preventDefault e)
                        (some-> (.-pswp lightbox) (.close))))
        attach! (fn []
                  (.addEventListener js/window "keydown" esc-handler true)
                  (doseq [t swallow-events]
                    (.addEventListener js/window t swallow-outside-pswp! true)))
        detach! (fn []
                  (.removeEventListener js/window "keydown" esc-handler true)
                  (doseq [t swallow-events]
                    (.removeEventListener js/window t swallow-outside-pswp! true))
                  (doseq [^js el roots] (set! (.-inert el) false)))]
    (attach!)
    (set! (.-photoLightbox js/window) lightbox)
    (doto lightbox
      (.on "destroy" detach!)
      (.init)
      (.loadAndOpen 0))))
