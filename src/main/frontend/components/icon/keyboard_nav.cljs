(ns frontend.components.icon.keyboard-nav
  "Keyboard navigation for picker-style popovers: the flat-item/section
   model the grids navigate over, section-aware 2D movement, and the
   keyboard-nav controller component that owns the search/grid/topbar
   focus regions."
  (:require [frontend.components.icon.core :as icon-core]
            [frontend.components.icon.utils :as icon-utils]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(defn compute-flat-items
  "Compute the flat navigable item list and section metadata for the current view.
   Returns {:items [icon-item ...] :sections [{:start N :count N :cols N} ...]}."
  [tab result section-states & [{:keys [show-used?]}]]
  (let [build-sections (fn [& groups]
                         ;; Skip nil entries (callers may pass `(when cond {...})` as a group).
                         (loop [gs groups offset 0 items [] sections []]
                           (if (seq gs)
                             (let [g (first gs)
                                   its (vec (or (:items g) []))
                                   c (count its)]
                               (if (and g (pos? c))
                                 (recur (rest gs) (+ offset c)
                                        (into items its)
                                        (conj sections {:start offset :count c :cols (:cols g) :label (:label g)}))
                                 (recur (rest gs) offset items sections)))
                             {:items items :sections sections})))]
    (cond
      ;; Search results active. Tabs are content-type categories — keep the
      ;; query persistent across tabs but only show matches that fit the
      ;; current tab's type. :all shows everything, :emoji only emoji matches,
      ;; :icon only icon matches.
      (seq result)
      (let [tab-allows-emojis? (contains? #{:all :emoji} tab)
            tab-allows-icons?  (contains? #{:all :icon} tab)]
        (build-sections
         {:label "Emojis"
          :items (when (and tab-allows-emojis?
                            (seq (:emojis result))
                            (get section-states "Emojis" true))
                   (:emojis result))
          :cols icon-core/icon-grid-cols}
         {:label "Icons"
          :items (when (and tab-allows-icons?
                            (seq (:icons result))
                            (get section-states "Icons" true))
                   (:icons result))
          :cols icon-core/icon-grid-cols}))

      ;; All tab: recently used + emojis + icons (non-virtualized, limited items)
      (= tab :all)
      (build-sections
       {:label "Recently used"
        :items (when (get section-states "Recently used" true)
                 (icon-core/get-used-items))
        :cols icon-core/icon-grid-cols}
       {:label "Emojis"
        :items (when (get section-states "Emojis" true)
                 (->> (take 32 icon-utils/emojis)
                      (map (fn [emoji]
                             {:type :emoji :id (:id emoji)
                              :label (or (:name emoji) (:id emoji))
                              :data {:value (:id emoji)}}))))
        :cols icon-core/icon-grid-cols}
       {:label "Icons"
        :items (when (get section-states "Icons" true)
                 (->> (take 48 (icon-core/get-tabler-icons))
                      (map (fn [icon-name]
                             {:type :icon :id (str "icon-" icon-name)
                              :label icon-name :data {:value icon-name}}))))
        :cols icon-core/icon-grid-cols})

      ;; Emojis tab: full emoji list, optionally preceded by recently-used
      ;; emojis when :show-used? is true (reaction-picker context).
      ;; Section headers are not user-collapsible on this tab, so don't gate
      ;; on `section-states` — that key is owned by the All tab.
      (= tab :emoji)
      (build-sections
       (when show-used?
         {:label "Recently used"
          :items (->> (icon-core/get-used-items)
                      (filterv #(= :emoji (:type %))))
          :cols icon-core/icon-grid-cols})
       {:label "Emojis"
        :items (mapv (fn [emoji]
                       {:type :emoji :id (:id emoji)
                        :label (or (:name emoji) (:id emoji))
                        :data {:value (:id emoji)}})
                     icon-utils/emojis)
        :cols icon-core/icon-grid-cols})

      ;; Icons tab: full icon list
      (= tab :icon)
      (let [items (vec (map (fn [icon-name]
                              {:type :icon :id (str "icon-" icon-name)
                               :label icon-name :data {:value icon-name}})
                            (icon-core/get-tabler-icons)))]
        {:items items :sections [{:start 0 :count (count items) :cols icon-core/icon-grid-cols}]})

      :else {:items [] :sections []})))

(defn section-for-index
  "Find which section index contains the given flat index."
  [idx sections]
  (some (fn [[si sec]]
          (when (and (>= idx (:start sec))
                     (< idx (+ (:start sec) (:count sec))))
            si))
        (map-indexed vector sections)))

(defn move-grid-highlight
  "Section-aware 2D grid navigation.
   Returns new index, or nil to signal 'move to search'."
  [current-index direction sections]
  (when (and (seq sections) (some? current-index))
    (let [total (+ (:start (last sections)) (:count (last sections)))
          si (section-for-index current-index sections)]
      (when si
        (let [sec (nth sections si)
              local-idx (- current-index (:start sec))
              cols (:cols sec)
              row (quot local-idx cols)
              col (rem local-idx cols)
              n-rows (js/Math.ceil (/ (:count sec) cols))
              next-sec (fn [i] (when (< (inc i) (count sections)) (inc i)))
              prev-sec (fn [i] (when (pos? i) (dec i)))]
          (case direction
            :down
            (let [next-row (inc row)]
              (if (< next-row n-rows)
                ;; Next row in this section (clamp to last item for partial rows)
                (min (+ (:start sec) (* next-row cols) col)
                     (+ (:start sec) (dec (:count sec))))
                ;; Jump to next section, same column clamped
                (when-let [nsi (next-sec si)]
                  (let [nsec (nth sections nsi)
                        target-col (min col (dec (min (:cols nsec) (:count nsec))))]
                    (+ (:start nsec) target-col)))))

            :up
            (if (pos? row)
              ;; Previous row in this section
              (+ (:start sec) (* (dec row) cols) col)
              ;; Jump to previous section's last row, same column clamped
              (when-let [psi (prev-sec si)]
                (let [psec (nth sections psi)
                      pcols (:cols psec)
                      last-row (dec (js/Math.ceil (/ (:count psec) pcols)))
                      candidate (+ (:start psec) (* last-row pcols) col)
                      max-idx (+ (:start psec) (dec (:count psec)))]
                  (min candidate max-idx))))

            :right
            (let [next-idx (inc current-index)
                  sec-end (+ (:start sec) (:count sec))]
              (if (< next-idx sec-end)
                next-idx
                (when-let [nsi (next-sec si)]
                  (:start (nth sections nsi)))))

            :left
            (if (> current-index (:start sec))
              (dec current-index)
              (when-let [psi (prev-sec si)]
                (let [psec (nth sections psi)]
                  (+ (:start psec) (dec (:count psec))))))

            :home 0
            :end (dec total)
            nil))))))

(defn- tab-items
  "Returns the ordered tab IDs for keyboard navigation."
  []
  [:all :emoji :icon])

(hsx/defc ^:large-vars/cleanup-todo keyboard-nav-controller
  "Unified keyboard navigation controller for picker-style popovers.
   Manages three tab stops: :tabs, :search, :grid.
   Highlighting is React-props-driven (no DOM attribute manipulation).

   Options:
     :*focus-region      — atom holding :search | :grid | :tabs | nil
     :*highlighted-index — atom holding flat index into :flat-items (or nil)
     :*input-ref         — ref to the search input
     :flat-items         — flat seq of items with stable :id each
     :sections           — seq of {:start :count :cols :label} maps
     :*virtuoso-ref      — optional virtuoso scroll-container ref
     :*tab               — optional tab atom (icon-picker only; enables the
                           :tabs-region rove and, when set, gates section
                           shortcuts to fire only on the `:all` tab)
     :section-shortcuts  — optional `{keycode label}` map. When set, meta+alt+N
                           toggles the named section in `*section-states`.
                           Icon-search uses {49 \"Recently used\" 50 \"Emojis\" …}
                           and gates on `*tab = :all`; callers that don't pass
                           `*tab` fire unconditionally.
     :container-selector — CSS selector of the scoping root (default
                           `.cp__emoji-icon-picker`). Tile lookups and the
                           keydown listener are scoped to this ancestor.
     :on-escape          — called for Escape in the :tabs region (default
                           `shui/popup-hide!`)
     :topbar-selector    — optional CSS selector for a heterogeneous toolbar
                           (e.g. `.cp__emoji-icon-picker .tabs-section
                           [data-topbar-stop]`). When set, the controller
                           honors a `:topbar` focus-region: ArrowLeft/Right
                           rove DOM focus across the matched elements, Enter
                           clicks the focused one, ArrowDown/Tab/Escape return
                           to search, Shift+Tab jumps to the grid (if any)."
  [{:keys [*focus-region *highlighted-index *tab *input-ref flat-items sections
           *virtuoso-ref container-selector on-escape topbar-selector
           section-shortcuts]
    :or {container-selector ".cp__emoji-icon-picker"
         on-escape          shui/popup-hide!}}]
  (let [*el-ref (hooks/use-ref nil)
        get-cnt #(some-> (hooks/deref *el-ref) (.closest container-selector))

        focus-search! (fn []
                        (reset! *focus-region :search)
                        (reset! *highlighted-index nil)
                        (some-> (hooks/deref *input-ref) (.focus)))

        focus-grid! (fn [idx]
                      (let [idx (or idx 0)
                            idx (min idx (max 0 (dec (count flat-items))))]
                        (reset! *focus-region :grid)
                        (reset! *highlighted-index idx)
                        ;; Move DOM focus to the new tile so activeElement
                        ;; matches `.is-highlighted` — keeps the WAI-APG
                        ;; roving-focus pattern (single visible ring on the
                        ;; current tile) and ensures Enter/Space target the
                        ;; right button. data-item-id is rendered on every
                        ;; tile regardless of highlight state, so the lookup
                        ;; works against the current DOM without waiting for
                        ;; a re-render.
                        (when-let [cnt (get-cnt)]
                          (when (< idx (count flat-items))
                            (let [item-id (:id (nth flat-items idx))]
                              (when-let [^js btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                                (.focus btn)))))))

        focus-tabs! (fn [& [tab-id]]
                      ;; If the picker provided a topbar-selector, use the
                      ;; richer :topbar region (DOM rove across all topbar
                      ;; stops). Otherwise fall back to the legacy :tabs
                      ;; region (atom-mutation-only).
                      (reset! *focus-region (if topbar-selector :topbar :tabs))
                      (reset! *highlighted-index nil)
                      (when-let [cnt (get-cnt)]
                        (let [selector (if tab-id
                                         (str "[data-tab-id='" (name tab-id) "'].tab-item")
                                         "[data-active='true'].tab-item")]
                          (when-let [tab-el (.querySelector cnt selector)]
                            (.focus tab-el)))))

        select-highlighted! (fn []
                              (when-let [idx @*highlighted-index]
                                (when (< idx (count flat-items))
                                  (let [item-id (:id (nth flat-items idx))]
                                    (when-let [cnt (get-cnt)]
                                      (when-let [btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                                        (.click btn)))))))

        handle-grid-keys (fn [^js e]
                           (let [key (.-key e)
                                 code (.-keyCode e)
                                 idx (or @*highlighted-index 0)]
                             (cond
                               (or (= code 13) (= key " "))
                               (do (util/stop e) (select-highlighted!))

                               (= code 27)
                               (do (util/stop e) (focus-search!))

                               (and (= code 9) (not (.-shiftKey e)))
                               (do (util/stop e) (focus-tabs!))

                               (and (= code 9) (.-shiftKey e))
                               (do (util/stop e) (focus-search!))

                               (= code 37) ;; Left
                               (do (util/stop e)
                                   (if-let [new-idx (move-grid-highlight idx :left sections)]
                                     (focus-grid! new-idx)
                                     (focus-search!)))

                               (= code 39) ;; Right
                               (do (util/stop e)
                                   (when-let [new-idx (move-grid-highlight idx :right sections)]
                                     (focus-grid! new-idx)))

                               (= code 38) ;; Up
                               (do (util/stop e)
                                   (if-let [new-idx (move-grid-highlight idx :up sections)]
                                     (focus-grid! new-idx)
                                     (focus-search!)))

                               (= code 40) ;; Down
                               (do (util/stop e)
                                   (when-let [new-idx (move-grid-highlight idx :down sections)]
                                     (focus-grid! new-idx)))

                               (= code 36) ;; Home
                               (do (util/stop e) (focus-grid! 0))

                               (= code 35) ;; End
                               (do (util/stop e) (focus-grid! (dec (count flat-items))))

                               ;; Type-through: printable character -> redirect to search
                               (and (= 1 (count key))
                                    (not (.-metaKey e))
                                    (not (.-ctrlKey e))
                                    (not (.-altKey e)))
                               (focus-search!))))

        handle-tabs-keys (fn [^js e]
                           (let [code (.-keyCode e)
                                 tabs (tab-items)
                                 current-tab @*tab
                                 current-idx (.indexOf tabs current-tab)]
                             (cond
                               (= code 39)
                               (do (util/stop e)
                                   (let [next-idx (mod (inc current-idx) (count tabs))
                                         next-tab (nth tabs next-idx)]
                                     (reset! *tab next-tab)
                                     (focus-tabs! next-tab)))

                               (= code 37)
                               (do (util/stop e)
                                   (let [prev-idx (mod (+ current-idx (dec (count tabs))) (count tabs))
                                         prev-tab (nth tabs prev-idx)]
                                     (reset! *tab prev-tab)
                                     (focus-tabs! prev-tab)))

                               (or (= code 13) (= (.-key e) " "))
                               (util/stop e)

                               (or (= code 40) (and (= code 9) (not (.-shiftKey e))))
                               (do (util/stop e) (focus-search!))

                               (and (= code 9) (.-shiftKey e))
                               (do (util/stop e)
                                   (when (pos? (count flat-items))
                                     (focus-grid! 0)))

                               (= code 27)
                               (do (util/stop e) (on-escape)))))

        ;; Topbar region: heterogeneous mix of buttons (e.g. back, mode tabs,
        ;; trash, color swatch). Uses real DOM focus + click semantics. When
        ;; arrow-rove lands on a [role=tab] element, also auto-click so tabs
        ;; auto-activate (matches icon-picker's existing tabs-region behavior);
        ;; non-tab stops only move focus and require Enter to commit.
        handle-topbar-keys
        (fn [^js e]
          (when-let [cnt (and topbar-selector (get-cnt))]
            (let [code   (.-keyCode e)
                  stops  (vec (array-seq (.querySelectorAll cnt topbar-selector)))
                  active js/document.activeElement
                  idx    (.indexOf stops active)
                  tab? (fn [^js el] (= (.getAttribute el "role") "tab"))
                  focus! (fn [^js el]
                           (when el
                             (.focus el)
                             (when (tab? el) (.click el))))]
              (cond
                ;; Right: next stop (no wrap; stop at edge)
                (= code 39)
                (do (util/stop e)
                    (when (and (>= idx 0) (< (inc idx) (count stops)))
                      (focus! (nth stops (inc idx)))))

                ;; Left: prev stop (no wrap; stop at edge)
                (= code 37)
                (do (util/stop e)
                    (when (pos? idx)
                      (focus! (nth stops (dec idx)))))

                ;; Enter / Space: native click on focused stop
                (or (= code 13) (= (.-key e) " "))
                (do (util/stop e)
                    (when (>= idx 0) (.click (nth stops idx))))

                ;; Down / Tab: return to search
                (or (= code 40) (and (= code 9) (not (.-shiftKey e))))
                (do (util/stop e) (focus-search!))

                ;; Shift+Tab: jump into grid if any, else back to search
                (and (= code 9) (.-shiftKey e))
                (do (util/stop e)
                    (if (pos? (count flat-items))
                      (focus-grid! 0)
                      (focus-search!)))

                ;; Escape: return to search (parity with grid)
                (= code 27)
                (do (util/stop e) (focus-search!))))))

        ;; Refs for latest handler versions (avoids stale closures)
        *grid-handler-ref (hooks/use-ref handle-grid-keys)
        _ (set! (.-current *grid-handler-ref) handle-grid-keys)
        *tabs-handler-ref (hooks/use-ref handle-tabs-keys)
        _ (set! (.-current *tabs-handler-ref) handle-tabs-keys)
        *topbar-handler-ref (hooks/use-ref handle-topbar-keys)
        _ (set! (.-current *topbar-handler-ref) handle-topbar-keys)

        keydown-handler
        (hooks/use-callback
         (fn [^js e]
           (let [region @*focus-region
                 _code (.-keyCode e)]
             (if (and section-shortcuts (util/meta-key? e) (.-altKey e)
                      ;; When *tab is wired (icon-picker), restrict to the
                      ;; :all tab — other tabs render only one section.
                      ;; Callers that don't pass *tab skip the gate and the
                      ;; shortcuts fire whenever the picker has focus.
                      (or (nil? *tab) (= @*tab :all)))
               ;; Alt+meta + 1/2/3 toggles section collapse. Mac: ⌥⌘N —
               ;; Win/Linux: Ctrl+Alt+N. Labels live in `*section-states` and
               ;; are mapped per-picker via `:section-shortcuts`.
               (when-let [section-name (get section-shortcuts (.-keyCode e))]
                 (swap! icon-core/*section-states update section-name (fn [v] (if (nil? v) false (not v))))
                 (reset! *highlighted-index nil)
                 (util/stop e))
               (case region
                 :grid   ((.-current *grid-handler-ref) e)
                 :tabs   ((.-current *tabs-handler-ref) e)
                 :topbar ((.-current *topbar-handler-ref) e)
                 nil))))
         [])]

    ;; Scroll highlighted item into view (highlighting itself is React-props-driven)
    (hooks/use-effect!
     (fn []
       (when-let [idx @*highlighted-index]
         (if-let [virt (some-> *virtuoso-ref deref)]
           ;; Virtuoso: scroll to row
           (when-let [si (section-for-index idx sections)]
             (let [sec (nth sections si)
                   local-idx (- idx (:start sec))
                   row (quot local-idx (:cols sec))]
               (.scrollToIndex virt #js {:index row :align "center" :behavior "auto"})))
           ;; Non-virtualized: scrollIntoView on the button
           (when-let [cnt (get-cnt)]
             (when (< idx (count flat-items))
               (let [item-id (:id (nth flat-items idx))]
                 (when-let [btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                   (.scrollIntoView btn #js {:block "nearest" :behavior "instant"}))))))))
     [@*highlighted-index])

    ;; Attach global keydown handler
    (hooks/use-effect!
     (fn []
       (when-let [cnt (get-cnt)]
         (.addEventListener cnt "keydown" keydown-handler true)
         #(.removeEventListener cnt "keydown" keydown-handler true)))
     [])

    [:span.absolute.hidden {:ref *el-ref}]))
