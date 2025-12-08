(ns logseq.shui.form.password
  (:require [clojure.string :as string]
            [logseq.shui.base.core :as base-core]
            [logseq.shui.form.core :as form-core]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.icon.v2 :as icon-v2]
            [rum.core :as rum]))

(rum/defc toggle-password
  [option]
  (let [[visible? set-visible!] (hooks/use-state false)]
    [:div.ls-toggle-password-input.relative
     (form-core/input
      (merge
       option
       {:type (if visible? "text" "password")}))
     (when-not (string/blank? (:value option))
       (base-core/button
        {:variant :ghost
         :class "absolute right-1"
         :style {:top 6}
         :size :sm
         :on-click #(set-visible! (not visible?))}
        (icon-v2/root (if visible? "eye-off" "eye"))))]))
