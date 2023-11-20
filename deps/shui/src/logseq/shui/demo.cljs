(ns logseq.shui.demo
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]))

(rum/defc page []
  [:div.p-10
   [:h1.text-2xl.text-red-500 "hello Logseq UI"]
   [:p.pt-5.charlie-radix-color
    "radix colors for Logseq"]
   [:hr.my-10]

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
                     [:b.text-red-700
                      (.toLocaleString (js/Date.))]))
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
