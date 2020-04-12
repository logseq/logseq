(ns frontend.ui
  (:require [rum.core :as rum]
            [frontend.rum :as r]
            ["react-transition-group" :refer [TransitionGroup CSSTransition]]
            ["react-textarea-autosize" :as Textarea]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [goog.object :as gobj]
            [goog.dom :as gdom]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))

(defonce textarea-autosize (r/adapt-class (gobj/get Textarea "default")))

(rum/defc dropdown-content-wrapper [state content]
  [:div.origin-top-right.absolute.right-0.mt-2.w-48.rounded-md.shadow-lg
   {:class (case state
             "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
             "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
             "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
             "exited" "transition ease-in duration-75 transform opacity-0 scale-95")}
   content])

;; public exports
(rum/defcs dropdown < rum/reactive
  (mixins/modal)
  [state content]
  (let [{:keys [me]} (rum/react state/state)
        {:keys [open? toggle-fn]} state]
    [:div.ml-3.relative
     [:div
      [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline
       {:on-click toggle-fn}
       [:img.h-8.w-8.rounded-full
        {:src (:avatar me)}]]]
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

(rum/defc notification-content
  [state text status]
  (when (and text status)
      (let [[color-class svg] (case status
                             :success
                             ["text-gray-900"
                              [:svg.h-6.w-6.text-green-400
                               {:stroke "currentColor", :viewBox "0 0 24 24", :fill "none"}
                               [:path
                                {:d "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                                 :stroke-width "2",
                                 :stroke-linejoin "round",
                                 :stroke-linecap "round"}]]]
                             ["text-red-500"
                              [:svg.h-6.w-6.text-red-500
                               {:viewbox "0 0 20 20", :fill "currentColor"}
                               [:path
                                {:clip-rule "evenodd",
                                 :d
                                 "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z",
                                 :fill-rule "evenodd"}]]])]
     [:div.fixed.inset-0.flex.items-end.justify-center.px-4.py-6.pointer-events-none.sm:p-6.sm:items-start.sm:justify-end {:style {:top "3.2em"}}
      [:div.max-w-sm.w-full.bg-white.shadow-lg.rounded-lg.pointer-events-auto
       {:class (case state
                 "entering" "transition ease-out duration-300 transform opacity-0 translate-y-2 sm:translate-x-0"
                 "entered" "transition ease-out duration-300 transform translate-y-0 opacity-100 sm:translate-x-0"
                 "exiting" "transition ease-in duration-100 opacity-100"
                 "exited" "transition ease-in duration-100 opacity-0")}
       [:div.rounded-lg.shadow-xs.overflow-hidden
        [:div.p-4
         [:div.flex.items-start
          [:div.flex-shrink-0
           svg]
          [:div.ml-3.w-0.flex-1.pt-0.5
           [:p.text-sm.leading-5.font-medium {:style {:margin 0}
                                              :class color-class}
            text]]]]]]])))

(rum/defc notification < rum/reactive
  []
  (let [{:keys [:notification/show? :notification/text :notification/status]} (rum/react state/state)]
    (css-transition
     {:in show? :timeout 100}
     (fn [state]
       (notification-content state text status)))))

(rum/defc checkbox
  [option]
  [:input.form-checkbox.h-4.w-4.text-indigo-600.transition.duration-150.ease-in-out
   (merge {:type "checkbox"} option)])

(rum/defc badge
  [text option]
  [:span.inline-flex.items-center.px-2.5.py-0.5.rounded-full.text-xs.font-medium.leading-4.bg-purple-100.text-purple-800
   option
   text])

;; scroll
(defn main-node
  []
  (first (array-seq (js/document.querySelectorAll "main"))))

(defn get-scroll-top []
  (.-scrollTop (main-node)))

(defn on-scroll
  [on-load]
  (let [node (main-node)
        full-height (gobj/get node "scrollHeight")
        scroll-top (gobj/get node "scrollTop")
        client-height (gobj/get node "clientHeight")
        bottom-reached? (<= (- full-height scroll-top client-height) 200)]
    (when bottom-reached?
      (on-load))))

(defn attach-listeners
  "Attach scroll and resize listeners."
  [state]
  (let [opts (-> state :rum/args second)
        debounced-on-scroll (util/debounce 500 #(on-scroll (:on-load opts)))]
    (mixins/listen state (main-node) :scroll debounced-on-scroll)))

(rum/defcs infinite-list <
  (mixins/event-mixin attach-listeners)
  "Render an infinite list."
  [state body {:keys [on-load]
               :as opts}]
  body)
