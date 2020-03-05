(ns frontend.ui
  (:require [rum.core :as rum]
            [frontend.rum :as r]
            ["react-transition-group" :refer [TransitionGroup CSSTransition]]
            [frontend.util :as util]
            [frontend.mixins :as mixins]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))

(defn css-transition-group
  [css-options items]
  (when (seq items)
    (transition-group
     (for [item items]
       (css-transition
        (merge {:key (cljs.core/random-uuid)} css-options)
        item)))))

(rum/defc dropdown-content-wrapper [state content]
  [:div.origin-top-right.absolute.right-0.mt-2.w-48.rounded-md.shadow-lg
   {:class (case state
             "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
             "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
             "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
             "exited" "transition ease-in duration-75 transform opacity-0 scale-95")}
   content])

;; public exports
(rum/defcs dropdown <
  (rum/local false ::show-dropdown?)
  (mixins/event-mixin #(mixins/simple-close-listener % ::show-dropdown?))
  [state content]
  (let [show-dropdown? (get state ::show-dropdown?)]
    [:div.ml-3.relative
     [:div
      [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline
       {:on-click (fn []
                    (swap! show-dropdown? not))}
       [:img.h-8.w-8.rounded-full
        {:src
         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}]]]
     (css-transition
      {:in @show-dropdown? :timeout 0}
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
