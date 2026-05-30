(ns mobile.components.ui
  "Mobile ui"
  (:require [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [mobile.components.popup :as popup]
            [react-transition-group :refer [CSSTransition TransitionGroup]]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc transition-group
  [opts & children]
  (into [:> TransitionGroup opts] children))

(hsx/defc css-transition
  [opts child]
  [:> CSSTransition opts child])

(hsx/defc notification-clear-all
  []
  [:div.ui__notifications-content
   [:div.pointer-events-auto.notification-clear
    (shui/button
     {:size :sm
      :on-click (fn []
                  (notification/clear-all!))}
      (t :notification/clear-all))]])

(hsx/defc notification-content
  [state content status uid]
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
       {:style
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
  (let [contents (state/use-sub :notification/contents)]
    (transition-group
     {:class-name "notifications ui__notifications"}
     (let [notifications
           (map (fn [el]
                  (let [k (first el)
                        v (second el)]
                    (css-transition
                     {:timeout 100
                      :key (name k)}
                     (fn [state]
                       (notification-content state (:content v) (:status v) k)))))
                contents)
           clear-all (when (> (count contents) 3)
                       (css-transition
                        {:timeout 100
                         :k "clear-all"}
                        (fn [_state]
                          (notification-clear-all))))
           items (if clear-all (cons clear-all notifications) notifications)]
       (doall items)))))

(defn open-popup!
  [content-fn opts]
  (popup/popup-show! nil content-fn opts))
