(ns logseq.shui.button.button-story
  (:require [logseq.shui.button.v2 :as shui-button]
            [logseq.shui.util :as shui-utils]
            [logseq.shui.ui :as ui]
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
               :disabled {:control :boolean}}
   :args      {:children "Button"
               :disabled false
               :variant  :default}})

(defstory Primary
  {:args
   {:variant :secondary
    :children
    (fn []
      [:<>
       (ui/tabler-icon "brand-soundcloud")
       "Get Logseq Desktop"
       (ui/tabler-icon "arrow-right")])}})

(defstory LoadingIcon
  {:args
   {:children
    (fn []
      [:<>
       (ui/tabler-icon "loader" {:class "animate-spin"})
       "Loading Button with custom icon"])}})





