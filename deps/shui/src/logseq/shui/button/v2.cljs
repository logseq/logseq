(ns logseq.shui.button.v2
  (:require 
    [clojure.string :as str]
    [logseq.shui.util :as util]
    [rum.core :as rum]
    [logseq.shui.icon.v2 :as icon]))

(rum/defc root 
  [{:keys [theme text depth size icon shortcut] :or {theme :color depth 1 size :md}} context]
  (let [theme-class (str "shui__button-theme-" (name theme))
        depth-class (str "shui__button-depth-" depth) 
        color-class (str "shui__button-color-" (some-> context :state deref :ui/radix-color name))
        size-class  (str "shui__button-size-" (name size))]
    [:button.shui__button {:class (str theme-class " " depth-class " " color-class " " size-class)} 
     text
     (when icon 
       (icon/root icon))
     (when (not-empty shortcut)
       (for [key shortcut]
         [:div.shui__button-shortcut-key
          (case key 
            "cmd" (icon/root "command") 
            "shift" (icon/root "arrow-big-up-filled")
            "return" (icon/root "arrow-back")
            key)]))]))
          
     
   
