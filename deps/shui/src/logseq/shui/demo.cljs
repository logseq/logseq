(ns logseq.shui.demo
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]))

(rum/defc page []
  [:div.p-10
   [:h1.text-2xl.text-red-500 "hello Logseq UI"]
   [:p.pt-5.charlie-radix-color
    "radix colors for Logseq"]
   [:hr.my-10]

   (ui/button
     {:size     :sm :variant :default
      :on-click #(ui/toast!
                   (fn [{:keys [dismiss!]}]
                     [:<>
                      [:b.text-2xl "abc"]
                      (ui/button {:on-click (fn [] (ui/toast-dismiss!))} "close")])
                   :default
                   {:action
                    [:b.text-4xl.text-red-500
                     {:on-click (fn [] (ui/toast-dismiss!))}
                     "close me"]})}

     "abc"

     (ui/tabler-icon "arrow-right"))

   [:div.ls-card.content "hello world"]


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
