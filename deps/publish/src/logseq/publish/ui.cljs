(ns logseq.publish.ui
  (:require [rum.core :as rum]))

(defn checkbox
  [option]
  [:input.form-checkbox.h-4.w-4.transition.duration-150.ease-in-out
   (merge {:type "checkbox"} option)])

(rum/defc caret-right
  []
  [:svg.h-4.w-4
   {:aria-hidden "true"
    :version     "1.1"
    :view-box    "0 0 192 512"
    :fill        "currentColor"
    :display     "inline-block"
    :style       {:margin-left 2}}
   [:path
    {:d         "M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z"
     :fill-rule "evenodd"}]])

(rum/defc rotating-arrow
  [collapsed?]
  [:span
   {:class (if collapsed? "rotating-arrow collapsed" "rotating-arrow not-collapsed")}
   (caret-right)])
