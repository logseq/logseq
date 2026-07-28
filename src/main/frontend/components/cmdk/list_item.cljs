(ns frontend.components.cmdk.list-item
  (:require
   ["remove-accents" :as remove-accents]
   [clojure.string :as string]
   [goog.string :as gstring]
   [frontend.components.list-item-icon :as list-item-icon]
   [logseq.shui.ui :as shui]
   [io.factorhouse.hsx.core :as hsx]))

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

(def current-page-badge-label "Current Page")

(defn current-page-badge-placement
  [{:keys [current-page? result-type]}]
  (when current-page?
    (case result-type
      :page {:text-badge current-page-badge-label}
      :block {:header-badge current-page-badge-label}
      nil)))

(defn current-page-badge-node
  [label]
  (when-not (string/blank? label)
    [:span.cp__cmdk-current-page-badge label]))

(defn- wikidata-preview-icon
  "Photo-icon for Wikidata 'From Web' results, rendered inside the cmdk icon
   slot. Carries `.icon-cp-container.photo-icon` so cmdk.css suppresses the gray
   chip (matching real node avatars from `get-node-icon-cp`).
   - :avatar -> gray circle with initials, portrait image overlaid when loaded
   - :image  -> square; dashed placeholder until the image loads"
  [{:keys [icon-type image-url initials]}]
  (case icon-type
    :avatar
    [:div.icon-cp-container.photo-icon.relative.w-5.h-5.flex-shrink-0
     [:div.absolute.inset-0.rounded-full.bg-gray-06.flex.items-center.justify-center
      {:class "text-[8px] font-medium text-gray-11"}
      initials]
     (when image-url
       [:img.absolute.inset-0.w-5.h-5.rounded-full.object-cover
        {:src image-url
         :loading "lazy"
         :on-error (fn [e] (set! (.-style (.-target e)) "display:none"))}])]

    :image
    [:div.icon-cp-container.photo-icon.relative.w-5.h-5.flex-shrink-0
     (if image-url
       [:img.w-5.h-5.rounded.object-contain
        {:src image-url
         :loading "lazy"
         :on-error (fn [e] (set! (.-style (.-target e)) "display:none"))}]
       [:div.w-5.h-5.rounded.border.border-dashed.border-gray-07])]

    nil))

(hsx/defc root [{:keys [icon icon-theme query text text-tags info shortcut value-label value title highlighted header hoverable
                        compact rounded on-mounted on-click on-mouse-move source-block source-create icon-extension?
                        source-wikidata preview-image-url preview-icon-type preview-initials] :as props
                 :or {hoverable true rounded true}}
                {:keys [app-config]}]
  (let [highlight-query (partial highlight-query* app-config query)
        badge-placement (current-page-badge-placement props)
        text-badge (current-page-badge-node (:text-badge badge-placement))
        header-badge (current-page-badge-node (:header-badge badge-placement))
        keyboard-highlighted? (and highlighted (not hoverable))]
    [:div (merge
           {:style {:opacity 1}
            :data-cmdk-item true
            :data-hoverable (when hoverable true)
            :data-highlighted (when highlighted true)
            :data-kb-highlighted (when keyboard-highlighted? true)
            :class (cond-> "flex flex-col transition-colors duration-75 ease-in"
                     hoverable (str " cursor-pointer")
                     rounded (str " rounded-lg")
                     (not compact) (str " py-4 px-6 gap-1")
                     compact (str " py-1.5 px-3 gap-0.5"))
            :ref (when on-mounted on-mounted)
            :on-click (when on-click on-click)
            :on-mouse-move (when on-mouse-move on-mouse-move)})
     ;; header — single-line, overflow hidden so long paths don't push content off screen
     (when header
       [:div.text-xs.pl-8.font-light.flex.items-center.gap-2.overflow-hidden.min-w-0 {:class "-mt-1"
                                                                                      :style {:color "var(--lx-gray-11)"
                                                                                              :white-space "nowrap"
                                                                                              :text-overflow "ellipsis"}}
        (highlight-query header)
        header-badge])
     ;; main row
     [:div.flex.items-start.gap-3
      (if source-create
        (list-item-icon/root {:variant :create :icon icon :extension? icon-extension?})
        [:div.w-5.h-5.rounded.flex.items-center.justify-center
       {:style {:background (when (#{:gradient} icon-theme) "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)")
                :box-shadow (when (#{:gradient} icon-theme) "inset 0 0 0 1px rgba(255,255,255,0.3) ")}
        ;; `cp__cmdk-list-item-icon` is a hook for the chip-suppression
        ;; rule in cmdk.css — when this slot contains a photo-icon
        ;; (avatar with image OR colored-circle initials fallback), the
        ;; gray chip becomes transparent so the icon's own shape and
        ;; color read cleanly. Tabler / text / emoji rows keep the chip.
        :class (cond-> "w-5 h-5 rounded flex items-center justify-center cp__cmdk-list-item-icon"
                 (= icon-theme :color) (str
                                        " "
                                        (if highlighted "bg-accent-07-alpha" "bg-gray-05")
                                        " dark:text-white")
                 (= icon-theme :gray) (str " bg-gray-05 dark:text-white"))}
       (cond
         (and source-wikidata preview-icon-type)
         (wikidata-preview-icon {:icon-type preview-icon-type
                                 :image-url preview-image-url
                                 :initials preview-initials})

         (string? icon)
         (shui/tabler-icon icon {:size "14" :class ""})

         :else icon)])
      [:div.flex.flex-1.flex-col
       (when title
         [:div.text-sm.pb-2.font-bold.text-gray-11 (highlight-query title)])
       [:div {:class "cp__cmdk-item-main-text text-sm font-medium text-gray-12 flex items-center gap-2 flex-wrap"}
        ;; Title only — the icon is already rendered in the dedicated
        ;; slot above via the caller's `:icon` prop (`get-node-icon-cp`
        ;; resolves own/inherited icons consistently). Prepending the
        ;; block's own `:logseq.property/icon` inline next to the title
        ;; would render the same icon twice for instance rows that
        ;; diverge from their class default. Inheriting rows would mask
        ;; the bug since the inline render is nil when the block has no
        ;; own icon.
        (or (style-wikilinks (highlight-query text)) (:block/title source-block))
        text-badge
        (when text-tags
          [:span.page-tag-suffix.whitespace-nowrap.ml-1 (highlight-query text-tags)])
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
               :style {:opacity (if highlighted 1 0.9)
                       :min-height "20px"
                       :flex-wrap "nowrap"}}
         (shui/shortcut shortcut {:aria-hidden? true})])]]))
