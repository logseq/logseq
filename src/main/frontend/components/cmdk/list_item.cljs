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

;; =============================================================================
;; Wikilink Styling for [[Page References]]
;; =============================================================================

(defn- find-wikilink-regions
  "Find all non-nested [[...]] positions in text.
   Returns [{:start N :open-end N :close-start N :end N} ...]"
  [text]
  (let [re (js/RegExp. "\\[\\[([^\\[\\]]*?)\\]\\]" "g")]
    (loop [results []]
      (if-let [m (.exec re text)]
        (let [start (.-index m)
              end (+ start (.-length (aget m 0)))]
          (recur (conj results {:start start
                                :open-end (+ start 2)
                                :close-start (- end 2)
                                :end end})))
        results))))

(defn- extract-segments
  "Extract text segments with positions from hiccup children."
  [children]
  (loop [cs (seq children), pos 0, result []]
    (if-not cs
      result
      (let [c (first cs)
            [text attrs] (cond
                           (string? c) [c nil]
                           (and (vector? c) (= :span (first c)))
                           (if (map? (second c))
                             [(nth c 2 "") (second c)]
                             [(second c) nil])
                           :else ["" nil])
            text (or text "")
            end (+ pos (count text))]
        (recur (next cs) end (conj result {:text text :attrs attrs :start pos :end end}))))))

(defn- style-wikilinks
  "Post-process hiccup to style [[wikilinks]] with .page-reference, .bracket, and .page-ref classes.
   Works on output from both highlight-query* and highlight-content-query."
  [hiccup]
  (if-not (and (vector? hiccup) (= :span (first hiccup)))
    hiccup
    (let [;; Normalize: handle both [:span a b c] and [:span (lazy-seq)] forms
          has-attrs? (map? (second hiccup))
          outer-attrs (when has-attrs? (second hiccup))
          raw (if has-attrs? (subvec hiccup 2) (subvec hiccup 1))
          children (if (and (= 1 (count raw))
                            (sequential? (first raw))
                            (not (vector? (first raw)))
                            (not (string? (first raw))))
                     (vec (first raw))
                     (vec raw))
          segments (extract-segments children)
          full-text (apply str (map :text segments))
          regions (find-wikilink-regions full-text)]
      (if (empty? regions)
        hiccup
        (let [;; Build zones partitioning full text into typed intervals
              zones (loop [pos 0, rs (seq regions), ri 0, zones []]
                      (if-not rs
                        (cond-> zones
                          (< pos (count full-text))
                          (conj {:start pos :end (count full-text) :type :plain :wl nil}))
                        (let [{:keys [start open-end close-start end]} (first rs)]
                          (recur end (next rs) (inc ri)
                                 (cond-> zones
                                   (< pos start)
                                   (conj {:start pos :end start :type :plain :wl nil})
                                   true
                                   (conj {:start start :end open-end :type :bracket :wl ri})
                                   (< open-end close-start)
                                   (conj {:start open-end :end close-start :type :page-ref :wl ri})
                                   true
                                   (conj {:start close-start :end end :type :bracket :wl ri}))))))
              ;; Two-pointer: slice segments at zone boundaries
              pieces (loop [si 0, zi 0, pieces []]
                       (if (or (>= si (count segments)) (>= zi (count zones)))
                         pieces
                         (let [seg (nth segments si)
                               zone (nth zones zi)
                               os (max (:start seg) (:start zone))
                               oe (min (:end seg) (:end zone))]
                           (if (>= os oe)
                             (if (< (:end seg) (:end zone))
                               (recur (inc si) zi pieces)
                               (recur si (inc zi) pieces))
                             (recur (if (>= oe (:end seg)) (inc si) si)
                                    (if (>= oe (:end zone)) (inc zi) zi)
                                    (conj pieces {:text (subs (:text seg)
                                                              (- os (:start seg))
                                                              (- oe (:start seg)))
                                                  :attrs (:attrs seg)
                                                  :type (:type zone)
                                                  :wl (:wl zone)}))))))
              ;; Group by wikilink and emit hiccup
              new-children
              (mapcat
               (fn [group]
                 (if (nil? (:wl (first group)))
                   (keep (fn [{:keys [text attrs]}]
                           (when (seq text)
                             (if attrs [:span attrs text] [:span text])))
                         group)
                   (let [inner (keep (fn [{:keys [text attrs type]}]
                                       (when (seq text)
                                         (if (= :bracket type)
                                           [:span.bracket text]
                                           (if attrs
                                             [:span.page-ref attrs text]
                                             [:span.page-ref text]))))
                                     group)]
                     (when (seq inner)
                       [(into [:span.page-reference] inner)]))))
               (partition-by :wl pieces))]
          (into (if outer-attrs [:span outer-attrs] [:span]) new-children))))))

(rum/defc root [{:keys [group icon icon-theme icon-extension? query text text-tags info shortcut value-label value
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
                     hoverable (str " transition-all duration-50 ease-in hover:!opacity-100 hover:cursor-pointer hover:bg-gradient-to-r hover:from-gray-03-alpha hover:to-gray-01-alpha from-0% to-100%")
                     (and hoverable (not highlighted)) (str " !opacity-75")
                     (and hoverable rounded) (str " !rounded-lg")
                     (not compact) (str " py-4 px-6 gap-1")
                     compact (str " py-1.5 px-3 gap-0.5")
                     (not highlighted) (str " ")
                     hover? (str " is-hovered"))
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
                              :icon icon
                              :extension? icon-extension?}))
      ;; Wikidata preview image (shows next to icon for :avatar/:image types)
      (when (and source-wikidata preview-icon-type)
        (wikidata-preview-icon {:icon-type preview-icon-type
                                :image-url preview-image-url
                                :initials preview-initials}))
      [:div.flex.flex-1.flex-col
       (when title
         [:div.text-sm.pb-2.font-bold.text-gray-11 (highlight-query title)])
       [:div {:class "text-sm font-medium text-gray-12"}
        (block-handler/block-title-with-icon source-block
                                             (style-wikilinks (highlight-query text))
                                             icon-component/icon)
        (when text-tags
          [:span.page-tag-suffix.whitespace-nowrap.ml-1 (highlight-query text-tags)])
        (when info
          [:span.text-xs.text-gray-11.whitespace-nowrap " — " (highlight-query info)])]]
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
