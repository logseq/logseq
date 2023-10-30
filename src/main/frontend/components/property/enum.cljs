(ns frontend.components.property.enum
  "Enum property config"
  (:require [rum.core :as rum]
            [clojure.string :as string]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.util :as components-pu]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.property.util :as pu]))

(defn- upsert-enum-item!
  "Create new enum value and returns its block UUID."
  [property item]
  (let [{:keys [block-id tx-data]} (property-handler/upsert-enum-item property item)]
    (when (seq tx-data) (db/transact! tx-data))
    block-id))

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
           (let [block (first (:rum/args state))]
             (let [name (or (:block/content block) "")
                   icon (pu/get-property block :icon)
                   description (or (get-in block [:block/schema :description]) "")]
               (assoc state
                      ::name (atom name)
                      ::icon (atom icon)
                      ::description (atom description)))))}
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
                     (when on-save (on-save (string/trim @*name) @*icon @*description))
                     (when toggle-fn (toggle-fn)))))]]))

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
      (icon (pu/get-property item :icon)
            {:on-chosen (fn [_e icon]
                          (update-icon icon))})
      [:a {:on-click toggle-fn}
       name]]
     (when @*hover?
       [:a.fade-link.flex {:on-click delete-choice
                           :title "Delete this choice"}
        (ui/icon "X")])]))

(rum/defc choice-item-content
  [property block dropdown-opts]
  (let [{:block/keys [uuid content]} block]
    (ui/dropdown
     (fn [opts]
       (choice-with-close
        block
        content
        (assoc opts
               :delete-choice
               (fn []
                 (property-handler/delete-enum-item property block))
               :update-icon
               (fn [icon]
                 (property-handler/update-property! (state/get-current-repo)
                                                    (pu/get-pid "icon")
                                                    icon)))))
     (fn [opts]
       (enum-item-config
        block
        (assoc opts :on-save
               (fn [name icon description]
                 (upsert-enum-item! property {:id uuid
                                              :name name
                                              :description description
                                              :icon icon})))))
     dropdown-opts)))

(rum/defc enum-choices
  [property *property-name *property-schema]
  (let [values (get-in property [:block/schema :enum-config :values])
        dropdown-opts {:modal-class (util/hiccup->class
                                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg")}]
    [:div.enum-choices.flex.flex-col
     (let [choices (keep (fn [id]
                           (when-let [block (db/entity [:block/uuid id])]
                             {:id (str id)
                              :value id
                              :content (choice-item-content property block dropdown-opts)}))
                         values)]
       (dnd/items choices
                  {:on-drag-end (fn [new-values]
                                  (when (seq new-values)
                                    (swap! *property-schema assoc-in [:enum-config :values] new-values)
                                    (components-pu/update-property! property @*property-name @*property-schema)))}))
     (ui/dropdown
      (fn [{:keys [toggle-fn]}]
        [:a.fade-link.flex.flex-row.items-center.gap-1.leading-8 {:on-click toggle-fn}
         (ui/icon "plus" {:size 16})
         "Add choice"])
      (fn [opts]
        (enum-new-item (assoc opts :on-save
                              (fn [name icon description]
                                (upsert-enum-item! property {:name name
                                                             :description description
                                                             :icon icon})))))
      dropdown-opts)]))
