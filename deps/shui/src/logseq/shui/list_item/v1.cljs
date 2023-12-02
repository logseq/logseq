(ns logseq.shui.list-item.v1
  (:require
    ["remove-accents" :as remove-accents]
    [rum.core :as rum]
    [clojure.string :as string]
    [logseq.shui.icon.v2 :as icon]
    [logseq.shui.shortcut.v1 :as shortcut]))

(def to-string shortcut/to-string)

(defn normalize-text [app-config text]
  (cond-> (to-string text)
    :lower-case (string/lower-case)
    :normalize (.normalize "NFKC")
    (:feature/enable-search-remove-accents? app-config) (remove-accents)))

(defn split-text-on-highlight [text query normal-text normal-query]
  (let [start-index (string/index-of normal-text normal-query)
        end-index (+ start-index (count query))
        text-string (to-string text)]
    (if start-index
      [(to-string (subs text-string 0 start-index))
       (to-string (subs text-string start-index end-index))
       (to-string (subs text-string end-index))]
      [text-string "" ""])))


(defn span-with-single-highlight-token [text query normal-text normal-query]
  (let [[before-text highlighted-text after-text] (split-text-on-highlight text query normal-text normal-query)]
    [:span
     (when-not (string/blank? before-text) [:span before-text])
     (when-not (string/blank? highlighted-text) [:span {:class "ui__list-item-highlighted-span bg-accent-06 dark:bg-accent-08-alpha"} highlighted-text])
     (when-not (string/blank? after-text) [:span after-text])]))

(defn span-with-multiple-highlight-tokens [app-config text normal-query]
  (let [normalized-text (normalize-text app-config text)]
    (loop [[query-token & more] (string/split normal-query #" ")
           result [[:text (to-string text)]]]
      (if-not query-token
        (->> result
             (map (fn [[type value]]
                    (if (= type :text)
                      [:span value]
                      [:span {:class "ui__list-item-highlighted-span"} value])))
             (into [:span]))
        (->> result
             (mapcat (fn [[type value]]
                       (let [include-token? (and (= type :text) (string? value)
                                                 (string/includes? normalized-text query-token))]
                         (if include-token?
                           (let [normal-value (normalize-text app-config value)
                                 normal-query-token (normalize-text app-config query-token)
                                 [before-text highlighted-text after-text] (split-text-on-highlight value query-token normal-value normal-query-token)]
                             [[:text before-text]
                              [:match highlighted-text]
                              [:text after-text]])
                           [[type value]]))))
             (recur more))))))

(defn highlight-query* [app-config query text]
  (if (vector? text)                    ; hiccup
    text
    (let [text-string (to-string text)]
      (if-not (seq text-string)
        [:span text-string]
        (let [normal-text (normalize-text app-config text-string)
              normal-query (normalize-text app-config query)]
          (cond
            (and (string? query) (re-find #" " query))
            (span-with-multiple-highlight-tokens app-config text-string normal-query)
          ;; When the match is present and only a single token, highlight that token
            (string/includes? normal-text normal-query)
            (span-with-single-highlight-token text-string query normal-text normal-query)
          ;; Otherwise, just return the text
            :else
            [:span text-string]))))))

(rum/defc root [{:keys [icon icon-theme query text info shortcut value-label value
                        title highlighted on-highlight on-highlight-dep header on-click
                        hoverable compact rounded on-mouse-enter component-opts] :as _props
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
            :class (cond-> "flex flex-col grayscale"
                     highlighted (str " !grayscale-0 !opacity-100 bg-gray-03-alpha dark:bg-gray-04-alpha")
                     hoverable (str " transition-all duration-50 ease-in !opacity-75 hover:!opacity-100 hover:grayscale-0 hover:cursor-pointer hover:bg-gradient-to-r hover:from-gray-03-alpha hover:to-gray-01-alpha from-0% to-100%")
                     (and hoverable rounded) (str " !rounded-lg")
                     (not compact) (str  " py-4 px-6 gap-1")
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
       [:div {:class "text-sm font-medium text-gray-12"} (highlight-query text)
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
               :style {:opacity (if (or highlighted hover?) 1 0.5)}}
         (shortcut/root shortcut context)])]]))
