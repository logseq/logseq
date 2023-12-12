(ns logseq.shui.stories.button-story
  (:require [logseq.shui.ui :as ui]
            [cljs-bean.core :as bean]
            [rum.core :as rum])
  (:require-macros [logseq.shui.storybook :refer [defmeta defstory]]))

(defmeta
  :Shui/Button
  {:component ui/button
   :tags      ["autodocs"]
   :argTypes  {:size     {:control :select
                          :options [:default :md :sm :xs :lg :icon]}
               :variant  {:control :select
                          :options [:default :solid :destructive :outline :secondary :ghost :link]}
               :disabled {:control :boolean}
               :children {:description "`string` | `ReactElement`"
                          :control     {:hideNoControlsWarning true}}}
   :args      {:children "Button"
               :disabled false
               :variant  :default}})

(defstory Primary
  {:args
   {:variant  :default
    :size     :sm
    :children "Primary button"}})

(defstory Secondary
  {:args
   {:variant :secondary
    :children
    (fn []
      [:<>
       (ui/tabler-icon "brand-soundcloud")
       "Get Logseq Desktop"
       (ui/tabler-icon "arrow-right")])}})

(defstory LoadingButton
  {:args
   {:children
    (fn []
      [:<>
       (ui/tabler-icon "loader" {:class "animate-spin"})
       "Loading Button with custom icon"])}})





