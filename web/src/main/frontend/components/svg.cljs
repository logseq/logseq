(ns frontend.components.svg
  (:require [rum.core :as rum]))

(rum/defc arrow-down
  []
  [:svg
   {:aria-hidden "true",
    :height "16",
    :width "10",
    :version "1.1",
    :view-box "0 0 10 16"
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M5 11L0 6l1.5-1.5L5 8.25 8.5 4.5 10 6l-5 5z",
     :fill-rule "evenodd"}]])

(rum/defc arrow-right
  []
  [:svg
   {:aria-hidden "true",
    :height "16",
    :width "10",
    :version "1.1",
    :view-box "0 0 10 16"
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M7.5 8l-5 5L1 11.5 4.75 8 1 4.5 2.5 3l5 5z",
     :fill-rule "evenodd"}]])

(rum/defc caret-down
  []
  [:svg
   {:aria-hidden "true",
    :height "12",
    :width "10",
    :version "1.1",
    :view-box "0 0 192 512"
    :fill "currentColor"
    :display "inline-block"
    :style {:margin-left -2}}
   [:path
    {:d "M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z",
     :fill-rule "evenodd"}]]
  )

(rum/defc caret-right
  []
  [:svg
   {:aria-hidden "true",
    :height "12",
    :width "10",
    :version "1.1",
    :view-box "0 0 192 512"
    :fill "currentColor"
    :display "inline-block"}
   [:path
    {:d "M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z",
     :fill-rule "evenodd"}]])
