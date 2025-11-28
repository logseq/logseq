(ns frontend.components.combobox.item-renderer
  "Unified item renderer for combobox components.
   Handles icons, breadcrumbs, new items, query highlighting, multi-select,
   right-side checkboxes, shortcuts, and embeds."
  (:require
   [cljs.core.match :refer [match]]
   [clojure.string :as string]
   [frontend.components.list-item-icon :as list-item-icon]
   [frontend.extensions.video.youtube :as youtube]
   [frontend.ui :as ui]
   [frontend.util :as util]
   [frontend.util.text :as text-util]
   [logseq.common.util :as common-util]
   [logseq.shui.ui :as shui]))

(defn- extract-icon
  "Extract icon name from item using icon-fn or icon-key."
  [item {:keys [icon-fn icon-key icon]}]
  (cond
    icon-fn (icon-fn item)
    icon-key (get item icon-key)
    icon icon
    :else nil))

(defn- extract-icon-variant
  "Determine icon variant based on item and config."
  [item {:keys [icon-variant icon-variant-fn new-item-patterns]}]
  (cond
    icon-variant-fn (icon-variant-fn item)
    icon-variant icon-variant
    (some (fn [pattern]
            (let [text (if (map? item) (or (:label item) (:value item) (:text item)) (str item))]
              (and (string? text) (string/starts-with? text pattern))))
          new-item-patterns)
    :create
    :else :default))

(defn- is-new-item?
  "Check if item is a 'new' item based on patterns."
  [item {:keys [new-item-patterns]}]
  (when (seq new-item-patterns)
    (let [text (if (map? item) (or (:label item) (:value item) (:text item) (:block/title item)) (str item))]
      (and (string? text)
           (some #(string/starts-with? text %) new-item-patterns)))))

(defn- extract-new-item-text
  "Extract the text after 'New option:' or similar pattern, or quoted text from 'Convert \"text\" to property'."
  [item pattern]
  (let [text (if (map? item) (or (:label item) (:value item) (:text item) (:block/title item)) (str item))]
    (when (and (string? text) (string/starts-with? text pattern))
      (if (= pattern "Convert")
        ;; Extract quoted text from "Convert \"text\" to property"
        (when-let [match (re-find #"Convert\s+\"([^\"]+)\"\s+to\s+property" text)]
          (second match))
        ;; Extract text after pattern like "New option: "
        (let [parts (string/split text (re-pattern (str pattern " ")) 2)]
          (second parts))))))

(defn- highlight-query
  "Highlight query terms in text."
  [text query highlight-fn]
  (if (and (string? query) (not (string/blank? query)) highlight-fn)
    (highlight-fn query text)
    (if (string? text) [:span text] text)))

(defn- render-left-checkbox
  "Render checkbox on the left side for multi-select."
  [item chosen? {:keys [multi-select? selected-choices extract-value-fn]}]
  (when multi-select?
    (let [value (if extract-value-fn (extract-value-fn item) (:value item))
          checked? (boolean (and selected-choices (contains? @selected-choices value)))]
      (shui/checkbox {:checked checked?
                      :on-click (fn [e]
                                  (.preventDefault e))
                      :disabled (:disabled? item)
                      :class "mr-1"}))))

(defn- render-right-checkbox
  "Render checkbox on the right side."
  [item chosen? {:keys [right-checkbox-fn]}]
  (when right-checkbox-fn
    (let [checkbox-data (right-checkbox-fn item)]
      (when checkbox-data
        (shui/checkbox (merge {:class "ml-auto"}
                              checkbox-data))))))

(defn- render-right-shortcut
  "Render keyboard shortcut on the right side.
   Hover state is handled via CSS :hover pseudo-class."
  [item chosen? _hover? {:keys [shortcut-fn shortcut-key]}]
  (when-let [shortcut (cond
                        shortcut-fn (shortcut-fn item)
                        shortcut-key (get item shortcut-key)
                        :else nil)]
    [:div {:class "flex gap-1 shui-shortcut-row items-center ml-auto"
           :style {:opacity (if chosen? 1 0.9)
                   :min-height "20px"
                   :flex-wrap "nowrap"}}
     (shui/shortcut shortcut {:interactive? false
                              :aria-hidden? true})]))

(defn- render-video-embed
  "Render video embed from URL. Uses youtube component for YouTube (same as macro-video-cp)."
  [url]
  (if (common-util/url? url)
    (let [results (text-util/get-matched-video url)
          src (match results
                [_ _ _ (:or "youtube.com" "youtu.be" "y2u.be") _ id _]
                (if (= (count id) 11)
                  ["youtube-player" id]
                  ;; Fallback: construct embed URL even if ID length is unexpected
                  (str "https://www.youtube.com/embed/" id))

                [_ _ _ "youtube-nocookie.com" _ id _]
                (str "https://www.youtube-nocookie.com/embed/" id)

                [_ _ _ "loom.com" _ id _]
                (str "https://www.loom.com/embed/" id)

                [_ _ _ (_ :guard #(string/ends-with? % "vimeo.com")) _ id _]
                (str "https://player.vimeo.com/video/" id)

                [_ _ _ "bilibili.com" _ id & query]
                (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1&autoplay=0"
                     (when-let [page (second query)]
                       (str "&page=" page)))

                :else
                url)]
      (if (and (coll? src)
               (= (first src) "youtube-player"))
        ;; For YouTube, use youtube.com with enablejsapi=1 exactly as breadcrumbs do
        ;; This matches the working breadcrumb implementation
        (let [video-id (last src)
              t (re-find #"&t=(\d+)" url)
              width (min (- (util/get-width) 96) 560) ; Same as youtube component
              height (int (* width (/ 315 560)))
              embed-url (str "https://www.youtube.com/embed/" video-id "?enablejsapi=1"
                             (when (seq t) (str "&start=" (nth t 1))))]
          [:iframe.aspect-video
           {:key (str "youtube-embed-" video-id) ; Stable key prevents recreation
            :id (str "youtube-player-" video-id)
            :allow-full-screen "allowfullscreen"
            :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            :frame-border "0"
            :src embed-url
            :height height
            :width width}])
        (when src
          (let [width (min (- (util/get-width) 96) 400) ; Smaller width for combobox
                height (int (* width (/ (if (string/includes? src "player.bilibili.com")
                                          360 315)
                                        560)))]
            [:iframe
             {:allow-full-screen "allowfullscreen"
              :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              :frame-border "0"
              :src src
              :width width
              :height height}]))))
    nil))

(defn- parse-embed-macro
  "Parse embed macro from text like {{video ...}} or {{tweet ...}}.
   Returns [embed-hiccup remaining-text] or [nil text] if no embed found."
  [text]
  (when (string? text)
    (if-let [match (re-find #"^\{\{(video|tweet|twitter)\s+([^}]+)\}\}(.*)$" text)]
      (let [[_ macro-name url remaining] match
            embed-hiccup (cond
                           (= macro-name "video")
                           (render-video-embed url)

                           (contains? #{"tweet" "twitter"} macro-name)
                           (let [id-regex #"/status/(\d+)"]
                             (when-let [id (cond
                                             (<= (count url) 15) url
                                             :else
                                             (last (re-find id-regex url)))]
                               (ui/tweet-embed id)))

                           :else nil)]
        (if embed-hiccup
          [embed-hiccup (string/trim remaining)]
          [nil text]))
      [nil text])))

(defn- render-content
  "Render the main content area (text, highlighting, embeds, etc.)."
  [item chosen? {:keys [text-fn highlight-query? query-fn highlight-fn gap-size] :as config}]
  (let [text (cond
               text-fn (text-fn item)
               (map? item) (or (:label item) (:text item) (:value item) (:block/title item))
               :else (str item))
        query (when highlight-query? (query-fn))
        gap-class (case gap-size
                    1 "gap-1"
                    2 "gap-2"
                    3 "gap-3"
                    "gap-3")]
    (if (is-new-item? item config)
      ;; Render "New option:", "New page:", or "Convert" style
      (let [pattern (first (filter #(let [text-str (if (string? text) text (str text))]
                                      (string/starts-with? text-str %))
                                   (:new-item-patterns config)))
            new-text (when pattern (extract-new-item-text item pattern))
            display-pattern (string/replace pattern #":+$" "")] ; Remove one or more trailing colons
        (if (= pattern "Convert")
          ;; Special styling for "Convert \"text\" to property" - use gap instead of space
          [:div {:class "flex flex-row items-center whitespace-nowrap gap-1"}
           [:span.text-gray-12 "Convert"]
           (when new-text
             [:span.text-gray-11 (str "\"" new-text "\"")])
           [:span.text-gray-12 "to property"]]
          ;; Regular "New option:" or "New page:" style - use gap instead of space
          [:div {:class "flex flex-row items-center whitespace-nowrap gap-1"}
           [:span.text-gray-12 (str display-pattern ":")]
           (when new-text
             [:span.text-gray-11 (str "\"" new-text "\"")])]))
      ;; Regular content with optional highlighting and embeds
      (if (vector? text)
        text ; Already hiccup
        (let [[embed-hiccup remaining-text] (parse-embed-macro text)
              highlighted-text (highlight-query remaining-text query highlight-fn)]
          (if embed-hiccup
            [:div.flex.flex-col.gap-1
             embed-hiccup
             (when (and remaining-text (not (string/blank? remaining-text)))
               highlighted-text)]
            highlighted-text))))))

(defn render-item
  "Unified item renderer for combobox components.
   Returns hiccup for rendering a combobox item.
   
   Config options:
   - :icon-fn (fn [item] icon-name) or :icon-key :icon or :icon string
   - :icon-variant :default|:create|:raw|:checkbox or :icon-variant-fn (fn [item] variant)
   - :show-breadcrumbs? boolean
   - :breadcrumb-fn (fn [item] breadcrumb-hiccup)
   - :new-item-patterns [\"New page:\" \"New option:\"] - patterns to detect new items
   - :highlight-query? boolean
   - :query-fn (fn [] current-query-string)
   - :highlight-fn (fn [query text] highlighted-hiccup)
   - :multi-select? boolean - show checkbox on left for multi-select
   - :selected-choices atom - set of selected values for multi-select
   - :extract-value-fn (fn [item] value) - extract value for multi-select
   - :right-checkbox-fn (fn [item] {:checked? bool :on-checked-change fn}) - checkbox on right
   - :shortcut-fn (fn [item] shortcut) or :shortcut-key :shortcut - shortcut on right
   - :text-fn (fn [item] text-content) - extract text from item
   - :header-fn (fn [item] header-hiccup) - header above item (or use :header key in item)
   - :gap-size 1|2|3 - spacing between icon and text (default 3)
   - :embed-renderer (fn [item] embed-hiccup) - render embeds
   - :class string - additional classes for row"
  [item chosen? config]
  (let [icon-name (extract-icon item config)
        icon-variant (extract-icon-variant item config)
        item-header (:header item)
        header-fn-result (when (:header-fn config) ((:header-fn config) item))
        ;; If show-breadcrumbs? is true, use :header as breadcrumb, otherwise as header
        breadcrumb (when (:show-breadcrumbs? config)
                     (or item-header ; Use :header as breadcrumb if available
                         (when (:breadcrumb-fn config)
                           ((:breadcrumb-fn config) item))))
        header (when (not (:show-breadcrumbs? config))
                 (or item-header header-fn-result))
        gap-size (or (:gap-size config) 3)
        gap-class (case gap-size
                    1 "gap-1"
                    2 "gap-2"
                    3 "gap-3"
                    "gap-3")
        row-content [:div.flex.flex-row.items-center.justify-between.w-full
                     {:class (when chosen? "chosen")
                      :on-pointer-down (when (:on-pointer-down config) #((:on-pointer-down config) %))}
                     ;; Left side: checkbox (multi-select), icon, content
                     [:div {:class (str "flex flex-row items-center " gap-class)}
                      (render-left-checkbox item chosen? config)
                      (when icon-name
                        (list-item-icon/root {:variant icon-variant
                                              :icon icon-name}))
                      (render-content item chosen? (assoc config :gap-size gap-size))]
                     ;; Right side: shortcut or checkbox (hover handled via CSS)
                     (or (render-right-shortcut item chosen? false config) ; Use false for hover, CSS will handle it
                         (render-right-checkbox item chosen? config))]]
    (if (or header breadcrumb)
      [:div.flex.flex-col.gap-1
       {:class (or (:class config) "")}
       (when breadcrumb
         [:div.text-xs.opacity-70.mb-1
          breadcrumb])
       (when header
         header)
       row-content]
      [:div {:class (or (:class config) "")}
       row-content])))

