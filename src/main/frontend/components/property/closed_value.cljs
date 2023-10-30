(ns frontend.components.property.closed-value
  "Enum property config"
  (:require [rum.core :as rum]
            [clojure.string :as string]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.util :as pu-component]
            [frontend.handler.property :as property-handler]
            [frontend.components.property.value :as property-value]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.property.util :as pu]))

(defn- upsert-closed-value!
  "Create new closed value and returns its block UUID."
  [property item]
  (let [{:keys [block-id tx-data]} (property-handler/upsert-closed-value property item)]
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

(rum/defc item-value
  [type *value]
  (case type
    ;; :page
    :date
    (let [value (if (string/blank? @*value) nil @*value)]
      (property-value/date-picker value
                                  {:on-change (fn [page]
                                                (reset! *value (:block/uuid page)))}))
    [:input.form-input.col-span-3
     {:default-value @*value
      :auto-focus true
      :on-change #(reset! *value (util/evalue %))}]))

(rum/defcs item-config < rum/reactive
  shortcut/disable-all-shortcuts
  {:init (fn [state]
           (let [block (second (:rum/args state))
                 value (or (str (get-in block [:block/schema :value])) "")
                 icon (when block (pu/get-property block :icon))
                 description (or (get-in block [:block/schema :description]) "")]
             (assoc state
                    ::value (atom value)
                    ::icon (atom icon)
                    ::description (atom description))))}
  [state property _item {:keys [toggle-fn on-save]}]
  (let [*value (::value state)
        *icon (::icon state)
        *description (::description state)
        save-handler (fn [e]
                       (util/stop e)
                       (when-not (string/blank? @*value)
                         (when on-save
                           (let [value (if (string? @*value)
                                         (string/trim @*value)
                                         @*value)]
                             (on-save value @*icon @*description)))
                         (when toggle-fn (toggle-fn))))
        property-type (get-in property [:block/schema :type])]
    [:div.flex.flex-col.gap-4.p-4.whitespace-nowrap.w-96
     {:on-key-down (fn [e]
                     (when (= e.key "Enter")
                       (save-handler e)))}
     [:div.grid.grid-cols-5.gap-1.items-center.leading-8
      [:label.col-span-2 "Value:"]
      (item-value property-type *value)]
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
       {:on-click save-handler})]]))

(rum/defcs choice-with-close <
  (rum/local false ::hover?)
  [state item {:keys [toggle-fn delete-choice update-icon]}]
  (let [*hover? (::hover? state)
        value (or (:block/original-name item)
                  (get-in item [:block/schema :value]))]
    [:div.flex.flex-1.flex-row.items-center.gap-2.justify-between
     {:on-mouse-over #(reset! *hover? true)
      :on-mouse-out #(reset! *hover? false)}
     [:div.flex.flex-row.items-center.gap-2
      (icon (pu/get-property item :icon)
            {:on-chosen (fn [_e icon]
                          (update-icon icon))})
      [:a {:on-click toggle-fn}
       value]]
     (when @*hover?
       [:a.fade-link.flex {:on-click delete-choice
                           :title "Delete this choice"}
        (ui/icon "X")])]))

(rum/defc choice-item-content
  [property block dropdown-opts]
  (let [{:block/keys [uuid]} block]
    (ui/dropdown
     (fn [opts]
       (choice-with-close
        block
        (assoc opts
               :delete-choice
               (fn []
                 (property-handler/delete-closed-value property block))
               :update-icon
               (fn [icon]
                 (property-handler/update-property! (state/get-current-repo)
                                                    (pu/get-pid "icon")
                                                    icon)))))
     (fn [opts]
       (item-config
        property
        block
        (assoc opts :on-save
               (fn [value icon description]
                 (upsert-closed-value! property {:id uuid
                                                  :value value
                                                  :description description
                                                  :icon icon})))))
     dropdown-opts)))

(rum/defc choices
  [property *property-name *property-schema]
  (let [values (get-in property [:block/schema :values])
        dropdown-opts {:modal-class (util/hiccup->class
                                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg")}]
    [:div.closed-values.flex.flex-col
     (let [choices (keep (fn [id]
                           (when-let [block (db/entity [:block/uuid id])]
                             {:id (str id)
                              :value id
                              :content (choice-item-content property block dropdown-opts)}))
                         values)]
       (dnd/items choices
                  {:on-drag-end (fn [new-values]
                                  (when (seq new-values)
                                    (swap! *property-schema assoc :values new-values)
                                    (pu-component/update-property! property @*property-name @*property-schema)))}))
     (ui/dropdown
      (fn [{:keys [toggle-fn]}]
        [:a.fade-link.flex.flex-row.items-center.gap-1.leading-8 {:on-click toggle-fn}
         (ui/icon "plus" {:size 16})
         "Add choice"])
      (fn [opts]
        (item-config
         property
         nil
         (assoc opts :on-save
                (fn [value icon description]
                  (upsert-closed-value! property {:value value
                                                  :description description
                                                  :icon icon})))))
      dropdown-opts)]))
