(ns logseq.shui.stories.badge-story
  (:require [logseq.shui.ui :as ui]
            [cljs-bean.core :as bean]
            [rum.core :as rum])
  (:require-macros [logseq.shui.storybook :refer [defmeta defstory]]))

(defmeta
  :Shui/Badge
  {:component ui/badge
   :argTypes  {:variant {:control :select
                         :options [:default :destructive :outline :secondary]}
               :class   {:control {:type :text}}}
   :args      {:children "a badge"
               :class    ""}})

(defstory Default {})