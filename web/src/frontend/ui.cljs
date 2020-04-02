(ns frontend.ui
  (:require [rum.core :as rum]
            [frontend.rum :as r]
            ["react-transition-group" :refer [TransitionGroup CSSTransition]]
            [frontend.util :as util]
            [frontend.mixins :as mixins]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))

(rum/defc dropdown-content-wrapper [state content]
  [:div.origin-top-right.absolute.right-0.mt-2.w-48.rounded-md.shadow-lg
   {:class (case state
             "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
             "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
             "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
             "exited" "transition ease-in duration-75 transform opacity-0 scale-95")}
   content])

;; public exports
(rum/defcs dropdown < (mixins/modal)
  [state content]
  (let [{:keys [open? toggle-fn]} state]
    [:div.ml-3.relative
     [:div
      [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline
       {:on-click toggle-fn}
       [:img.h-8.w-8.rounded-full
        {:src
         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}]]]
     (css-transition
      {:in @open? :timeout 0}
      (fn [state]
        (dropdown-content-wrapper state content)))]))

(defn dropdown-with-links
  [links]
  (dropdown
   [:div.py-1.rounded-md.bg-white.shadow-xs
    (for [{:keys [options title]} links]
      [:a.block.px-4.py-2.text-sm.text-gray-700.hover:bg-gray-100.transition.ease-in-out.duration-150
       (merge {:key (cljs.core/random-uuid)}
              options)
       title])]))

(rum/defc button
  [text on-click]
  [:button.inline-flex.items-center.px-3.py-2.border.border-transparent.text-sm.leading-4.font-medium.rounded-md.text-white.bg-indigo-600.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.active:bg-indigo-700.transition.ease-in-out.duration-150.mt-1
   {:type "button"
    :on-click on-click}
   text])
