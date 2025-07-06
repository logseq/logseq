(ns mobile.components.ui
  "Mobile ui"
  (:require [cljs-bean.core :as bean]
            [frontend.handler.notification :as notification]
            [frontend.rum :as r]
            [frontend.state :as state]
            [medley.core :as medley]
            [mobile.ionic :as ion]
            [mobile.state :as mobile-state]
            [react-transition-group :refer [CSSTransition TransitionGroup]]
            [rum.core :as rum]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))

(rum/defc classic-app-container-wrap
  [content]
  [:main#app-container-wrapper.ls-fold-button-on-right
   [:div#app-container.pt-2
    [:div#main-container.flex.flex-1
     [:div.w-full content]]]])

(rum/defc notification-clear-all
  []
  [:div.ui__notifications-content
   [:div.pointer-events-auto.notification-clear
    (ion/button
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
              (ion/tabler-icon "circle-check" {:class "text-green-600" :size "20"})

              :warning
              (ion/tabler-icon "alert-circle" {:class "text-yellow-600" :size "20"})

              :error
              (ion/tabler-icon "circle-x" {:class "text-red-600" :size "20"})

              (ion/tabler-icon "info-circle" {:class "text-indigo-600" :size "20"}))
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
            (ion/button
             {:fill "clear"
              :mode "ios"
              :shape "round"
              :on-click (fn []
                          (notification/clear! uid))}
             [:span {:slot "icon-only"}
              (ion/tabler-icon "x")])]]]]]])))

(rum/defc install-notifications < rum/reactive
  []
  (let [contents (state/sub :notification/contents)]
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

(defonce *modals (atom []))
(defonce ^:private *id (atom 0))
(defonce ^:private gen-id #(reset! *id (inc @*id)))

(rum/defc x-modal
  [{:keys [close! as-page? type on-action title buttons inputs modal-props]} content]
  (let [{:keys [class header]} modal-props]
    (case type
      :alert
      (ion/alert
       (merge modal-props
              {:is-open true
               :header (or title header)
               :message content
               :backdropDismiss false
               :onWillDismiss (fn [^js e]
                                (when on-action
                                  (on-action (bean/->clj (.-detail e))))
                                (close!))
               :buttons (bean/->js (or buttons (:buttons modal-props)))
               :inputs (bean/->js (or inputs (:inputs modal-props) []))}))

      :action-sheet
      (ion/action-sheet
       (merge modal-props
              {:is-open true
               :header (or content title header)
               :onWillDismiss (fn [^js e]
                                (when on-action
                                  (on-action (bean/->clj (.-detail e))))
                                (close!))
               :buttons (bean/->js (or buttons (:buttons modal-props)))}))

      ;; default
      (ion/modal
       (merge modal-props
              {:is-open true
               :onWillDismiss (fn [] (close!))
               :class (str class (when (not (true? as-page?)) " ion-datetime-button-overlay"))})
       (if (fn? content)
         (content) content)))))

(defn get-modal
  ([] (some-> @*modals last))
  ([id]
   (when id
     (some->> (medley/indexed @*modals)
              (filter #(= id (:id (second %)))) (first)))))

(defn- upsert-modal!
  [config]
  (when-let [id (:id config)]
    (if-let [[index config'] (get-modal id)]
      (swap! *modals assoc index (merge config' config))
      (swap! *modals conj config)) id))

(defn- delete-modal!
  [id]
  (when-let [[index _] (get-modal id)]
    (swap! *modals #(->> % (medley/remove-nth index) (vec)))))

(defn open-modal!
  [content & {:keys [id type] :as props}]
  (upsert-modal!
   (merge props
          {:id (or id (gen-id))
           :type (or type :default)                             ;; :alert :confirm :page
           :as-page? (= type :page)
           :content content})))

(defn close-modal!
  ([] (some-> @*modals (last) :id (close-modal!)))
  ([id] (delete-modal! id)))

(defn open-popup!
  [content-fn opts]
  (mobile-state/set-popup!
   {:open? true
    :content-fn content-fn
    :opts opts}))

(defn close-popup! []
  (some-> mobile-state/*popup-data
          (swap! assoc :open? false)))

(rum/defc install-modals []
  (let [_ (r/use-atom *modals)]
    [:<>
     (for [{:keys [id content] :as props} @*modals
           :let [close! #(close-modal! id)
                 props' (assoc props :close! close!)]]
       (x-modal props'
                (if (fn? content) (content props') content)))]))
