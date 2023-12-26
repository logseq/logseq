(ns logseq.shui.stories.toaster-story
  (:require [logseq.shui.ui :as ui]
            [logseq.shui.toaster.core :as toaster]
            [rum.core :as rum])
  (:require-macros [logseq.shui.storybook :refer [defmeta defstory]]))

(defmeta
  :Shui/Toaster
  {:component #()
   :tags      ["autodocs"]
   :argTypes  {:title       {:control     :text
                             :description "`string` | `(ctx) => void` | `ReactElement`"}
               :description {:control     :text
                             :description "`string` | `(ctx) => void` | `ReactElement`"}
               :duration    {:control     :number
                             :description "milliseconds or 0 for not auto close!"
                             :table       {:defaultValue {:summary 5000}}}
               :variant     {:control     :select
                             :description "-"
                             :options     [:default :destructive :info :success :warning :error]}
               :onDismiss   {:type        :function
                             :description "hook on the toast item dismissed `func`"
                             :control     {:hideNoControlsWarning true}}
               :#Shadcn     {:description "https://ui.shadcn.com/docs/components/toast"
                             :control     {:hideNoControlsWarning true}
                             :table       {:category :more
                                           :type     {:detail nil}}}
               :#Radix      {:description "https://www.radix-ui.com/primitives/docs/components/toast#root"
                             :control     {:hideNoControlsWarning true}
                             :table       {:category :more
                                           :type     {:detail nil}}}}

   :args      {:title       ""
               :description "This is description content"
               :variant     :default
               :duration    3000}})

(defstory ImperativeAPI
  {:render
   (rum/defc Toaster [props]
     [:<>
      [:p.flex.space-x-3
       ;; basic
       (ui/button
         {:on-click
          #(ui/toast!
             [:b (:description props)]
             (:variant props)
             {:title    (:title props)
              :duration (:duration props)})}
         "open default toast")

       ;; update
       (ui/button
         {:class    "primary-yellow"
          :on-click #(ui/toast!
                       (fn [{:keys [dismiss! update!]}]
                         [:div
                          [:p.text-6xl.text-green-500 "toast content..."]
                          [:p.pt-4.space-x-2.flex
                           (ui/button
                             {:variant :destructive :size :sm :on-click dismiss!}
                             ":handle close")
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
