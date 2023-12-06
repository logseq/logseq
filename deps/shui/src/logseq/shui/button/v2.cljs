(ns logseq.shui.button.v2
  (:require
    [clojure.string :as str]
    [rum.core :as rum]
    [logseq.shui.icon.v2 :as icon]
    [clojure.string :as string]
    [goog.userAgent]))

(rum/defcs root < rum/reactive
  (rum/local nil ::hover-theme)
  [state {:keys [theme hover-theme color text depth size icon interactive shortcut tiled tiles on-click muted disabled? class href button-props icon-props]
          :or {theme :color depth 1 size :md interactive true muted false class ""}} context]
  (let [*hover-theme (::hover-theme state)
        color-string (or (some-> color name) (some-> context :state rum/react :ui/radix-color name) "custom")
        theme (or @*hover-theme theme)
        theme-class (str "ui__button-theme-" (if (keyword? theme) (name theme) "color"))
        depth-class (when-not (= :text theme) (str "ui__button-depth-" depth))
        color-class (str "ui__button-color-" color-string)
        muted-class (when muted "ui__button-muted")
        size-class  (str "ui__button-size-" (name size))
        tiled-class (when tiled "ui__button-tiled")
        on-click (fn [e]
                   (when href (set! (.-href js/window.location) href))
                   (when on-click (on-click e)))]
    [:button.ui__button
     (merge
      button-props
      (cond->
       {:class (str theme-class " " depth-class " " color-class " " size-class " " tiled-class " " muted-class " " class)
        :disabled (boolean disabled?)
        :on-mouse-over #(when hover-theme (reset! *hover-theme hover-theme))
        :on-mouse-out #(reset! *hover-theme nil)}
        on-click
        (assoc :on-click on-click)))
     (if (and tiled (or text tiles))
       (for [[index tile] (map-indexed vector
                                       (or tiles (and text (rest (string/split text #"")))))]
         [:<>
          (when (< 0 index)
            [:div.ui__button__tile-separator])
          [:div.ui__button__tile tile]])
       text)

     (when icon
       (icon/root icon icon-props))
     (when (not-empty shortcut)
       (for [key shortcut]
         [:div.ui__button-shortcut-key
          (case key
            "cmd" [:div (if goog.userAgent/MAC "⌘" "Ctrl")]
            "shift" [:div "⇧"]
            "return" [:div "⏎"]
            "esc" [:div.tracking-tightest {:style {:transform "scaleX(0.8) scaleY(1.2) "
                                                   :font-size "0.5rem"
                                                   :font-weight "500"}} "ESC"]
            (cond-> key (string? key) .toUpperCase))]))]))
