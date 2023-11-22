(ns logseq.shui.demo
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]))

(rum/defc page []
  [:div.p-10
   [:h1.text-3xl.pb-8.font-bold "Logseq UI"]

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
       "content: radix colors for Logseq"))

   [:hr.my-10]

   (ui/button
     {:size     :sm :variant :default
      :on-click #(ui/toast!
                   "Check for updates ..."
                   (nth [:success :error :info :warning] (rand-int 3))
                   {:title    (if (odd? (js/Date.now)) "中国的历史" "")
                    :duration 2000})}
     "Open random toast"
     (ui/tabler-icon "arrow-right"))

   [:hr.my-10]

   (ui/slider)

   [:hr.my-10]
   [:p
    (ui/button
      {:variant  :default
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
                     {:duration 3000 :onDismiss #(js/console.log "===>> dismiss?:" %1)}))
       :class    "primary-orange"}
      (ui/tabler-icon "brand-soundcloud")
      "Get SoundCloud (.primary-{color})")]
   [:hr.my-10]

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
       (ui/tabler-icon "arrow-right")))])
