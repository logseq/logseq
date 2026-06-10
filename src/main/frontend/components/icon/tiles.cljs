(ns frontend.components.icon.tiles
  "Tile components for the icon-picker grids: emoji and tabler tiles, the
   per-type dispatcher, section headers, and the (optionally virtualized)
   pane-section grid."
  (:require [clojure.string :as string]
            [frontend.components.icon.core :as icon-core]
            [frontend.context.i18n :refer [t]]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(hsx/defc icons-row
  [items]
  [:div.its.icons-row items])

(hsx/defc icon-cp
  [icon-item {:keys [on-chosen highlighted-id ghost-highlighted-id wave]}]
  (let [icon-id (get-in icon-item [:data :value])
        icon-name (or (:label icon-item) icon-id)
        color (get-in icon-item [:data :color])
        icon-id' (when icon-id (cond-> icon-id (string? icon-id) (string/replace " " "")))
        my-id (:id icon-item)
        item-shape (cond-> {:type :tabler-icon
                            :id icon-id'
                            :value icon-id'}
                     color (assoc :color color))]
    [:button.w-9.h-9.transition-opacity
     (when icon-id'
       {:key icon-id'
        :tabIndex "-1"
        :data-item-id my-id
        :class (cond
                 (= my-id highlighted-id) "is-highlighted"
                 (= my-id ghost-highlighted-id) "is-ghost-highlighted")
        :style (when wave {"--r" (:r wave) "--c" (:c wave)})
        :title icon-name
        :on-click (fn [e] (on-chosen e item-shape))})
     (when icon-id'
       (ui/icon icon-id' {:size 24}))]))

(hsx/defc emoji-cp
  [icon-item {:keys [on-chosen highlighted-id ghost-highlighted-id wave]}]
  (let [emoji-id (get-in icon-item [:data :value])
        emoji-name (or (:label icon-item) emoji-id)
        my-id (:id icon-item)
        item-shape {:type :emoji :id emoji-id :name emoji-name}]
    [:button.text-2xl.w-9.h-9.transition-opacity
     {:tabIndex "-1"
      :data-item-id my-id
      :class (cond
               (= my-id highlighted-id) "is-highlighted"
               (= my-id ghost-highlighted-id) "is-ghost-highlighted")
      :style (when wave {"--r" (:r wave) "--c" (:c wave)})
      :title emoji-name
      :on-click (fn [e] (on-chosen e item-shape))}
     [:em-emoji {:id emoji-id
                 :style {:line-height 1}}]]))

(defn render-item
  "Render an icon-item based on its type"
  [icon-item opts]
  (case (:type icon-item)
    :emoji (emoji-cp icon-item opts)
    :icon (icon-cp icon-item opts)
    nil))

(hsx/defc section-header
  [{:keys [title count total-count expanded? keyboard-hint on-toggle focus-region simple?]}]
  [:div.section-header.text-xs.py-1.5.px-3.flex.justify-between.items-center.gap-2.bg-gray-02.h-8
   {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
   ;; Left: Title · total-count · Chevron
   [:div.flex.items-center.gap-1.select-none
    [:span.font-bold
     (when-not simple? {:class "cursor-pointer"
                        :on-click on-toggle})
     title]
    [:span.flex.items-center.gap-1
     (when-not simple? {:class "cursor-pointer"
                        :on-click on-toggle})
     (when (or total-count count)
       [:<>
        [:span "·"]
        [:span {:style {:font-size "0.7rem"}}
         (or total-count count)]])
     (when-not simple?
       (ui/icon (if expanded? "chevron-down" "chevron-right") {:size 14}))]]

   [:div.flex-1] ; Spacer

   ;; Right: Hide/Show with keyboard shortcut. Visible when navigating grid/tabs;
   ;; also revealed on cursor hover via `.section-header:hover .section-header-hint`
   ;; (see icon.css) so mouse users discover the shortcut as they reach for the chevron.
   (when keyboard-hint
     (let [show-hint? (contains? #{:grid :tabs} focus-region)]
       [:div.section-header-hint.flex.gap-1.items-center.text-xs.opacity-50.transition-all.duration-200
        {:class (when-not show-hint? "!opacity-0")
         :style {:pointer-events (if show-hint? "auto" "none")}}
        (if expanded? (t :icon.section-header/hide) (t :icon.section-header/show))
        (shui/shortcut keyboard-hint {:style :compact})]))])

(hsx/defc pane-section
  [label icon-items & {:keys [title collapsible? keyboard-hint total-count searching? virtual-list? expanded? focus-region show-header? *virtuoso-ref]
                       :or {virtual-list? true collapsible? false expanded? true show-header? true}
                       :as opts}]
  (let [*el-ref (hooks/use-ref nil)
        toggle-fn (when collapsible?
                    #(swap! icon-core/*section-states update label (fn [v] (if (nil? v) false (not v)))))]
    [:div.pane-section
     {:ref *el-ref
      :class (util/classnames
              [{:has-virtual-list virtual-list?
                :searching-result searching?}])}
     ;; Section header: collapsible with chevron + shortcut, or simple label-only
     ;; `label` stays the stable section key (collapse state, shortcut map,
     ;; highlight scoping); `:title` carries the translated display text.
     (when show-header?
       (section-header {:title (or title label)
                        :count (count icon-items)
                        :total-count total-count
                        :expanded? expanded?
                        :keyboard-hint keyboard-hint
                        :on-toggle toggle-fn
                        :focus-region focus-region
                        :simple? (not collapsible?)}))

     ;; Content - only render if expanded or not collapsible
     (when (or (not collapsible?) expanded?)
       (if virtual-list?
         (let [total (count icon-items)
               step icon-core/icon-grid-cols
               rows (quot total step)
               mods (mod total step)
               rows (if (zero? mods) rows (inc rows))
               items (vec icon-items)]
           (ui/virtualized-list
            {:total-count rows
             :ref (fn [^js el]
                    (when *virtuoso-ref
                      (reset! *virtuoso-ref el)))
             ;; Single-scroller layout: Virtuoso delegates
             ;; scrolling to the nearest `.bd-scroll` ancestor
             ;; instead of creating its own internal scroller.
             ;; This keeps `.bd` as the only scroll surface
             ;; across every picker mode (All / Emojis / Icons /
             ;; reaction / search), reclaiming the ~6px the
             ;; inner Virtuoso scrollbar would otherwise eat so
             ;; the 9-column grid stays at 9. On first render
             ;; the ref isn't attached yet and this is `nil`;
             ;; Virtuoso falls back to internal scrolling for
             ;; one frame, then re-renders with the parent.
             :custom-scroll-parent (some-> (hooks/deref *el-ref) (.closest ".bd-scroll"))
             :item-content (fn [idx]
                             (icons-row
                              (let [last? (= (dec rows) idx)
                                    start (* idx step)
                                    end (* (inc idx) (if (and last? (not (zero? mods))) mods step))
                                    icons (try (subvec items start end)
                                               (catch js/Error e
                                                 (log/error :icon/grid-subvec-failed
                                                            {:start start :end end :count (count items) :error e})
                                                 nil))]
                                (vec (map-indexed
                                      (fn [c-idx item]
                                        (render-item item (assoc opts :wave {:r idx :c c-idx})))
                                      icons)))))}))
         [:div.its
          (map-indexed
           (fn [i item]
             (render-item item (assoc opts :wave {:r (quot i icon-core/icon-grid-cols) :c (mod i icon-core/icon-grid-cols)})))
           icon-items)]))]))
