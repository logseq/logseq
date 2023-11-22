(ns logseq.shui.toaster.toaster-story
  (:require [logseq.shui.ui :as ui]
            [logseq.shui.toaster.core :as toaster]
            [rum.core :as rum])
  (:require-macros [logseq.shui.storybook :refer [defmeta defstory]]))

(defmeta
  :Shui/Toaster
  {:component #()})

(defstory ImperativeAPI
  {:render
   (rum/defc Toaster []
     [:<>
      [:p.flex.space-x-3
       ;; basic
       (ui/button
         {:on-click #(ui/toast! [:b.text-4xl.text-red-500 "hello"])}
         "open default toast")

       ;; update
       (ui/button
         {:class    "primary-yellow"
          :on-click #(ui/toast!
                       (fn [{:keys [dismiss! update!]}]
                         [:div
                          [:p.text-6xl.text-green-500 "toast content..."]
                          [:p.pt-4.space-x-2.flex
                           (ui/button {:variant :destructive :size :sm :on-click dismiss!} ":handle close")
                           (ui/button
                             {:size     :sm
                              :on-click (fn [] (update! {:title [:b.text-2xl (js/Date.now)]}))}
                             ":handle update")]]))}
         "open callback toast")

       ;; clear all
       (ui/button
         {:variant  :destructive
          :on-click #(ui/toast-dismiss!)}
         (ui/tabler-icon "x") "dismiss all")]

      ;; install toaster
      (toaster/install-toaster)
      ])})
