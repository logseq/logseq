(ns logseq.shui.button.v2
  (:require
    [clojure.string :as str]
    [rum.core :as rum]
    [logseq.shui.icon.v2 :as icon]
    [clojure.string :as string]))

(rum/defcs root < rum/reactive
  {:init (fn [state]
           (assoc state ::theme (atom
                                 (or (:theme (first (:rum/args state))) :color))))}
  [state {:keys [theme hover-theme color text depth size icon interactive shortcut tiled on-click muted disabled? class href button-props icon-props]
          :or {theme :color depth 1 size :md interactive true muted false class ""}} context]
  (let [*theme (::theme state)
        color-string (or (some-> color name) (some-> context :state rum/react :ui/radix-color name) "custom")
        theme (rum/react *theme)
        theme-class (str "shui__button-theme-" (if (keyword? theme) (name theme) "color"))
        depth-class (when-not (= :text theme) (str "shui__button-depth-" depth))
        color-class (str "shui__button-color-" color-string)
        muted-class (when muted "shui__button-muted")
        size-class  (str "shui__button-size-" (name size))
        tiled-class (when tiled "shui__button-tiled")
        on-click (fn [e]
                   (when href (set! (.-href js/window.location) href))
                   (when on-click (on-click e)))]
    [:button.ui__button.shui__button
     (merge
      button-props
      (cond->
       {:class (str theme-class " " depth-class " " color-class " " size-class " " tiled-class " " muted-class " " class)
        :disabled (boolean disabled?)
        :on-mouse-over #(when hover-theme (reset! *theme hover-theme))
        :on-mouse-out #(reset! *theme theme)}
        on-click
        (assoc :on-click on-click)))
     (if-not tiled text
             (for [[index tile] (map-indexed vector (rest (string/split text #"")))]
               [:<>
                (when (< 0 index)
                  [:div.shui__button__tile-separator])
                [:div.shui__button__tile tile]]))

     (when icon
       (icon/root icon icon-props))
     (when (not-empty shortcut)
       (for [key shortcut]
         [:div.shui__button-shortcut-key
          (case key
            "cmd" [:div "⌘"]
            "shift" [:div "⇧"]
            "return" [:div "↵"]
            "esc" [:div.tracking-tightest {:style {:transform "scaleX(0.8) scaleY(1.2) "
                                                   :font-size "0.5rem"
                                                   :font-weight "500"}} "ESC"]
            (cond-> key (string? key) .toUpperCase))]))]))
