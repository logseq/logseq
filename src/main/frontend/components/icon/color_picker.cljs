(ns frontend.components.icon.color-picker
  "The icon picker's color system UI: preset swatch grid, custom-color
   pane (hex input with color-name entry + ghost completion, SV pad),
   recents lane, and the topbar color trigger with its popover."
  (:require ["react-colorful" :refer [HexColorPicker]]
            [clojure.string :as string]
            [frontend.colors :as colors]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.icon-color :as icon-color]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(defn hex-color-picker [props] [:> HexColorPicker props])

(defn- same-color?
  "Semantic equality for two color values that may be hex strings, CSS
   variable expressions (`var(--rx-…)`), or nil. Both sides are
   normalized via `colors/->hex` before comparison so that e.g. a stored
   hex matches the same color expressed as a palette CSS-var.
   - (same-color? nil nil)               => true   (Default tile)
   - (same-color? \"#ec5e41\" \"var(--rx-tomato-10)\") => true
   - (same-color? \"#ff0000\" nil)             => false"
  [a b]
  (cond
    (and (nil? a) (nil? b)) true
    (or  (nil? a) (nil? b)) false
    :else (let [ha (colors/->hex a)
                hb (colors/->hex b)]
            (boolean (and ha hb (= ha hb))))))

(defn- preset-hex?
  "True when `color` matches any of the preset palette values, comparing
   in normalized-hex space so CSS-var swatch values and hex stored
   colors interoperate."
  [color preset-values]
  (boolean (and color (some #(same-color? color %) preset-values))))

(defn- custom-active?
  "True when the current color is set, non-default, and doesn't match
   any of the named presets — i.e. a custom hex picked through the
   rainbow tile."
  [color preset-values]
  (boolean (and color
                (not= color "inherit")
                (not (preset-hex? color preset-values)))))

(hsx/defc ^:large-vars/cleanup-todo color-swatches-popover
  "Popover content for the color-picker. Renders the **control column**
   (Default tile + custom-rainbow tile) on the left, a 1px vertical rule,
   then a 4×2 preset grid on the right. Auto-focuses the currently-
   selected swatch on open. Arrow keys walk the DOM-order swatch list
   linearly (Home/End jump to ends); the visual layout is responsible
   for putting the right neighbour in the right slot."
  [{:keys [colors color set-color! set-hover! on-select!
           on-hover! on-hover-end!
           on-custom-click! picker-open?]
    custom? :custom-active?}]
  (let [*parent (hooks/use-ref nil)
        ;; Split entries: first is Default (no value), rest are presets
        default-entry (first colors)
        preset-entries (vec (rest colors))
        ;; Build a 4-wide row layout: 4 + 4 = 8 presets. Pad shorter rows.
        cols 4
        rows (partition-all cols preset-entries)
        render-preset
        (fn [{value :value label :label hint :hint :as _entry}]
          (let [active? (same-color? value color)
                swatch-key (or value "none")]
            (shui/tooltip-provider
             {:key swatch-key :delay-duration 300}
             (shui/tooltip
              (shui/tooltip-trigger
               {:as-child true}
               [:button.color-swatch
                {:role "radio"
                 :aria-checked (str active?)
                 :aria-label label
                 ;; Roving tabindex: only one element is in the tab
                 ;; order at a time. Active preset wins, otherwise we
                 ;; defer to the control col tiles.
                 :tab-index (if active? "0" "-1")
                 :class (when active? "is-selected")
                 :style (when value {"--swatch-color" value})
                 :on-mouse-enter (fn []
                                   (set-hover! {:color value})
                                   (some-> on-hover! (apply [value])))
                 :on-focus (fn []
                             (set-hover! {:color value})
                             (some-> on-hover! (apply [value])))
                 :on-click (fn []
                             (set-color! value)
                             (set-hover! nil)
                             (some-> on-hover-end! (apply []))
                             (some-> on-select! (apply [value]))
                             (shui/popup-hide!))}
                [:span.swatch-fill {:style {:background-color value}}]])
              (shui/tooltip-content
               {:side "top" :align "center" :show-arrow true}
               [:div.text-center
                [:div.font-medium label]
                (when hint
                  [:div.text-xs.mt-0.5
                   {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
                   hint])])))))]

    ;; On mount: land focus on (1) selected preset, (2) custom-rainbow
    ;; if custom is active, (3) Default tile, (4) first focusable.
    ;; Deferred a tick so it runs after Radix's onOpenAutoFocus.
    (hooks/use-effect!
     (fn []
       (js/setTimeout
        (fn []
          (when-let [^js parent (hooks/deref *parent)]
            (when-let [^js btn (or (.querySelector parent ".color-swatch.is-selected")
                                   (when custom?
                                     (.querySelector parent ".color-swatch--custom"))
                                   (.querySelector parent ".color-swatch"))]
              (.focus btn))))
        0))
     [])

    [:div.color-picker-presets
     {:role "radiogroup"
      :aria-label (t :icon.color/picker-aria-label)
      :ref *parent
      :on-mouse-leave (fn []
                        (set-hover! nil)
                        (some-> on-hover-end! (apply [])))
      :on-key-down
      (fn [^js e]
        (when-let [^js parent (hooks/deref *parent)]
          (let [code      (.-keyCode e)
                ;; All swatch stops in DOM order: control[0..1] then
                ;; preset[0..7], grouped 4-per-row.
                stops     (vec (array-seq (.querySelectorAll parent ".color-swatch")))
                n         (count stops)
                active    js/document.activeElement
                idx       (.indexOf stops active)
                go!       (fn [^js el] (some-> el .focus))
                in-ctl?   (fn [i] (and (>= i 0) (< i 2)))
                in-grid?  (fn [i] (and (>= i 2) (< i n)))
                ;; Preset zone is laid out 4-wide, so col = (i-2) mod 4
                ;; and row = (i-2) div 4. There are exactly 2 preset rows.
                preset-row (fn [i] (quot (- i 2) cols))
                preset-col (fn [i] (mod  (- i 2) cols))]
            (cond
              ;; ── Right ─────────────────────────────────────────────
              (= code 39)
              (do (util/stop e)
                  (cond
                    ;; Control col → enter same-row preset col 0
                    (in-ctl? idx)
                    (let [target (+ 2 (* idx cols))]
                      (when (< target n) (go! (nth stops target))))
                    ;; Preset → next stop within the row, wrap at row end
                    (in-grid? idx)
                    (let [row (preset-row idx)
                          col (preset-col idx)
                          next-col (mod (inc col) cols)
                          target (+ 2 (* row cols) next-col)]
                      (when (< target n) (go! (nth stops target))))
                    :else
                    (go! (nth stops (mod (inc (max idx -1)) n)))))

              ;; ── Left ──────────────────────────────────────────────
              (= code 37)
              (do (util/stop e)
                  (cond
                    ;; Preset col 0 → jump to same-row control tile
                    (and (in-grid? idx) (zero? (preset-col idx)))
                    (go! (nth stops (preset-row idx)))
                    ;; Other preset → previous in-row
                    (in-grid? idx)
                    (let [row (preset-row idx)
                          col (preset-col idx)
                          prev-col (mod (dec col) cols)
                          target (+ 2 (* row cols) prev-col)]
                      (go! (nth stops target)))
                    ;; Control col → wrap to last preset of the row
                    (in-ctl? idx)
                    (let [target (+ 2 (* idx cols) (dec cols))]
                      (when (< target n) (go! (nth stops target))))
                    :else
                    (go! (nth stops (mod (dec (if (>= idx 0) idx n)) n)))))

              ;; ── Down ──────────────────────────────────────────────
              (= code 40)
              (do (util/stop e)
                  ;; When the picker pane is open, ArrowDown from the
                  ;; bottom row (or from the Custom tile) hops into the
                  ;; hex input rather than wrapping. Lets keyboard users
                  ;; flow swatches → hex without leaving via Tab.
                  (let [hop-to-pane!
                        (fn []
                          (and picker-open?
                               (when-let [^js root (.closest parent ".color-picker-popover")]
                                 (when-let [^js inp (.querySelector root ".color-picker-hex-input")]
                                   (.focus inp)
                                   true))))]
                    (cond
                      ;; Default → Custom (toggle within control col)
                      (= idx 0) (go! (nth stops 1))
                      ;; Custom → hop to hex input if pane open, else wrap
                      (= idx 1) (when-not (hop-to-pane!) (go! (nth stops 0)))
                      ;; Preset row 0 → preset row 1, same column
                      (and (in-grid? idx) (= 0 (preset-row idx)))
                      (let [target (+ 2 cols (preset-col idx))]
                        (when (< target n) (go! (nth stops target))))
                      ;; Preset row 1 → hop to hex input if open, else wrap
                      (and (in-grid? idx) (= 1 (preset-row idx)))
                      (when-not (hop-to-pane!)
                        (go! (nth stops (+ 2 (preset-col idx)))))
                      :else
                      (go! (nth stops (mod (inc (max idx -1)) n))))))

              ;; ── Up ────────────────────────────────────────────────
              (= code 38)
              (do (util/stop e)
                  (cond
                    (= idx 0) (go! (nth stops 1))
                    (= idx 1) (go! (nth stops 0))
                    (and (in-grid? idx) (= 1 (preset-row idx)))
                    (go! (nth stops (+ 2 (preset-col idx))))
                    (and (in-grid? idx) (= 0 (preset-row idx)))
                    (let [target (+ 2 cols (preset-col idx))]
                      (when (< target n) (go! (nth stops target))))
                    :else
                    (go! (nth stops (mod (dec (if (>= idx 0) idx n)) n)))))

              ;; Home: first
              (= code 36)
              (do (util/stop e) (go! (first stops)))

              ;; End: last
              (= code 35)
              (do (util/stop e) (go! (last stops)))))))}

     ;; Control column: Default tile (top), custom-rainbow tile (bottom)
     [:div.control-col
      ;; Default — corresponds to the original first entry (`:value nil`)
      (let [{value :value label :label hint :hint} default-entry
            active? (and (same-color? value color) (not custom?))]
        (shui/tooltip-provider
         {:delay-duration 300}
         (shui/tooltip
          (shui/tooltip-trigger
           {:as-child true}
           [:button.color-swatch.color-swatch--default
            {:role "radio"
             :aria-checked (str active?)
             :aria-label label
             :tab-index (if active? "0" "-1")
             :class (when active? "is-selected")
             :on-mouse-enter (fn []
                               (set-hover! {:color value})
                               (some-> on-hover! (apply [value])))
             :on-focus (fn []
                         (set-hover! {:color value})
                         (some-> on-hover! (apply [value])))
             :on-click (fn []
                         (set-color! value)
                         (set-hover! nil)
                         (some-> on-hover-end! (apply []))
                         (some-> on-select! (apply [value]))
                         (shui/popup-hide!))}
            [:span.swatch-empty
             (shui/tabler-icon "slash" {:size 14})]])
          (shui/tooltip-content
           {:side "top" :align "center" :show-arrow true}
           [:div.text-center
            [:div.font-medium label]
            (when hint
              [:div.text-xs.mt-0.5
               {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
               hint])]))))

      ;; Custom — opens the picker pane. aria-expanded reflects pane state.
      (shui/tooltip-provider
       {:delay-duration 300}
       (shui/tooltip
        (shui/tooltip-trigger
         {:as-child true}
         [:button.color-swatch.color-swatch--custom
          {:role "radio"
           :aria-checked (str (boolean custom?))
           :aria-label (t :icon.color/custom)
           :aria-expanded (str (boolean picker-open?))
           :tab-index (if custom? "0" "-1")
           :class (when custom? "is-selected")
           :on-click (fn [] (some-> on-custom-click! (apply [])))
           :on-key-down (fn [^js e]
                          (when (or (= (.-key e) "Enter")
                                    (= (.-key e) " "))
                            (.preventDefault e)
                            (some-> on-custom-click! (apply []))))}
          [:span.swatch-fill.swatch-fill--rainbow]])
        (shui/tooltip-content
         {:side "top" :align "center" :show-arrow true}
         [:div.text-center
          [:div.font-medium (t :icon.color/custom)]
          [:div.text-xs.mt-0.5
           {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
           (t :icon.color/custom-hint)]])))]

     ;; Vertical 1px rule between control col and preset grid
     [:div.divider-rule]

     ;; 4-wide × 2-row preset grid
     [:div.preset-grid
      (for [[r-idx row] (map-indexed vector rows)]
        [:div.preset-grid__row {:key (str "row-" r-idx)}
         (for [entry row]
           (render-preset entry))])]]))

;; Forward declaration: `color-picker-pane` (next) renders `recents-lane`
;; conditionally inside its body, but the recents-lane defn lives below
;; for readability. Declaring silences the :undeclared-var warning.
(declare recents-lane)

(def ^:private placeholder-hex
  "Neutral grey-blue used in two no-input surfaces: the hex input's
   placeholder ghost text (\"example of expected format\") and the
   react-colorful SV pad's starting position when no color is set yet.
   The a1/b2/c3 alphabetical pattern is the self-documentation —
   it's a memorable demo value, not a designed color."
  "#a1b2c3")

(hsx/defc ^:large-vars/cleanup-todo color-picker-pane
  "Custom-color picker pane shown below the swatch grid when the user
   clicks the rainbow tile. Hosts a hex input + react-colorful's
   HexColorPicker (combined SV pad + hue slider). Animates open/close
   via the CSS-Grid 0fr↔1fr trick."
  [{:keys [color hex-input set-hex-input!
           hex-invalid? set-hex-invalid!
           set-hover! on-hover! _on-hover-end!
           on-commit! on-escape!
           recents
           open?]}]
  (let [*hex-ref (hooks/use-ref nil)
        *pane-ref (hooks/use-ref nil)
        *pad-ref (hooks/use-ref nil)
        ;; Subscribe to the lazy XKCD module's ready flag so an in-flight
        ;; load repaints the ghost completion without another keystroke.
        _named-ready? (hooks/use-atom colors/*named-ready?)
        ;; Resolve the typed value once. `:hex` is the canonical hex when
        ;; resolution succeeds (any kind of match). `picked` reflects only
        ;; exact-resolvable values for purposes of contrast indicator.
        resolved (colors/resolve-color hex-input)
        active-color (or (:hex resolved) color placeholder-hex)
        ;; Compute the contrast-adjusted hex for BOTH light and dark themes
        ;; against canonical surfaces. This lets the indicator surface how
        ;; the pick will render in EACH mode, not just the current one — so
        ;; the user notices cross-theme issues at pick time.
        picked (:hex resolved)
        both-themes (when picked (colors/adjust-for-both-themes picked))
        adjusted? (boolean (:differs? both-themes))
        ;; Ghost suffix: alphabetically-first XKCD prefix completion. nil
        ;; when input is empty / hex / exact match / no candidate.
        ghost (colors/prefix-completion hex-input)
        ;; Capture the input's resolved CSS font shorthand once after mount.
        ;; Used by `colors/measure-text-px` to position the ghost <span>.
        [input-font set-input-font!] (hooks/use-state nil)]
    ;; When the pane opens, autofocus the hex input.
    (hooks/use-effect!
     (fn []
       (when open?
         (js/setTimeout
          (fn []
            (when-let [^js el (hooks/deref *hex-ref)]
              (.focus el)
              (.select el)))
          80)))
     [open?])
    ;; Capture the input's computed font once on mount so the ghost can be
    ;; measured with pixel-perfect alignment.
    (hooks/use-effect!
     (fn []
       (when-let [^js el (hooks/deref *hex-ref)]
         (set-input-font! (.-font (js/getComputedStyle el)))))
     [])
    ;; Strip react-colorful's two interactive sliders (SV pad + hue) from
    ;; the Tab order. The library hard-codes `tabIndex={0}` on them and
    ;; offers no prop to opt out. Mouse/touch interaction is unaffected.
    ;; Keyboard users navigate swatches → hex → recents directly via
    ;; Tab/Shift+Tab and arrow shortcuts; the pad is mouse/touch only.
    (hooks/use-effect!
     (fn []
       (when-let [^js root (hooks/deref *pad-ref)]
         (doseq [^js node (array-seq (.querySelectorAll root ".react-colorful__interactive"))]
           (.setAttribute node "tabindex" "-1"))))
     [])
    ;; Tab guard for the collapse animation. The pane stays in the DOM
    ;; while CSS Grid animates from 1fr→0fr, so its hex input + pad +
    ;; recents would otherwise remain in the focus tree even when not
    ;; visible. `inert` removes them; toggling via effect keeps the
    ;; data-open transition in sync.
    (hooks/use-effect!
     (fn []
       (when-let [^js el (hooks/deref *pane-ref)]
         (set! (.-inert el) (not open?))))
     [open?])
    [:div.color-picker-pane
     {:ref *pane-ref
      :data-open (str (boolean open?))}
     [:div.color-picker-pane__inner
      ;; Hex input row
      [:div.color-picker-hex-row
       [:input.color-picker-hex-input
        {:ref *hex-ref
         :type "text"
         :value (or hex-input "")
         :placeholder placeholder-hex
         :spell-check false
         :auto-complete "off"
         :aria-label (t :icon.color/hex-aria-label)
         :aria-invalid (str (boolean hex-invalid?))
         :class (when hex-invalid? "is-invalid")
         :on-change (fn [^js e]
                      (let [v (.. e -target -value)
                            r (colors/resolve-color v)]
                        (set-hex-input! v)
                        ;; Mid-typing: clear invalid flag if the new value
                        ;; could still become a valid hex on commit.
                        (when hex-invalid?
                          (set-hex-invalid! false))
                        ;; Live-preview when the value resolves (any match
                        ;; kind: hex, css, exact, OR prefix). Prefix matches
                        ;; preview but won't commit until promoted/exact.
                        ;; `set-hover!` drives the picker grid's local
                        ;; tint; `on-hover!` propagates to the page icon
                        ;; rendered outside the popover.
                        (when-let [hex (:hex r)]
                          (set-hover! {:color hex})
                          (some-> on-hover! (apply [hex])))))
         :on-blur (fn [_e]
                    (let [r (colors/resolve-color hex-input)]
                      (if (and r (contains? #{:hex :css :exact} (:match r)))
                        (do (set-hex-input! (:hex r))
                            (set-hex-invalid! false))
                        (when (and hex-input
                                   (not (string/blank? hex-input)))
                          (set-hex-invalid! true)))))
         :on-key-down (fn [^js e]
                        (cond
                          (= (.-key e) "Enter")
                          (let [r (colors/resolve-color hex-input)]
                            (if (and r (contains? #{:hex :css :exact} (:match r)))
                              (do (.preventDefault e)
                                  (set-hex-input! (:hex r))
                                  (set-hex-invalid! false)
                                  (some-> on-commit! (apply [(:hex r)])))
                              (set-hex-invalid! true)))

                          (= (.-key e) "Escape")
                          (do (.preventDefault e)
                              (some-> on-escape! (apply [])))

                          ;; Tab promotes ghost to full match (when ghost
                          ;; visible). When no ghost, default Tab (focus
                          ;; next) is preserved.
                          (and (= (.-key e) "Tab")
                               (not (.-shiftKey e))
                               (some? ghost))
                          (let [full (:full ghost)
                                hex (:hex ghost)]
                            (.preventDefault e)
                            (set-hex-input! full)
                            (set-hex-invalid! false)
                            (when hex
                              (set-hover! {:color hex})
                              (some-> on-hover! (apply [hex]))))

                          ;; ArrowRight at end of input promotes ghost.
                          ;; Otherwise default cursor move is preserved.
                          (and (= (.-key e) "ArrowRight")
                               (some? ghost)
                               (let [^js el (.-target e)]
                                 (and (= (.-selectionStart el)
                                         (.-selectionEnd el))
                                      (= (.-selectionStart el)
                                         (count hex-input)))))
                          (let [full (:full ghost)
                                hex (:hex ghost)]
                            (.preventDefault e)
                            (set-hex-input! full)
                            (set-hex-invalid! false)
                            (when hex
                              (set-hover! {:color hex})
                              (some-> on-hover! (apply [hex]))))

                          ;; ArrowUp → focus the swatches grid. Lands on
                          ;; the active swatch when one is selected, else
                          ;; the custom-rainbow tile. Single-line input
                          ;; has no meaningful Up cursor target, so we
                          ;; reclaim the key for cross-region nav.
                          (= (.-key e) "ArrowUp")
                          (when-let [^js root (some-> (.-target e)
                                                      (.closest ".color-picker-popover"))]
                            (when-let [^js btn (or (.querySelector root ".color-swatch.is-selected")
                                                   (.querySelector root ".color-swatch--custom"))]
                              (.preventDefault e)
                              (.focus btn)))

                          ;; ArrowDown → focus the first recent. Skips
                          ;; the SV pad / hue slider (which sit outside
                          ;; the Tab order). No-op when no recents exist.
                          (and (= (.-key e) "ArrowDown") (seq recents))
                          (when-let [^js root (some-> (.-target e)
                                                      (.closest ".color-picker-popover"))]
                            (when-let [^js btn (.querySelector root
                                                               ".color-picker-recents__row .color-swatch--recent")]
                              (.preventDefault e)
                              (.focus btn)))))}]
       ;; Ghost suffix: muted suggestion text rendered after the typed
       ;; value when a prefix completion exists. Hidden when the input is
       ;; in an invalid state to avoid noise.
       (when (and ghost (not hex-invalid?))
         (let [typed-width (when input-font
                             (colors/measure-text-px input-font (or hex-input "")))]
           [:span.color-picker-hex-input-ghost
            {:aria-hidden "true"
             :style (when typed-width
                      {:left (str "calc(10px + " typed-width "px)")})}
            (:suffix ghost)]))
       ;; Contrast indicator: visible when the picked hex would render
       ;; differently in EITHER light or dark theme. Shows a half-pie
       ;; preview — left half = dark mode rendered color, right half =
       ;; light mode rendered color — matching the recents lane's split
       ;; swatch motif. Tooltip explains both adjusted hexes.
       (when adjusted?
         (let [{:keys [light dark]} both-themes
               picked-name (some-> picked colors/hex->name colors/humanize-name)]
           (shui/tooltip-provider
            {:delay-duration 200}
            (shui/tooltip
             (shui/tooltip-trigger
              {:as-child true}
              [:span.color-picker-contrast-indicator
               {:aria-label (t :icon.color/contrast-aria-label
                               (or picked-name picked) dark light)}
               [:span.contrast-split-swatch
                {:style {"--dark-color" dark
                         "--light-color" light}}]])
             (shui/tooltip-content
              {:side "top" :align "center" :show-arrow true}
              [:div
               ;; Title: picked color name if reverse-lookup hits, else
               ;; the generic "Contrast adjusted".
               [:div.text-sm.font-medium (or picked-name (t :icon.color/contrast-title))]
               [:div.text-xs.opacity-70.mt-1
                [:div.flex.items-center.gap-1.5
                 [:span.contrast-tooltip-dot {:style {:background-color dark}}]
                 [:span (str (t :icon.color/contrast-dark-label) " ")] [:span.font-mono dark]]
                [:div.flex.items-center.gap-1.5.mt-0.5
                 [:span.contrast-tooltip-dot {:style {:background-color light}}]
                 [:span (str (t :icon.color/contrast-light-label) " ")] [:span.font-mono light]]]])))))]

      ;; SV pad + Hue slider via react-colorful's HexColorPicker
      [:div.color-picker-pad-row
       {:ref *pad-ref}
       (hex-color-picker
        {:color active-color
         :on-change (fn [^js hex]
                      (let [hex (string/lower-case hex)]
                        (set-hex-input! hex)
                        (set-hex-invalid! false)
                        ;; `set-hover!` drives the picker grid's local
                        ;; tint; `on-hover!` propagates the live drag
                        ;; preview to the page icon outside the popover.
                        (set-hover! {:color hex})
                        (some-> on-hover! (apply [hex]))))
         :on-mouse-up (fn [_e]
                        (when-let [hex (colors/parse-hex hex-input)]
                          (some-> on-commit! (apply [hex]))))
         :on-touch-end (fn [_e]
                         (when-let [hex (colors/parse-hex hex-input)]
                           (some-> on-commit! (apply [hex]))))})]
      ;; Recents lane lives inside the pane so it shares the popover bg
      ;; pocket and animates in/out with the pane reveal.
      (when (seq recents)
        (recents-lane
         {:recents recents
          :hex-input hex-input
          :color color
          :set-hover! set-hover!
          :on-hover! on-hover!
          :on-select! on-commit!
          :on-escape! on-escape!
          :on-up! (fn []
                    (when-let [^js el (hooks/deref *hex-ref)]
                      (.focus el)
                      (.select el)))
          :on-down! (fn []
                      (when-let [^js root (some-> (hooks/deref *pane-ref)
                                                  (.closest ".color-picker-popover"))]
                        (when-let [^js btn (or (.querySelector root ".color-swatch.is-selected")
                                               (.querySelector root ".color-swatch--custom")
                                               (.querySelector root ".color-swatch"))]
                          (.focus btn))))}))]]))

(hsx/defc ^:large-vars/cleanup-todo recents-lane
  "Horizontal row of recently-used custom colors (cap: `frontend.handler.icon-color/max-recents`).
   Header label matches existing pane-section typography (12px Inter Medium muted).

   Keyboard model: roving tabindex (one Tab stop into the row, arrows
   rove within). ArrowUp leaves to the hex input; ArrowDown wraps to
   the swatches grid (closing the vertical loop). Escape collapses the
   pane back to the swatches grid."
  [{:keys [recents color on-select! set-hover! on-hover!
           on-escape! on-up! on-down!]}]
  (when (seq recents)
    (let [*parent (hooks/use-ref nil)
          ;; Active recent index for roving tabindex. Default 0 so the
          ;; first Tab into the row lands on the leftmost swatch.
          [active-idx set-active-idx!] (hooks/use-state 0)]
      [:div.color-picker-recents
       [:div.color-picker-recents__header (t :icon.color/recents-title)]
       [:div.color-picker-recents__row
        {:ref *parent
         :role "radiogroup"
         :aria-label (t :icon.color/recents-aria-label)
         :on-key-down
         (fn [^js e]
           (when-let [^js parent (hooks/deref *parent)]
             (let [stops   (vec (array-seq (.querySelectorAll parent ".color-swatch--recent")))
                   n       (count stops)
                   ;; Recents flex-wrap into rows of 7 (CSS-driven). Detect
                   ;; the visual row width by counting how many leading
                   ;; stops share the first stop's offsetTop — robust even
                   ;; if the row width changes later.
                   cols    (if (zero? n)
                             0
                             (let [first-top (.-offsetTop ^js (first stops))]
                               (count (take-while #(= (.-offsetTop ^js %) first-top) stops))))
                   focused js/document.activeElement
                   idx     (max 0 (.indexOf stops focused))
                   row     (if (pos? cols) (quot idx cols) 0)
                   col     (if (pos? cols) (mod idx cols) idx)
                   row-start (* row cols)
                   row-end   (min (+ row-start cols) n)
                   row-width (- row-end row-start)
                   go!     (fn [i]
                             (set-active-idx! i)
                             (some-> ^js (nth stops i) .focus))]
               (cond
                 ;; Left/Right wrap WITHIN the current row only.
                 (= (.-key e) "ArrowLeft")
                 (do (util/stop e)
                     (go! (+ row-start (mod (dec col) row-width))))

                 (= (.-key e) "ArrowRight")
                 (do (util/stop e)
                     (go! (+ row-start (mod (inc col) row-width))))

                 (= (.-key e) "Home")
                 (do (util/stop e) (go! 0))

                 (= (.-key e) "End")
                 (do (util/stop e) (go! (dec n)))

                 ;; ArrowUp: previous row at same column, or escape to
                 ;; hex input when already in the top row.
                 (= (.-key e) "ArrowUp")
                 (do (util/stop e)
                     (if (pos? row)
                       (go! (+ (* (dec row) cols) col))
                       (some-> on-up! (apply []))))

                 ;; ArrowDown: next row at same column (clamped to last
                 ;; available when the row is partial), or escape to the
                 ;; swatches grid when there's no row below.
                 (= (.-key e) "ArrowDown")
                 (let [next-row-start (* (inc row) cols)]
                   (util/stop e)
                   (if (< next-row-start n)
                     (let [next-row-end (min (+ next-row-start cols) n)]
                       (go! (min (+ next-row-start col) (dec next-row-end))))
                     (some-> on-down! (apply []))))

                 ;; Escape collapses the pane (same callback the hex
                 ;; input uses) so the user can back out of the picker
                 ;; from any region.
                 (= (.-key e) "Escape")
                 (do (util/stop e) (some-> on-escape! (apply [])))))))}
        (for [[i hex] (map-indexed vector recents)]
          (let [{:keys [light dark differs?]} (or (colors/adjust-for-both-themes hex)
                                                  {:light hex :dark hex :differs? false})
                picked-name (some-> hex colors/hex->name colors/humanize-name)
                checked? (same-color? hex color)]
            (shui/tooltip-provider
             {:key hex :delay-duration 300}
             (shui/tooltip
              (shui/tooltip-trigger
               {:as-child true}
               [:button.color-swatch.color-swatch--recent
                {:role "radio"
                 :aria-checked (str (boolean checked?))
                 :aria-label (or picked-name hex)
                 :tab-index (if (= i active-idx) "0" "-1")
                 :class (when checked? "is-selected")
                 :on-mouse-enter (fn []
                                   (when set-hover!
                                     (set-hover! {:color hex}))
                                   (some-> on-hover! (apply [hex])))
                 :on-focus (fn []
                             (set-active-idx! i)
                             (when set-hover!
                               (set-hover! {:color hex}))
                             (some-> on-hover! (apply [hex])))
                 :on-click (fn [] (some-> on-select! (apply [hex])))}
                ;; Half-pie split: left half = dark-mode rendering, right
                ;; half = light-mode rendering. When picked needs no
                ;; adjustment in either mode, both halves match and the
                ;; swatch reads as a solid circle.
                [:span.swatch-fill
                 {:class (when differs? "is-split")
                  :style {"--dark-color" dark
                          "--light-color" light}}]])
              (shui/tooltip-content
               {:side "top" :align "center" :show-arrow true}
               [:div.text-center
                ;; Title: humanized name when reverse-lookup hits, else
                ;; the picked hex itself.
                [:div.font-medium (or picked-name hex)]
                ;; Dual-mode hex display only when the picked color
                ;; renders differently across themes.
                (when differs?
                  [:div.text-xs.opacity-70.mt-0.5
                   [:div.flex.items-center.gap-1.justify-center
                    [:span.font-mono dark] [:span "·"] [:span.font-mono light]]])])))))]])))

(hsx/defc color-picker-popover
  "Whole popover body: swatch grid + animated picker pane + recents lane.
   Owns the local picker-mode / hex-input / hex-invalid? / recents state
   so it survives across pane open/close and recent-color picks while
   the popup remains mounted."
  [{:keys [colors color set-color! set-hover!
           on-select! on-hover! on-hover-end!]}]
  (let [preset-values (->> colors (map :value) (filter some?) vec)
        ;; Normalize incoming `color` to hex when it arrives as a CSS-variable
        ;; expression (e.g. "var(--rx-gray-09)"). Without this, the swatch
        ;; comparison treats the literal string as a "custom" color and opens
        ;; the SV pad expanded with an unparsable hex-input value.
        color (if (and (string? color)
                       (string/starts-with? color "var("))
                (or (colors/->hex color) color)
                color)
        custom? (custom-active? color preset-values)
        [picker-mode set-picker-mode!] (hooks/use-state (if custom? :custom :presets))
        [hex-input set-hex-input!]     (hooks/use-state (when custom? color))
        [hex-invalid? set-hex-invalid!] (hooks/use-state false)
        [recents set-recents!]         (hooks/use-state [])
        open? (= picker-mode :custom)
        ;; Ref captures the latest hex-input + committed color so the unmount
        ;; cleanup sees current values (the cleanup closure has empty deps).
        *latest (hooks/use-ref nil)
        commit! (fn [hex]
                  (icon-color/add-recent! hex)
                  (set-recents! (icon-color/get-recents))
                  (set-color! hex)
                  (set-hover! nil)
                  (some-> on-hover-end! (apply []))
                  (some-> on-select! (apply [hex]))
                  (shui/popup-hide!))
        focus-rainbow! (fn []
                         (js/setTimeout
                          (fn []
                            (when-let [^js btn (js/document.querySelector
                                                ".color-swatch--custom")]
                              (.focus btn)))
                          0))]
    ;; Refresh recents on mount.
    (hooks/use-effect!
     (fn []
       (set-recents! (icon-color/get-recents)))
     [])
    ;; Track the latest hex-input + color for the unmount cleanup.
    (hooks/use-effect!
     (fn []
       (hooks/set-ref! *latest {:hex-input hex-input :color color}))
     [hex-input color])
    ;; Commit pending hex on unmount (e.g. user dragged the SV pad then
    ;; clicked outside the popover without releasing inside it — the
    ;; on-mouse-up never fires for outside-bounds releases since react-
    ;; colorful uses document-level pointer listeners).
    (hooks/use-effect!
     (fn []
       (fn []
         (let [{:keys [hex-input color]} (hooks/deref *latest)
               hex (colors/parse-hex hex-input)]
           (when (and hex (not= hex color))
             (icon-color/add-recent! hex)
             (set-color! hex)
             (some-> on-select! (apply [hex]))))))
     [])
    [:div.color-picker-popover
     (color-swatches-popover
      {:colors colors
       :color color
       :set-color! set-color!
       :set-hover! set-hover!
       :on-select! on-select!
       :on-hover! on-hover!
       :on-hover-end! on-hover-end!
       :custom-active? custom?
       :picker-open? open?
       :on-custom-click! (fn []
                           (set-picker-mode! (if open? :presets :custom)))})
     (color-picker-pane
      {:color (when custom? color)
       :hex-input hex-input
       :set-hex-input! set-hex-input!
       :hex-invalid? hex-invalid?
       :set-hex-invalid! set-hex-invalid!
       :set-hover! set-hover!
       :on-hover! on-hover!
       :on-hover-end! on-hover-end!
       :on-commit! commit!
       :on-escape! (fn []
                     (set-picker-mode! :presets)
                     (set-hex-invalid! false)
                     (focus-rainbow!))
       :recents recents
       :open? open?})]))

(hsx/defc ^:large-vars/cleanup-todo color-picker
  [*color on-select! & {:keys [on-hover! on-hover-end! button-attrs after-close! popup-id]}]
  (let [;; Defensive: never let the CSS sentinel "inherit" leak into React state.
        initial-color (let [v @*color] (when (and v (not= v "inherit")) v))
        [color, set-color!] (hooks/use-state initial-color)
        [hover, set-hover!] (hooks/use-state nil)
        ;; hover is nil = not hovering, or {:color X} where X may be nil ("no color")
        effective-color (if hover (:color hover) color)
        *el (hooks/use-ref nil)
        palette [{:value nil :label "Default"
                  :hint "Inherits the surrounding text color"}
                 {:value (colors/variable :gray :09)   :label "Gray"}
                 {:value (colors/variable :indigo :10) :label "Indigo"}
                 {:value (colors/variable :cyan :10)   :label "Cyan"}
                 {:value (colors/variable :green :10)  :label "Green"}
                 {:value (colors/variable :orange :10) :label "Orange"}
                 {:value (colors/variable :tomato :10) :label "Tomato"}
                 {:value (colors/variable :pink :10)   :label "Pink"}
                 {:value (colors/variable :red :10)    :label "Red"}]
        content-fn (fn []
                     (color-picker-popover
                      {:colors palette
                       :color color
                       :set-color! set-color!
                       :set-hover! set-hover!
                       :on-select! on-select!
                       :on-hover! on-hover!
                       :on-hover-end! on-hover-end!}))]
    ;; Display effect on the picker root — fires for both hover and committed
    ;; color. Combined with the per-cell `--r`/`--c` `transition-delay` in CSS,
    ;; every change to the var (hover preview OR commit) plays the diagonal
    ;; wave across the grid. Rapid hover sweeps gracefully retarget mid-flight
    ;; because each cell's delay holds its current value until activation.
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (hooks/deref *el) (.closest ".cp__emoji-icon-picker"))]
         ;; Contrast surface = the popover's elevated background (one level
         ;; above the page bg). The icon-picker grid renders against this
         ;; surface, so contrast must be measured here, not against the page.
         (let [raw        (if (string/blank? effective-color) "inherit" effective-color)
               popover-bg (colors/read-bg-var "--ls-secondary-background-color")
               c          (if (and (string/starts-with? raw "#") popover-bg)
                            (colors/adjust-for-contrast raw popover-bg 3.0)
                            raw)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" c)
           (if (= c "inherit")
             (.remove (.-classList picker) "icon-colored")
             (.add (.-classList picker) "icon-colored")))))
     [effective-color])
    ;; Commit effect — only fires on actual selection. Persists + propagates to *color.
    ;; Accept hex strings, `var(--rx-…)` palette expressions (so preset swatch
    ;; picks persist with theme-responsive colors), and the "inherit" sentinel.
    ;; Other shapes (free-form CSS vars, arbitrary strings) are rejected so they
    ;; can't poison later picker opens.
    (hooks/use-effect!
     (fn []
       (let [c (if (string/blank? color) "inherit" color)]
         (when (or (= c "inherit")
                   (and (string? c)
                        (or (re-matches #"#[0-9a-fA-F]{6}" c)
                            (re-matches #"var\(--rx-[A-Za-z0-9_-]+\)" c))))
           (storage/set :ls-icon-color-preset c)))
       (reset! *color color))
     [color])
    ;; Cleanup — clear external preview when picker unmounts.
    (hooks/use-effect!
     (fn []
       (fn []
         (some-> on-hover-end! (apply []))))
     [])

    [:button.color-picker-trigger
     (merge button-attrs
            {:ref *el
             :on-click (fn [^js e]
                         (shui/popup-show!
                          (.-target e) content-fn
                          (cond-> {;; Disable shui's own focus-restore (a 16ms
                                   ;; setTimeout in popup/core.cljs:107-111 that
                                   ;; .focuses `.closest("[tabindex='0']")` of
                                   ;; the trigger). For our color trigger that
                                   ;; resolves to the active tab in the icon
                                   ;; picker's topbar (roving tabindex), which
                                   ;; would override the picker's manual focus
                                   ;; placement after color commit.
                                   :focus-trigger? false
                                   :content-props
                                   {:side "bottom"
                                    :side-offset 6
                                    ;; Also prevent Radix's default focus-restore
                                    ;; on close. By default it focuses *shui's*
                                    ;; hidden floating trigger button (rendered
                                    ;; at body level), outside the icon picker
                                    ;; subtree → capture-phase keydown listener
                                    ;; stops receiving arrow keys.
                                    :onCloseAutoFocus (fn [^js e]
                                                        (.preventDefault e)
                                                        (some-> after-close! (apply [])))}}
                            ;; Caller-supplied id lets external code recognize
                            ;; or dismiss this popover by name (icon-search passes
                            ;; :icons-color-picker so the block context-menu's
                            ;; set-icon submenu knows to stay open under it).
                            popup-id (assoc :id popup-id))))})
     (if color
       ;; Mirror the recents-lane swatch: when the picked color renders
       ;; differently in light vs dark themes, split the trigger fill into
       ;; a half-pie (dark left / light right) so the cross-mode behavior
       ;; is visible at a glance — even before the popover is opened.
       (let [{:keys [light dark differs?]} (or (colors/adjust-for-both-themes color)
                                               {:light color :dark color :differs? false})]
         [:span.color-picker-fill
          {:class (when differs? "is-split")
           :style {:background-color (when-not differs? color)
                   "--dark-color" dark
                   "--light-color" light}}])
       [:span.color-picker-empty
        (shui/tabler-icon "slash" {:size 12})])]))

