(ns frontend.reaction
  "Utilities for block reactions"
  (:require ["@emoji-mart/data" :as emoji-data]
            [clojure.string :as string]
            [frontend.common.reaction :as common-reaction]
            [goog.object :as gobj]))

(defonce emoji-id-set
  (let [emojis (gobj/get emoji-data "emojis")]
    (set (js/Object.keys emojis))))

(defn emoji-id-valid?
  [emoji-id]
  (and (string? emoji-id)
       (not (string/blank? emoji-id))
       (contains? emoji-id-set emoji-id)))

(def summarize common-reaction/summarize)
