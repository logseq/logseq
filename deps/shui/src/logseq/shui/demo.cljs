(ns logseq.shui.demo
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]))

(rum/defc section-item
  [title children]
  [:section.mb-4
   [:h2.text-xl.font-semibold.py-2.italic.opacity-50 title]
   [:div.py-4 children]])

(rum/defc page []
  [:div.p-10
   [:h1.text-3xl.font-bold "Logseq UI"]
   [:hr]

   ;; Button
   (section-item "Button"
     [:div.flex.flex-row.space-x-2
      (let [[loading? set-loading!] (rum/use-state false)]
        (ui/button
          {:size     :sm
           :on-click (fn []
                       (set-loading! true)
                       (js/setTimeout #(set-loading! false) 5000))
           :disabled loading?}
          (when loading?
            (ui/tabler-icon "loader2" {:class "animate-spin"}))
          "Logseq Classic Button"
          (ui/tabler-icon "arrow-right")))

      (ui/button {:variant :outline :size :sm} "Outline")
      (ui/button {:variant :secondary :size :sm} "Secondary")
      (ui/button {:variant :destructive :size :sm} "Destructive")
      (ui/button {:class "primary-green" :size :sm} "Custom (.primary-green)")
      (ui/button
        {:variant :icon
         :size    :sm}
        [:a.flex.items-center.text-blue-rx-10.hover:text-blue-rx-10-alpha
         {:href "https://x.com/logseq" :target "_blank"}
         (ui/tabler-icon "brand-twitter" {:size 15})])])

   ;; Toast
   (section-item "Toast"
     [:div.flex.flex-row.space-x-2
      (ui/button
        {:size     :md
         :variant  :outline
         :on-click #(ui/toast!
                      "Check for updates ..."
                      (nth [:success :error :default :info :warning] (rand-int 3))
                      {:title    (if (odd? (js/Date.now)) "History of China" "")
                       :duration 3000})}
        "Open random toast"
        (ui/tabler-icon "arrow-right"))

      (ui/button
        {:variant  :secondary
         :size     :md
         :on-click (fn []
                     (ui/toast!
                       (fn [{:keys [id dismiss! update!]}]
                         [:b.text-red-700
                          [:p.flex.items-center.gap-2
                           (ui/tabler-icon "info-circle")
                           (str "#(" id ") ")
                           (.toLocaleString (js/Date.))]
                          [:div.flex.flex-row.gap-2
                           (ui/button
                             {:on-click #(dismiss! id) :size :sm}
                             "x close")

                           (ui/button
                             {:on-click #(update! {:title  (js/Date.now)
                                                   :action [:b (ui/button {:on-click (fn [] (ui/toast-dismiss!))} "clear all")]})
                              :size     :sm}
                             "x update")]])
                       :default
                       {:duration 3000 :onDismiss #(js/console.log "===>> dismiss?:" %1)}))}
        (ui/tabler-icon "apps")
        "Toast callback handle")])

   ;; Badge
   (section-item "Badge"
     [:div.flex.flex-row.space-x-2
      (ui/badge "Default")
      (ui/badge {:variant :outline} "Outline")
      (ui/badge {:variant :secondary} "Secondary")
      (ui/badge {:variant :destructive} "Destructive")
      (ui/badge {:class "primary-yellow"} "Custom (.primary-yellow)")])

   ;; Alert
   (section-item "Alert"
     [:<>
      (ui/alert
        {:class "text-orange-rx-09 border-orange-rx-07-alpha mb-4"}
        (ui/tabler-icon "brand-soundcloud")
        (ui/alert-title "Title is SoundCloud")
        (ui/alert-description
          "content: radix colors for Logseq"))
      (ui/alert
        (ui/tabler-icon "brand-github")
        (ui/alert-title "GitHub")
        (ui/alert-description
          "content: radix colors for Logseq"))])

   ;; Slider
   (section-item "Slider"
     (ui/slider))

   [:hr.my-10]])
