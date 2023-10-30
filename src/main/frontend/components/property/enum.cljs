(ns frontend.components.property.enum
  "Enum property config"
  (:require [rum.core :as rum]
            [frontend.components.dnd :as dnd]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [frontend.components.icon :as icon-component]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.components.property.util :as components-pu]))

(rum/defc icon
  [icon {:keys [disabled? on-chosen]}]
  (ui/dropdown
   (fn [{:keys [toggle-fn]}]
     [:button.flex {:on-click #(when-not disabled? (toggle-fn))}
      (if icon
        (icon-component/icon icon)
        [:span.bullet-container.cursor [:span.bullet]])])
   (fn [{:keys [toggle-fn]}]
     [:div.p-4
      (icon-component/icon-search
       {:on-chosen (fn [e icon]
                     (on-chosen e icon)
                     (toggle-fn))})])
   {:modal-class (util/hiccup->class
                  "origin-top-right.absolute.left-0.rounded-md.shadow-lg")}))

(rum/defcs enum-item-config < rum/reactive
  shortcut/disable-all-shortcuts
  {:init (fn [state]
           (let [{:keys [name icon description]} (first (:rum/args state))]
             (assoc state
                    ::name (atom (or name ""))
                    ::icon (atom icon)
                    ::description (atom (or description "")))))}
  [state _item {:keys [toggle-fn on-save]}]
  (let [*name (::name state)
        *icon (::icon state)
        *description (::description state)]
    [:div.flex.flex-col.gap-4.p-4.whitespace-nowrap.w-96
     [:div.grid.grid-cols-5.gap-1.items-center.leading-8
      [:label.col-span-2 "Name:"]
      [:input.form-input.col-span-3
       {:default-value @*name
        :on-change #(reset! *name (util/evalue %))}]]
     [:div.grid.grid-cols-5.gap-1.items-center.leading-8
      [:label.col-span-2 "Icon:"]
      [:div.col-span-3
       (icon (rum/react *icon)
             {:on-chosen (fn [_e icon]
                           (reset! *icon icon))})]]
     [:div.grid.grid-cols-5.gap-1.items-start.leading-8
      [:label.col-span-2 "Description:"]
      [:div.col-span-3
       (ui/ls-textarea
        {:on-change #(reset! *description (util/evalue %))
         :default-value @*description})]]
     [:div
      (ui/button
       "Save"
       :on-click (fn [e]
                   (util/stop e)
                   (when-not (string/blank? @*name)
                     (let [result (when on-save (on-save (string/trim @*name) @*icon @*description))]
                       (if (= :value-exists result)
                         (notification/show! (str "Choice already exist") :warning)
                         (when toggle-fn (toggle-fn)))))))]]))

(rum/defcs enum-new-item <
  (rum/local "" ::name)
  (rum/local "" ::icon)
  (rum/local "" ::description)
  [state {:keys [toggle-fn on-save]}]
  (let [*name (::name state)
        *icon (::icon state)
        *description (::description state)]
    [:div.flex.flex-col.gap-4.p-4.whitespace-nowrap.w-96
     [:div.grid.grid-cols-5.gap-1.items-center.leading-8
      [:label.col-span-2 "Name:"]
      [:input.form-input.col-span-3
       {:default-value ""
        :auto-focus true
        :on-change (fn [e] (reset! *name (util/evalue e)))}]]
     [:div.grid.grid-cols-5.gap-1.items-center.leading-8
      [:label.col-span-2 "Icon:"]
      [:div.col-span-3
       (icon nil {:on-chosen (fn [_e icon]
                               (reset! *icon icon))})]]
     [:div.grid.grid-cols-5.gap-1.items-start.leading-8
      [:label.col-span-2 "Description:"]
      [:div.col-span-3
       (ui/ls-textarea
        {:on-change #(reset! *description (util/evalue %))
         :default-value @*description})]]
     [:div
      (ui/button
       "Save"
       :on-click (fn [e]
                   (util/stop e)
                   (when-not (string/blank? @*name)
                     (let [result (when on-save (on-save (string/trim @*name)
                                                         @*icon
                                                         @*description))]
                       (if (= :value-exists result)
                         (notification/show! (str "Choice already exist") :warning)
                         (when toggle-fn (toggle-fn)))))))]]))

(rum/defcs choice-with-close <
  (rum/local false ::hover?)
  [state item name {:keys [toggle-fn delete-choice update-icon]}]
  (let [*hover? (::hover? state)]
    [:div.flex.flex-1.flex-row.items-center.gap-2.justify-between
     {:on-mouse-over #(reset! *hover? true)
      :on-mouse-out #(reset! *hover? false)}
     [:div.flex.flex-row.items-center.gap-2
      (icon (:icon item)
            {:on-chosen (fn [_e icon]
                          (update-icon icon))})
      [:a {:on-click toggle-fn}
       name]]
     (when @*hover?
       [:a.fade-link.flex {:on-click delete-choice
                           :title "Delete this choice"}
        (ui/icon "X")])]))

(rum/defc choice-item-content
  [property item values order *property-schema *property-name dropdown-opts]
  (let [{:keys [id name]} item]
    (ui/dropdown
     (fn [opts]
       (choice-with-close
        item
        name
        (assoc opts
               :delete-choice
               (fn []
                 (let [new-values (dissoc values id)
                       new-order (vec (remove #{id} order))]
                   (swap! *property-schema assoc :enum-config {:values new-values
                                                               :order new-order})
                        ;; FIXME: how to handle block properties with this value?
                        ;; 1. delete the blocks' property that has this value
                        ;; 2. update exist values to the default value if exists
                        ;; 3. soft delete, users can still see it in some existing blocks,
                        ;;    but they will not see it when adding or updating this property
                   (components-pu/update-property! property @*property-name @*property-schema)))
               :update-icon
               (fn [icon]
                 (let [new-values (assoc-in values [id :icon] icon)]
                   (swap! *property-schema assoc :enum-config {:values new-values
                                                               :order order})
                   (components-pu/update-property! property @*property-name @*property-schema))))))
     (fn [opts]
       (enum-item-config
        item
        (assoc opts :on-save
               (fn [name icon description]
                 (if (some (fn [[vid m]] (and (not= vid id) (= name (:name m)))) values)
                   :value-exists
                   (let [new-values (assoc values id {:name name
                                                      :icon icon
                                                      :description description})]
                     (swap! *property-schema assoc :enum-config {:values new-values
                                                                 :order order})
                     (components-pu/update-property! property @*property-name @*property-schema)))))))
     dropdown-opts)))

(rum/defc enum-choices
  [property *property-name *property-schema {:keys [values order] :as _config}]
  (let [dropdown-opts {:modal-class (util/hiccup->class
                                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg")}
        order (if (not= (count order) (count values))
                (vec (concat order (remove (set order) (keys values))))
                order)]
    [:div.enum-choices.flex.flex-col
     (let [choices (mapv (fn [id]
                           (let [item (assoc (get values id) :id id)]
                             {:id (str id)
                              :value id
                              :content (choice-item-content property item values order *property-schema *property-name dropdown-opts)}))
                         order)]
       (dnd/items choices
                  {:on-drag-end (fn [new-order]
                                  (when (seq new-order)
                                    (swap! *property-schema assoc :enum-config {:values values
                                                                                :order new-order})
                                    (components-pu/update-property! property @*property-name @*property-schema)))}))
     (ui/dropdown
      (fn [{:keys [toggle-fn]}]
        [:a.fade-link.flex.flex-row.items-center.gap-1.leading-8 {:on-click toggle-fn}
         (ui/icon "plus" {:size 16})
         "Add choice"])
      (fn [opts]
        (enum-new-item (assoc opts :on-save
                              (fn [name description]
                                (if (contains? (set (map :name (vals values))) name)
                                  :value-exists
                                  (let [id (random-uuid)
                                        new-values (assoc values id {:name name
                                                                     :description description})
                                        new-order (vec (conj order id))]
                                    (swap! *property-schema assoc :enum-config {:values new-values
                                                                                :order new-order})
                                    (components-pu/update-property! property @*property-name @*property-schema)))))))
      dropdown-opts)]))
