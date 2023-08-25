(ns logseq.shui.list-item.v1
  (:require 
    [rum.core :as rum]
    [clojure.string :as string]
    [logseq.shui.icon.v2 :as icon]
    [logseq.shui.button.v2 :as button]))

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
    ("disabled") ""
    ("backspace" "delete") ""
    ("tab") ""
    (nil) ""
    (name key)))

;; result-item
(rum/defc root [{:keys [icon icon-theme text info shortcut value-label value title highlighted on-highlight on-highlight-dep header on-click]}]
  (let [ref (rum/create-ref)]
    (rum/use-effect! 
      (fn [] 
        (when (and highlighted on-highlight) 
          (on-highlight ref)))
      [highlighted on-highlight-dep])

    [:div.flex.flex-col.px-6.gap-1.py-4 {:style {:background (if highlighted "var(--lx-gray-04-alpha)" "var(--lx-gray-02)")
                                                 :opacity (if highlighted 1 0.8)
                                                 :mix-blend-mode (if highlighted :normal :luminosity)}
                                         :ref ref
                                         :on-click (when on-click on-click)}
     ;; header
     (when header
      [:div.text-xs.pl-8.font-light {:class "-mt-1"
                                     :style {:color "var(--lx-gray-11)"}}
                                    header])
     ;; main row
     [:div.flex.items-center.gap-3
      [:div.w-5.h-5.rounded.flex.items-center.justify-center 
       {:style {:background (case icon-theme :color "var(--lx-accent-09)" :gray "var(--lx-gray-09)" :gradient "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)" "var(--lx-gray-09)")
                :box-shadow (when (#{:color :gradient} icon-theme) "inset 0 0 0 1px rgba(255,255,255,0.3) ")}}
       (icon/root icon {:size "14"})]
      [:div.flex.flex-1.flex-col
       (when title
         [:div.text-sm.pb-2.font-bold {:style {:color "var(--lx-gray-11)"}} title])
       [:div {:class "text-sm font-medium"
              :style {:color "var(--lx-gray-12)"}} text
        (when info 
          [:span {:style {:color "var(--lx-gray-11)"}} (str " — " info)])]]
      (when (or value-label value)
        [:div {:class "text-xs"}
         (when (and value-label value)
           [:span {:style {:color "var(--lx-gray-11)"}} (str value-label ": ")])
         (when (and value-label (not value))
           [:span {:style {:color "var(--lx-gray-11)"}} (str value-label)])
         (when value
           [:span {:style {:color "var(--lx-gray-12)"}} value])])
      (when shortcut 
        [:div {:class "flex gap-1"}
         (for [[index option] (map-indexed vector (string/split shortcut #" \| "))]
           [:<>
             (when (< 0 index)
               [:div {:style {:color "var(--lx-gray-11)"}} "|"])
             (for [sequence (string/split option #" ")
                   :let [text (->> (string/split sequence #"\+")
                                   (map print-shortcut-key)
                                   (apply str))]]
               (button/root {:theme :gray 
                             :interactive false 
                             :text text
                             :tiled true}))])])]]))
        ; [:span {:style} (str key)])])])
