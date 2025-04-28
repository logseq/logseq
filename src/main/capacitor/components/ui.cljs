(ns capacitor.components.ui
  (:require [frontend.handler.notification :as notification]
            [frontend.rum :as r]
            [frontend.state :as fstate]
            [react-transition-group :refer [CSSTransition TransitionGroup]]
            [rum.core :as rum]
            [capacitor.ionic :as ionic]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))

(rum/defc safe-page-container
  [content {:keys [header-content page-props content-props]}]
  (ionic/ion-page
    (merge {:class "app-safe-page"} page-props)
    (some-> header-content (ionic/ion-header))
    (ionic/ion-content
      (merge {:class "ion-padding"} content-props)
      content)))

(rum/defc notification-clear-all
  []
  [:div.ui__notifications-content
   [:div.pointer-events-auto.notification-clear
    (ionic/ion-button
      {:on-click (fn []
                   (notification/clear-all!))}
      "clear all")]])

(rum/defc notification-content
  [state content status uid]
  (when (and content status)
    (let [svg
          (if (keyword? status)
            (case status
              :success
              (ionic/tabler-icon "circle-check" {:class "text-green-600" :size "20"})

              :warning
              (ionic/tabler-icon "alert-circle" {:class "text-yellow-600" :size "20"})

              :error
              (ionic/tabler-icon "circle-x" {:class "text-red-600" :size "20"})

              (ionic/tabler-icon "info-circle" {:class "text-indigo-600" :size "20"}))
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
            (ionic/ion-button
              {:fill "clear"
               :mode "ios"
               :shape "round"
               :on-click (fn []
                           (notification/clear! uid))}
              [:span {:slot "icon-only"}
               (ionic/tabler-icon "x")])]]]]]])))

(rum/defc install-notifications < rum/reactive
  []
  (let [contents (fstate/sub :notification/contents)]
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

(rum/defc simple-modal
  [{:keys [close! as-page? modal-props]} children]
  (let [{:keys [class]} modal-props]
    (ionic/ion-modal
      (merge modal-props
        {:is-open true
         :onWillDismiss (fn [] (close!))
         :class (str class (when (not (true? as-page?)) " ion-datetime-button-overlay"))})
      (if (fn? children)
        (children) children))))
