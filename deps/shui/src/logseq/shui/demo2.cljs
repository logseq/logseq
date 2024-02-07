(ns logseq.shui.demo2
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [frontend.rum :refer [use-atom]]))

(defonce *x-popup-state
  (atom {:open? false :content nil :position [0 0]}))

(defn show-x-popup!
  [^js event content & {:keys [as-menu? root-props content-props]}]
  (let [x (.-clientX event)
        y (.-clientY event)]
    (reset! *x-popup-state
      {:open? true :content content :position [x y]
       :as-menu? as-menu? :root-props root-props :content-props content-props})))

(defn hide-x-popup!
  []
  (reset! *x-popup-state
    {:open? false :content nil :position [0 0] :as-menu? false}))

(rum/defc x-popup []
  (let [[{:keys [open? content position as-menu? root-props content-props]} _] (use-atom *x-popup-state)]
    (when-let [[x y] position]
      (let [popup-root (if as-menu? ui/dropdown-menu ui/popover)
            popup-trigger (if as-menu? ui/dropdown-menu-trigger ui/popover-trigger)
            popup-content (if as-menu? ui/dropdown-menu-content ui/popover-content)]
        (popup-root
          (merge root-props {:open open?})
          (popup-trigger
            {:as-child true}
            (ui/button {:class "w-1 h-1 overflow-hidden fixed p-0 opacity-0"
                        :style {:top y :left x}} ""))
          (popup-content
            (merge {:onEscapeKeyDown      #(hide-x-popup!)
                    :onPointerDownOutside #(hide-x-popup!)} content-props)
            (if (fn? content) (content) content))))
      )))

(rum/defc page []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4 "UI X Popup"]

   (rum/portal (x-popup) js/document.body)

   [:<>
    [:div.w-full.p-4.border.rounded.dotted.h-96.mt-8.bg-gray-02
     {:on-click #(show-x-popup! %
                   (->> (range 8)
                     (map (fn [it]
                            (ui/dropdown-menu-item
                              {:on-select (fn []
                                            (ui/toast! it)
                                            (hide-x-popup!)) }
                              [:strong it]))))
                   {:as-menu? true
                    :content-props {:class "w-48"}})
      :on-context-menu #(show-x-popup! %
                          [:h1.text-3xl.font-bold "hi x popup for custom context menu!"])}]]])