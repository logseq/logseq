(ns logseq.shui.list-item.v1
  (:require 
    ["remove-accents" :as remove-accents]
    [rum.core :as rum]
    [clojure.string :as string]
    [logseq.shui.icon.v2 :as icon]
    [logseq.shui.button.v2 :as button]))

(defn to-string [input]
  (cond
    (string? input) input
    (keyword? input) (name input)
    (symbol? input) (name input)
    (number? input) (str input)
    (uuid? input) (str input)
    (nil? input) ""
    :else (pr-str input)))

(defn print-shortcut-key [key]
  (case key
    ("cmd" "command" "mod" "⌘") "⌘"
    ("return" "enter" "⏎") "⏎"
    ("shift" "⇧") "⇧"
    ("alt" "option" "opt" "⌥") "⌥"
    ("ctrl" "control" "⌃") "⌃"
    ("space" " ") " "
    ("up" "↑") "↑"
    ("down" "↓") "↓"
    ("left" "←") "←"
    ("right" "→") "→"
    ("disabled" "Disabled") ""
    ("backspace" "delete") ""
    ("tab") ""
    (nil) ""
    (name key)))

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
     (when-not (string/blank? highlighted-text) [:span {:class "bg-accent-06 dark:bg-accent-08-alpha"} highlighted-text])
     (when-not (string/blank? after-text) [:span after-text])]))

(defn span-with-mutliple-highlight-tokens [app-config text query normal-text normal-query]
  (loop [[query-token & more] (string/split normal-query #" ")
         result [[:text (to-string text)]]]
    (if-not query-token 
      (->> result 
           (map (fn [[type value]] 
                  (if (= type :text) 
                    [:span value] 
                    [:span {:style {:background "var(--lx-accent-09)"}} value])))
           (into [:span]))
      (->> result 
           (mapcat (fn [[type value]]
                     (if-not (and (= type :text) (string? value) (string/includes? value query-token))
                       [[type value]]
                       (let [normal-value (normalize-text app-config value)
                             normal-query-token (normalize-text app-config query-token)
                             [before-text highlighted-text after-text] (split-text-on-highlight value query-token normal-value normal-query-token)]
                        [[:text before-text] 
                         [:match highlighted-text] 
                         [:text after-text]]))))
           (recur more)))))

(defn highlight-query* [app-config query text]
  (let [text-string (to-string text)]
    (if-not (seq text-string) [:span text-string]
      (let [normal-text (normalize-text app-config text-string)
            normal-query (normalize-text app-config query)]
        (cond 
          (and (string? query) (re-find #" " query))
          (span-with-mutliple-highlight-tokens app-config text-string query normal-text normal-query)
          ;; When the match is present and only a single token, highlight that token
          (string/includes? normal-text normal-query)
          (span-with-single-highlight-token text-string query normal-text normal-query)
          ;; Otherwise, just return the text
          :else
          [:span text-string])))))

;; result-item
(rum/defc root [{:keys [icon icon-theme query text info shortcut value-label value title highlighted on-highlight on-highlight-dep header on-click hoverable compact] :as _props :or {hoverable true}} 
                {:keys [app-config] :as context}]
  (let [ref (rum/create-ref)
        highlight-query (partial highlight-query* app-config query)]
    (rum/use-effect! 
      (fn [] 
        (when (and highlighted on-highlight) 
          (on-highlight ref)))
      [highlighted on-highlight-dep])
    [:div {:style {:opacity (if highlighted 1 0.8)
                   :mix-blend-mode (if highlighted :normal :luminosity)}
           :class (cond-> "flex flex-col grayscale" 
                    highlighted (str " !grayscale-0 !opacity-100 bg-gray-03-alpha dark:bg-gray-04-alpha")
                    hoverable (str " !rounded-lg transition-all duration-50 ease-in !opacity-75 hover:!opacity-100 hover:grayscale-0 hover:cursor-pointer hover:bg-gradient-to-r hover:from-gray-03-alpha hover:to-gray-01-alpha")
                    (not compact) (str  " py-4 px-6 gap-1")
                    compact (str " py-1.5 px-3.5 gap-0.5")
                    (not highlighted) (str " "))
           :ref ref
           :on-click (when on-click on-click)}
     ;; header
     (when header
      [:div.text-xs.pl-8.font-light {:class "-mt-1"
                                     :style {:color "var(--lx-gray-11)"}}
                                    (highlight-query header)])
     ;; main row
     [:div.flex.items-center.gap-3
      [:div.w-5.h-5.rounded.flex.items-center.justify-center 
       {:style {:background (when (#{:gradient} icon-theme) "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)")
                :box-shadow (when (#{:color :gradient} icon-theme) "inset 0 0 0 1px rgba(255,255,255,0.3) ")}
        :class (cond-> "w-5 h-5 rounded flex items-center justify-center" 
                 (= icon-theme :color) (str " bg-accent-10 dark:bg-accent-09 text-white") 
                 (= icon-theme :gray) (str " bg-gray-05 dark:bg-gray-05 text-white"))} 
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
        [:div {:class "flex gap-1"}
         (for [[index option] (map-indexed vector (string/split shortcut #" \| "))]
           [:<>
             (when (< 0 index)
               [:div.text-gray-11 "|"])
             (for [sequence (string/split option #" ")
                   :let [text (->> (string/split sequence #"\+")
                                   (map print-shortcut-key)
                                   (apply str))]]
               (button/root {:theme :gray 
                             :interactive false 
                             :text (string/upper-case (to-string text))
                             :tiled true}
                            context))])])]]))
        ; [:span {:style} (str key)])])])
