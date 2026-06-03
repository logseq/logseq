(ns mobile.components.ui
  "Mobile ui"
  (:require [cljs-bean.core :as bean]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.rfx :as rfx]
            [logseq.shui.ui :as shui]
            [mobile.components.popup :as popup]
            ["react" :as react]
            [react-transition-group :refer [CSSTransition TransitionGroup]]
            [io.factorhouse.hsx.core :as hsx]))

(defn- normalize-react-props
  [opts]
  (bean/->js
   (cond-> (or opts {})
     (:class-name opts)
     (assoc :className (:class-name opts))

     true
     (dissoc :class-name))))

(defn- react-child
  [child]
  (cond
    (vector? child) (hsx/create-element child)
    :else child))

(defn- react-children
  [children]
  (->> children
       (mapcat (fn [child]
                 (cond
                   (nil? child) []
                   (and (sequential? child) (not (vector? child))) child
                   :else [child])))
       (remove nil?)
       (map react-child)))

(defn- react-element
  [component opts children]
  (apply react/createElement component (normalize-react-props opts) (react-children children)))

(defn transition-group
  [opts & children]
  (react-element TransitionGroup opts children))

(defn css-transition
  [opts & children]
  (let [node-ref (or (:node-ref opts) (react/createRef))
        opts (assoc opts :nodeRef node-ref)
        children (map (fn [child]
                        (if (fn? child)
                          (fn [state]
                            (child state node-ref))
                          child))
                      children)]
    (react-element CSSTransition opts children)))

(hsx/defc notification-clear-all
  [node-ref]
  [:div.ui__notifications-content
   {:ref node-ref}
   [:div.pointer-events-auto.notification-clear
    (shui/button
     {:size :sm
      :on-click (fn []
                  (notification/clear-all!))}
      (t :notification/clear-all))]])

(hsx/defc notification-content
  [state content status uid node-ref]
  (when (and content status)
    (let [svg
          (if (keyword? status)
            (case status
              :success
              (shui/tabler-icon "circle-check" {:class "text-green-600" :size "20"})

              :warning
              (shui/tabler-icon "alert-circle" {:class "text-yellow-600" :size "20"})

              :error
              (shui/tabler-icon "circle-x" {:class "text-red-600" :size "20"})

              (shui/tabler-icon "info-circle" {:class "text-indigo-600" :size "20"}))
            status)]
      [:div.ui__notifications-content
       {:ref node-ref
        :style
        (when (or (= state "exiting")
                  (= state "exited"))
          {:z-index -1})}
       [:div.max-w-sm.w-full.shadow-lg.rounded-lg.pointer-events-auto.notification-area
        {:class (case state
                  "entering" "transition ease-out duration-300 transform opacity-0 translate-y-2 sm:translate-x-0"
                  "entered" "transition ease-out duration-300 transform translate-y-0 opacity-100 sm:translate-x-0"
                  "exiting" "transition ease-in duration-100 opacity-100"
                  "exited" "transition ease-in duration-100 opacity-0")}
        [:div.rounded-lg.shadow-xs {:style {:max-height "calc(100vh - 200px)"
                                            :overflow-y "auto"
                                            :overflow-x "hidden"}}
         [:div.p-4
          [:div.flex.items-start
           [:div.flex-shrink-0.pt-2
            svg]
           [:div.ml-3.w-0.flex-1.pt-2

            [:div.text-sm.leading-5.font-medium.whitespace-pre-line {:style {:margin 0}}
             content]]
           [:div.flex-shrink-0.flex {:style {:margin-top -9
                                             :margin-right -18}}
            (shui/button
             {:variant :icon
              :size :sm
              :on-click (fn []
                          (notification/clear! uid))}
             [:span {:slot "icon-only"}
              (shui/tabler-icon "x")])]]]]]])))

(hsx/defc install-notifications
  []
  (let [contents (rfx/use-sub [:notification/contents])]
    (transition-group
     {:class-name "notifications ui__notifications"}
     (let [notifications
           (map (fn [el]
                  (let [k (first el)
                        v (second el)]
                    (css-transition
                     {:timeout 100
                      :key (name k)}
                     (fn [state node-ref]
                       (notification-content state (:content v) (:status v) k node-ref)))))
                contents)
           clear-all (when (> (count contents) 3)
                       (css-transition
                        {:timeout 100
                         :key "clear-all"}
                        (fn [_state node-ref]
                          (notification-clear-all node-ref))))
           items (if clear-all (cons clear-all notifications) notifications)]
       (doall items)))))

(defn open-popup!
  [content-fn opts]
  (popup/popup-show! nil content-fn opts))
