(ns frontend.ui
  (:require [rum.core :as rum]
            [frontend.rum :as r]
            ["react-transition-group" :refer [TransitionGroup CSSTransition]]
            ["react-textarea-autosize" :as TextareaAutosize]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [clojure.string :as string]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [medley.core :as medley]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))
(defonce textarea (r/adapt-class (gobj/get TextareaAutosize "default")))

(rum/defc dropdown-content-wrapper [state content class]
  (let [class (or class
                  (util/hiccup->class "origin-top-right.absolute.right-0.mt-2.w-48.rounded-md.shadow-lg"))]
    [:div
     {:class (str class " "
                  (case state
                    "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
                    "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
                    "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
                    "exited" "transition ease-in duration-75 transform opacity-0 scale-95"))}
     content]))

;; public exports
(rum/defcs dropdown < (mixins/modal)
  [state content-fn modal-content-fn modal-class]
  (let [{:keys [open? toggle-fn]} state
        modal-content (modal-content-fn state)]
    [:div.ml-1.relative {:style {:z-index 999}}
     (content-fn state)
     (css-transition
      {:in @open? :timeout 0}
      (fn [dropdown-state]
        (when @open?
          (dropdown-content-wrapper dropdown-state modal-content modal-class))))]))

(rum/defc menu-link
  [options child]
  [:a.block.px-4.py-2.text-sm.text-gray-700.hover:bg-gray-100.transition.ease-in-out.duration-150.cursor
   options
   child])

(rum/defc dropdown-with-links
  ([content-fn links]
   (dropdown-with-links content-fn links nil))
  ([content-fn links modal-class]
   (dropdown
    content-fn
    (fn [{:keys [close-fn] :as state}]
      [:div.py-1.rounded-md.bg-white.shadow-xs
       (for [{:keys [options title]} links]
         (let [new-options
               (assoc options
                      :on-click (fn []
                                  (when-let [on-click-fn (:on-click options)]
                                    (on-click-fn))
                                  (close-fn)
                                  ))]
           (menu-link
            (merge {:key (cljs.core/random-uuid)}
                   new-options)
            title)))])
    modal-class)))

(rum/defc button
  [text on-click & {:keys [background]}]
  (let [class "inline-flex.items-center.px-3.py-2.border.border-transparent.text-sm.leading-4.font-medium.rounded-md.text-white.bg-indigo-600.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.active:bg-indigo-700.transition.ease-in-out.duration-150.mt-1"
        class (if background (string/replace class "indigo" background) class)]
    [:button
     {:type "button"
      :class (util/hiccup->class class)
      :on-click on-click}
     text]))

(rum/defc notification-content
  [state content status]
  (when (and content status)
    (let [[color-class svg]
          (case status
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
              {:viewBox "0 0 20 20", :fill "currentColor"}
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
            [:div.text-sm.leading-5.font-medium {:style {:margin 0}
                                                 :class color-class}
             content]]
           [:div.ml-4.flex-shrink-0.flex
            [:button.inline-flex.text-gray-400.focus:outline-none.focus:text-gray-500.transition.ease-in-out.duration-150
             {:on-click (fn []
                          (swap! state/state assoc :notification/show? false))}
             [:svg.h-5.w-5
              {:fill "currentColor", :viewBox "0 0 20 20"}
              [:path
               {:clip-rule "evenodd",
                :d
                "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
                :fill-rule "evenodd"}]]]]]]]]])))

(rum/defc notification < rum/reactive
  []
  (let [show? (state/sub :notification/show?)
        status (state/sub :notification/status)
        content (state/sub :notification/content)]
    (css-transition
     {:in show? :timeout 100}
     (fn [state]
       (notification-content state content status)))))

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

(rum/defcs auto-complete <
  (rum/local 0 ::current-idx)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
        state
        {
         ;; up
         38 (fn [_ e]
              (let [current-idx (get state ::current-idx)]
                (util/stop e)
                (when (>= @current-idx 1)
                  (swap! current-idx dec))))
         ;; down
         40 (fn [state e]
              (let [current-idx (get state ::current-idx)
                    matched (first (:rum/args state))]
                (util/stop e)
                (let [total (count matched)]
                  (if (>= @current-idx (dec total))
                    (reset! current-idx 0)
                    (swap! current-idx inc)))))

         ;; enter
         13 (fn [state e]
              (let [current-idx (get state ::current-idx)
                    matched (first (:rum/args state))
                    on-chosen (nth (:rum/args state) 1)]
                (util/stop e)
                (on-chosen (nth matched @current-idx))))}
        nil)))
  [state matched on-chosen div-option & {:keys [empty-div]}]
  (let [current-idx (get state ::current-idx)]
    [:div.absolute.rounded-md.shadow-lg
     div-option
     [:div.py-1.rounded-md.bg-white.shadow-xs
      (if (seq matched)
        (for [[idx item] (medley/indexed matched)]
         (rum/with-key
           (menu-link
            {:style (merge
                     {:padding "6px"}
                     (when (= @current-idx idx)
                       {:background-color "rgb(213, 218, 223)"}))
             :class "initial-color"
             :tab-index 0
             :on-click (fn [e]
                         (util/stop e)
                         (let [option (nth matched @current-idx)]
                           (on-chosen option)))}
            item)
           idx))
        (when empty-div
          empty-div))]]))
