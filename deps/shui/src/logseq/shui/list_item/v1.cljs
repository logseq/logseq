(ns logseq.shui.list-item.v1
  (:require
    ["remove-accents" :as remove-accents]
    [rum.core :as rum]
    [clojure.string :as string]
    [goog.string :as gstring]
    [logseq.shui.icon.v2 :as icon]
    [logseq.shui.shortcut.v1 :as shortcut]))

(def to-string shortcut/to-string)

(defn- normalize-text [app-config text]
  (cond-> (to-string text)
    ;; :lower-case (string/lower-case)
    :normalize (.normalize "NFKC")
    (:feature/enable-search-remove-accents? app-config) (remove-accents)))

(defn highlight-query* [app-config query text]
  (cond
    (vector? text)                    ; hiccup
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
          (into [:span]
                (map-indexed (fn [i seg]
                               (if (even? i)
                                 [:span seg]
                                 [:span {:class "ui__list-item-highlighted-span"} seg]))
                             segs))
          [:span normal-text])))))

(rum/defc root [{:keys [icon icon-theme query text info shortcut value-label value
                        title highlighted on-highlight on-highlight-dep header on-click hls-page?
                        hoverable compact rounded on-mouse-enter component-opts source-page] :as _props
                 :or {hoverable true rounded true}}
                {:keys [app-config] :as context}]
  (let [ref (rum/create-ref)
        highlight-query (partial highlight-query* app-config query)
        [hover? set-hover?] (rum/use-state false)]
    (rum/use-effect!
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
     [:div.flex.items-center.gap-3
      [:div.w-5.h-5.rounded.flex.items-center.justify-center
       {:style {:background (when (#{:gradient} icon-theme) "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)")
                :box-shadow (when (#{:gradient} icon-theme) "inset 0 0 0 1px rgba(255,255,255,0.3) ")}
        :class (cond-> "w-5 h-5 rounded flex items-center justify-center"
                 (= icon-theme :color) (str
                                        " "
                                        (if highlighted "bg-accent-07-alpha" "bg-gray-05")
                                        " dark:text-white")
                 (= icon-theme :gray) (str " bg-gray-05 dark:text-white"))}
       (icon/root icon {:size "14"
                        :class ""})]
      [:div.flex.flex-1.flex-col
       (when title
         [:div.text-sm.pb-2.font-bold.text-gray-11 (highlight-query title)])
       [:div {:class "text-sm font-medium text-gray-12"}
        (if (and (= icon "page") (not= text source-page)) ;; alias
          [:div.flex.flex-row.items-center.gap-2
            (highlight-query text)
           (if-not hls-page?
             [:<> [:div.opacity-50.font-normal "alias of"] source-page]
             [:div.opacity-50.font-normal.text-xs " — Highlights page"])]
          (highlight-query text))
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
        [:div {:class "flex gap-1"
               :style {:opacity (if (or highlighted hover?) 1 0.9)}}
         (shortcut/root shortcut)])]]))
