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
   :argTypes  {:size    {:control :select
                         :options [:default :sm :lg :icon]}
               :variant {:control :select
                         :options [:default :destructive :outline :secondary :ghost :link]}
               :disabled {:control :boolean}}
   :args      {:children "Button"
               :variant  :default}})

(defstory Primary
  {:args {:variant :default}})

(defstory Icon
  {:args
   {:children (fn [] (ui/tabler-icon "adjustments-horizontal"))
    :class "scale-150"
    :size :icon}})





