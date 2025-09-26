(ns mobile.components.ui
  "Mobile ui"
  (:require [frontend.handler.notification :as notification]
            [frontend.rum :as r]
            [frontend.state :as state]
            [logseq.shui.silkhq :as silkhq]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
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

(rum/defc keep-keyboard-virtual-input
  ([] (keep-keyboard-virtual-input ""))
  ([t]
   [:input.absolute.top-4.left-0.w-1.h-1.opacity-0
    {:id (str "keep-keyboard-open-input" t)
     :auto-capitalize "off"
     :auto-correct "false"}]))

(rum/defc notification-clear-all
  []
  [:div.ui__notifications-content
   [:div.pointer-events-auto.notification-clear
    (shui/button
     {:size :sm
      :on-click (fn []
                  (notification/clear-all!))}
     "clear all")]])

(rum/defc notification-content
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

(rum/defc x-modal
  [{:keys [close! _as-page? type on-action title buttons _inputs modal-props]} content]
  (let [{:keys [_class header]} modal-props]
    (case type
      :action-sheet
      (silkhq/bottom-sheet
       (merge modal-props
              {:presented true
               :onPresentedChange (fn [v?] (when (false? v?)
                                             (js/setTimeout #(close!) 200)))})
       (let [title (or title header content)
             content (for [{:keys [role text] :as item} buttons]
                       [:a.as-item-btn
                        {:data-role role
                         :on-pointer-down (fn []
                                            (some-> on-action (apply [item]))
                                            (close!))}
                        text])]
         (silkhq/bottom-sheet-portal
          (silkhq/bottom-sheet-view {:as-child true}
                                    (silkhq/bottom-sheet-backdrop)
                                    (silkhq/bottom-sheet-content
                                     [:div.flex.flex-col.items-center.gap-2.app-silk-action-sheet-modal-content
                                      (silkhq/bottom-sheet-handle {:class "my-2"})
                                      (some-> title (silkhq/bottom-sheet-title))
                                      [:div.as-list-container content]])))))

      ;; default
      (silkhq/bottom-sheet
       (merge modal-props
              {:presented true
               :onPresentedChange (fn [v?] (when (false? v?) (close!)))})
       (silkhq/bottom-sheet-portal
        (silkhq/bottom-sheet-view {:as-child true}
                                  (silkhq/bottom-sheet-backdrop)
                                  (silkhq/bottom-sheet-content
                                   (if (fn? content)
                                     (content) content))))))))

(defn get-modal
  ([] (some-> @*modals last))
  ([id]
   (when id
     (some->> (medley/indexed @*modals)
              (filter #(= id (:id (second %)))) (first)))))

(defn- delete-modal!
  [id]
  (when-let [[index _] (get-modal id)]
    (swap! *modals #(->> % (medley/remove-nth index) (vec)))))

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
