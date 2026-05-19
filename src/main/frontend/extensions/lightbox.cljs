(ns frontend.extensions.lightbox
  (:require [cljs-bean.core :as bean]
            [lambdaisland.glogi :as log]))

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
   handbooks/core.cljs) still benefit from the Escape swallow even
   though `roots` is empty: it preempts other global Escape hooks
   (notably `:editor/escape-editing`) so closing a preview doesn't
   also exit block-edit mode or other ambient state. The pointer
   swallow is a no-op in that case because clicks naturally land on
   `.pswp`."
  [images]
  ;; Guard against rapid double-click. Two synchronously-fired clicks
  ;; would each create a lightbox + attach window listeners; the second
  ;; assignment to `window.photoLightbox` orphans the first instance
  ;; with its listeners still bound — leaking the swallow filter and
  ;; soft-breaking outside clicks until reload.
  (when-not (some-> (.-photoLightbox js/window) (.-pswp))
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
      (.on lightbox "destroy" detach!)
      ;; If PhotoSwipe `init`/`loadAndOpen` throws, the "destroy" event never
      ;; fires, so `detach!` would never run — leaving the window listeners
      ;; attached and every Radix popper permanently `inert=true` (soft-bricks
      ;; the app). Synchronously roll back the attach! side effects, clear the
      ;; window-global so mobile/navigation doesn't act on a broken instance,
      ;; then rethrow so the failure surfaces.
      (try
        (doto lightbox
          (.init)
          (.loadAndOpen 0))
        (catch :default e
          (detach!)
          (set! (.-photoLightbox js/window) nil)
          (log/error :lightbox/init-failed {:error e})
          (throw e))))))
