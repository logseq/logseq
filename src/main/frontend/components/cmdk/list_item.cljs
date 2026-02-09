(ns frontend.components.cmdk.list-item
  (:require
   ["remove-accents" :as remove-accents]
   [clojure.string :as string]
   [frontend.components.icon :as icon-component]
   [frontend.components.list-item-icon :as list-item-icon]
   [frontend.handler.block :as block-handler]
   [goog.string :as gstring]
   [logseq.shui.hooks :as hooks]
   [logseq.shui.ui :as shui]
   [rum.core :as rum]))

;; =============================================================================
;; Wikidata Preview Icon Component
;; =============================================================================

(rum/defc wikidata-preview-icon
  "Renders a preview image for Wikidata search results.
   - :avatar → circular with initials fallback, image overlay when loaded
   - :image → square with dashed border placeholder, image when loaded
   - nil/other → nothing rendered (use regular icon only)"
  [{:keys [icon-type image-url initials]}]
  (case icon-type
    :avatar
    [:div.relative.w-5.h-5.flex-shrink-0
     ;; Avatar circle with initials
     [:div.absolute.inset-0.rounded-full.bg-gray-06.flex.items-center.justify-center
      {:class "text-[8px] font-medium text-gray-11"}
      initials]
     ;; Image overlay (when loaded)
     (when image-url
       [:img.absolute.inset-0.w-5.h-5.rounded-full.object-cover
        {:src image-url
         :loading "lazy"
         :on-error (fn [e] (set! (.-style (.-target e)) "display:none"))}])]

    :image
    [:div.relative.w-5.h-5.flex-shrink-0
     ;; Square placeholder with dashed border
     (if image-url
       [:img.w-5.h-5.rounded.object-contain
        {:src image-url
         :loading "lazy"
         :on-error (fn [e] (set! (.-style (.-target e)) "display:none"))}]
       [:div.w-5.h-5.rounded.border.border-dashed.border-gray-07])]

    ;; For :tabler-icon or nil, don't render anything extra
    nil))

(defn- to-string [input]
  (cond
    (string? input) input
    (keyword? input) (name input)
    (symbol? input) (name input)
    (number? input) (str input)
    (uuid? input) (str input)
    (nil? input) ""
    :else (pr-str input)))

(defn- normalize-text [app-config text]
  (cond-> (to-string text)
    ;; :lower-case (string/lower-case)
    :normalize (.normalize "NFKC")
    (:feature/enable-search-remove-accents? app-config) (remove-accents)))

(defn highlight-query* [app-config query text]
  (cond
    (or (vector? text) (object? text))                      ; hiccup
    text

    (string/blank? query)
    [:span (to-string text)]

    :else
    (when-let [text-string (not-empty (to-string text))]
      (let [normal-text (normalize-text app-config text-string)
            normal-query (normalize-text app-config query)
            query-terms (string/replace (gstring/regExpEscape normal-query) #"\s+" "|")
            query-re (js/RegExp. (str "(" query-terms ")") "i")
            highlighted-text (string/replace normal-text query-re "<:hlmarker>$1<:hlmarker>")
            segs (string/split highlighted-text #"<:hlmarker>")]
        (if (seq segs)
          (into [:span {"data-testid" text-string}]
                (map-indexed (fn [i seg]
                               (if (even? i)
                                 [:span seg]
                                 [:span {:class "ui__list-item-highlighted-span"} seg]))
                             segs))
          [:span normal-text])))))

(rum/defc root [{:keys [group icon icon-theme query text text-tags info shortcut value-label value
                        title highlighted on-highlight on-highlight-dep header on-click hls-page?
                        hoverable compact rounded on-mouse-enter component-opts source-page source-create source-block
                        ;; Wikidata preview props
                        source-wikidata preview-image-url preview-icon-type preview-initials] :as _props
                 :or {hoverable true rounded true}}
                {:keys [app-config]}]
  (let [ref (hooks/create-ref)
        highlight-query (partial highlight-query* app-config query)
        [hover? set-hover?] (rum/use-state false)
        ;; Determine icon variant
        icon-variant (cond
                       source-create :create
                       (#{:gradient} icon-theme) :default  ;; gradient handled with inline styles
                       (#{:gray :color} icon-theme) :default
                       :else :default)
        ;; For gradient, we need to keep inline styles
        gradient-style (when (#{:gradient} icon-theme)
                         {:background "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)"
                          :box-shadow "inset 0 0 0 1px rgba(255,255,255,0.3)"})]
    (hooks/use-effect!
     (fn []
       (when (and highlighted on-highlight)
         (on-highlight ref)))
     [highlighted on-highlight-dep])
    [:div (merge
           {:style {:opacity (if highlighted 1 0.8)}
            :class (cond-> "flex flex-col transition-opacity"
                     highlighted (str " !opacity-100 bg-gray-03-alpha dark:bg-gray-04-alpha")
                     hoverable (str " transition-all duration-50 ease-in !opacity-75 hover:!opacity-100 hover:cursor-pointer hover:bg-gradient-to-r hover:from-gray-03-alpha hover:to-gray-01-alpha from-0% to-100%")
                     (and hoverable rounded) (str " !rounded-lg")
                     (not compact) (str " py-4 px-6 gap-1")
                     compact (str " py-1.5 px-3 gap-0.5")
                     (not highlighted) (str " "))
            :ref ref
            :on-click (when on-click on-click)
            :on-mouse-over #(set-hover? true)
            :on-mouse-out #(set-hover? false)
            :on-mouse-enter (when on-mouse-enter on-mouse-enter)}
           component-opts)
     ;; header
     (when header
       [:div.text-xs.pl-8.font-light {:class "-mt-1"
                                      :style {:color "var(--lx-gray-11)"}}
        (highlight-query header)])
     ;; main row
     [:div.flex.items-start.gap-3
      (if gradient-style
        ;; Special handling for gradient theme with inline styles
        [:div.w-5.h-5.rounded.flex.items-center.justify-center
         {:style gradient-style}
         (shui/tabler-icon icon {:size "14" :class ""})]
        ;; Use new list-item-icon component for all other cases
        (list-item-icon/root {:variant icon-variant
                              :icon icon}))
      ;; Wikidata preview image (shows next to icon for :avatar/:image types)
      (when (and source-wikidata preview-icon-type)
        (wikidata-preview-icon {:icon-type preview-icon-type
                                :image-url preview-image-url
                                :initials preview-initials}))
      [:div.flex.flex-1.flex-col
       (when title
         [:div.text-sm.pb-2.font-bold.text-gray-11 (highlight-query title)])
       [:div {:class "text-sm font-medium text-gray-12 flex items-baseline"}
        (block-handler/block-title-with-icon source-block
                                             (highlight-query text)
                                             icon-component/icon)
        (when text-tags
          [:span.page-tag-suffix.ml-1 (highlight-query text-tags)])
        (when info
          [:span.text-xs.text-gray-11 " — " (highlight-query info)])]]
      (when (or value-label value)
        [:div {:class "text-xs"}
         (when (and value-label value)
           [:span.text-gray-11 (str (to-string value-label) ": ")])
         (when (and value-label (not value))
           [:span.text-gray-11 (str (to-string value-label))])
         (when value
           [:span.text-gray-11 (to-string value)])])
      (when shortcut
        [:div {:class "flex gap-1 shui-shortcut-row items-center"
               :style {:opacity (if (or highlighted hover?) 1 0.9)
                       :min-height "20px"
                       :flex-wrap "nowrap"}}
         (shui/shortcut shortcut {:interactive? false
                                  :aria-hidden? true})])]]))
