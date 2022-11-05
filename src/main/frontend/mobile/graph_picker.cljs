(ns frontend.mobile.graph-picker
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.handler.notification :as notification]))

(rum/defc graph-picker-cp
  []
  [:div.flex.flex-col.w-full.px-10.space-y-4.pt-8
   (ui/button
    [:span.flex.items-center.justify-between.w-full.py-1
     [:strong "Create a new graph"]
     (ui/icon "chevron-right")]

    :on-click #(notification/show! "Hi Graph :)"))

   (ui/button
    [:span.flex.items-center.justify-between.w-full.py-1
     [:strong "Select an existing graph"]
     (ui/icon "folder-plus")]

    :intent "logseq"
    :on-click #(notification/show! "Hi Folder :)"))])
