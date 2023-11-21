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
       (ui/button
         {:on-click #(ui/toast! [:b.text-4xl.text-red-500 "hello"])}
         "open default toast")

       (ui/button
         {:class "primary-yellow"
          :on-click #(ui/toast!
                       (fn [{:keys [dismiss!]}]
                         [:div
                          [:p.text-6xl.text-green-500 "toast content..."]
                          [:p.pt-4.space-x-2.flex
                           (ui/button {:variant :destructive :size :sm :on-click dismiss!} ":handle close")
                           (ui/button {:size :sm :on-click (fn [])} ":handle update")]]))}
         "open callback toast")]

      ;; install toaster
      (toaster/install-toaster)
      ])})
