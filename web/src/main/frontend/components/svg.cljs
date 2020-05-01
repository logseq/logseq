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
    :style {
            :margin-left -3
            :margin-top -1}}
   [:path
    {:d "M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z",
     :fill-rule "evenodd"}]])

(rum/defc caret-right
  []
  [:svg
   {:aria-hidden "true",
    :height "12",
    :width "10",
    :version "1.1",
    :view-box "0 0 192 512"
    :fill "currentColor"
    :display "inline-block"
    :style {:margin-top -1}}
   [:path
    {:d "M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z",
     :fill-rule "evenodd"}]])

(defn icon
  [d]
  [:svg
   {:fill "none", :view-box "0 0 24 24", :height "24", :width "24"}
   [:path
    {:stroke-linejoin "round",
     :stroke-linecap "round",
     :stroke-width "2",
     :stroke "currentColor",
     :d d}]])

(rum/defc star-outline
  [class]
  [:svg
   {:fill "none", :view-box "0 0 24 24", :height "24", :width "24"
    :class class}
   [:path
    {:stroke-linejoin "round",
     :stroke-linecap "round",
     :stroke-width "2",
     :stroke "currentColor",
     :d
     "M11.0489 2.92707C11.3483 2.00576 12.6517 2.00576 12.9511 2.92707L14.4697 7.60083C14.6035 8.01285 14.9875 8.29181 15.4207 8.29181H20.335C21.3037 8.29181 21.7065 9.53143 20.9228 10.1008L16.947 12.9894C16.5965 13.244 16.4499 13.6954 16.5838 14.1074L18.1024 18.7812C18.4017 19.7025 17.3472 20.4686 16.5635 19.8992L12.5878 17.0107C12.2373 16.756 11.7627 16.756 11.4122 17.0107L7.43647 19.8992C6.65276 20.4686 5.59828 19.7025 5.89763 18.7812L7.41623 14.1074C7.5501 13.6954 7.40344 13.244 7.05296 12.9894L3.07722 10.1008C2.2935 9.53143 2.69628 8.29181 3.665 8.29181H8.57929C9.01251 8.29181 9.39647 8.01285 9.53034 7.60083L11.0489 2.92707Z"}]])

(rum/defc star-solid
  [class]
  [:svg
   {:fill "none", :view-box "0 0 20 20", :height "20", :width "20"
    :class class}
   [:path
    {:fill "currentColor",
     :d
     "M9.04893 2.92707C9.34828 2.00576 10.6517 2.00576 10.951 2.92707L12.0206 6.21886C12.1545 6.63089 12.5384 6.90985 12.9717 6.90985H16.4329C17.4016 6.90985 17.8044 8.14946 17.0207 8.71886L14.2205 10.7533C13.87 11.0079 13.7233 11.4593 13.8572 11.8713L14.9268 15.1631C15.2261 16.0844 14.1717 16.8506 13.3879 16.2812L10.5878 14.2467C10.2373 13.9921 9.76269 13.9921 9.4122 14.2467L6.61203 16.2812C5.82832 16.8506 4.77384 16.0844 5.07319 15.1631L6.14276 11.8713C6.27663 11.4593 6.12997 11.0079 5.77949 10.7533L2.97932 8.71886C2.1956 8.14946 2.59838 6.90985 3.5671 6.90985H7.0283C7.46153 6.90985 7.84548 6.63089 7.97936 6.21886L9.04893 2.92707Z"
     :stroke-width "2",
     :stroke-linejoin "round",
     :stroke-linecap "round"}]]
  )
