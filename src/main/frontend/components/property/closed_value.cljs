(ns frontend.components.property.closed-value
  "Enum property config"
  (:require [rum.core :as rum]
            [clojure.string :as string]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.handler.property :as property-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.config :as config]
            [frontend.components.property.value :as property-value]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [promesa.core :as p]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.order :as db-order]
            [logseq.outliner.core :as outliner-core]))

(defn- re-init-commands!
  "Update commands after task status and priority's closed values has been changed"
  [property]
  (when (contains? #{:logseq.task/status :logseq.task/priority} (:db/ident property))
    (state/pub-event! [:init/commands])))

(defn- <upsert-closed-value!
  "Create new closed value and returns its block UUID."
  [property item]
  (p/do!
   (db-property-handler/upsert-closed-value! (:db/ident property) item)
   (re-init-commands! property)))

(rum/defc item-value
  [type *value]
  (let [*input-ref (rum/use-ref nil)]
    (rum/use-effect!
      (fn []
        (when-let [^js el (rum/deref *input-ref)]
          (js/setTimeout #(.focus el) 100)))
      [])
    (case type
      ;; :page
      :date
      (let [value (if (string/blank? @*value) nil @*value)]
        (property-value/date-picker value
          {:on-change (fn [page]
                        (reset! *value (:db/id page)))}))

      (shui/input
        {:default-value @*value
         :class         "col-span-3"
         :auto-focus    true
         :ref           *input-ref
         :on-change     #(reset! *value (util/evalue %))}))))

(rum/defcs item-config < rum/reactive
  shortcut/disable-all-shortcuts
  {:init (fn [state]
           (let [block (second (:rum/args state))
                 value (or (str (db-property/closed-value-content block)) "")
                 icon (:logseq.property/icon block)
                 description (or (db-property/property-value-content (:logseq.property/description block)) "")]
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
                         (p/do!
                          (when on-save
                            (let [value (if (string? @*value)
                                          (string/trim @*value)
                                          @*value)]
                              (on-save value @*icon @*description)))
                          (when toggle-fn (toggle-fn)))))
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
      [:div.col-span-3.flex.flex-row.items-center.gap-2
       (icon-component/icon-picker (rum/react *icon)
                                   {:on-chosen (fn [_e icon]
                                                 (reset! *icon icon))})
       (when (rum/react *icon)
         [:a.fade-link.flex {:on-click (fn [_e]
                                         (reset! *icon nil))
                             :title "Delete this icon"}
          (ui/icon "X")])]]
     ;; Disable description for types that can't edit them
     (when-not (#{:node :date} property-type)
       [:div.grid.grid-cols-5.gap-1.items-start.leading-8
        [:label.col-span-2 "Description:"]
        [:div.col-span-3
         (shui/textarea
          {:on-change #(reset! *description (util/evalue %))
           :default-value @*description})]])
     [:div.flex.justify-end
      (shui/button {:on-click save-handler :size :sm} "Save")]]))

(rum/defcs choice-with-close <
  (rum/local false ::hover?)
  [state item {:keys [toggle-fn delete-choice update-icon]} parent-opts]
  (let [*hover? (::hover? state)
        value (db-property/closed-value-content item)
        page? (db/page? item)
        property-block? (db-property/property-created-block? item)]
    [:div.flex.flex-1.flex-row.items-center.gap-2.justify-between
     {:on-mouse-over #(reset! *hover? true)
      :on-mouse-out #(reset! *hover? false)}
     [:div.flex.flex-row.items-center.gap-2
      (icon-component/icon-picker (:logseq.property/icon item)
                                  {:on-chosen (fn [_e icon]
                                                (update-icon icon))})
      (cond
        property-block?
        [:a {:on-click toggle-fn}
         value]

        (and page? (:page-cp parent-opts))
        ((:page-cp parent-opts) {:preview? false} item)

        :else
        [:a {:on-click toggle-fn}
         value])]
     (when @*hover?
       [:a.fade-link.flex {:on-click delete-choice
                           :title "Delete this choice"}
        (ui/icon "X")])]))

(rum/defc choice-item-content
  [property block parent-opts]
  (let [{:block/keys [uuid]} block]
    (let [content-fn
          (if config/publishing?
            (constantly [])
            (fn [{:keys [id]}]
              (let [opts {:toggle-fn #(shui/popup-hide! id)}]
                (item-config
                 property
                 block
                 (merge
                  parent-opts
                  (assoc opts :on-save
                         (fn [value icon description]
                           (<upsert-closed-value! property {:id          uuid
                                                            :value       value
                                                            :description description
                                                            :icon        icon}))))))))
          opts {:toggle-fn #(shui/popup-show! % content-fn)}]

      (choice-with-close
       block
       (assoc opts
              :delete-choice
              (fn []
                (p/do!
                 (db-property-handler/delete-closed-value! (:db/id property) (:db/id block))
                 (re-init-commands! property)))
              :update-icon
              (fn [icon]
                (property-handler/set-block-property! (state/get-current-repo) (:block/uuid block) :logseq.property/icon
                                                      (select-keys icon [:id :type :color]))))
       parent-opts))))

(rum/defc add-existing-values
  [property values {:keys [toggle-fn]}]
  [:div.flex.flex-col.gap-1.w-64.p-4.overflow-y-auto
   {:class "max-h-[50dvh]"}
   [:div "Existing values:"]
   [:ol
    (for [value values]
      [:li (if (uuid? value)
             (let [result (db/entity [:block/uuid value])]
               (db-property/closed-value-content result))
             (str value))])]
   (ui/button
    "Add choices"
    {:on-click (fn []
                 (p/let [_ (db-property-handler/add-existing-values-to-closed-values! (:db/id property) values)]
                   (toggle-fn)))})])

(rum/defc choices < rum/reactive
  [property opts]
  (let [values (:property/closed-values property)
        dropdown-opts {:modal-class (util/hiccup->class
                                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg")}]
    [:div.closed-values.flex.flex-col
     (let [choices (doall
                    (keep (fn [value]
                            (when-let [block (db/sub-block (:db/id value))]
                              (let [id (:block/uuid block)]
                                {:id (str id)
                                 :value id
                                 :content (choice-item-content property block (merge opts dropdown-opts))})))
                          values))]
       (dnd/items choices
                  {:on-drag-end (fn [_ {:keys [active-id over-id direction]}]
                                  (let [move-down? (= direction :down)
                                        over (db/entity [:block/uuid (uuid over-id)])
                                        active (db/entity [:block/uuid (uuid active-id)])
                                        over-order (:block/order over)
                                        new-order (if move-down?
                                                    (let [next-order (db-order/get-next-order (db/get-db) property (:db/id over))]
                                                      (db-order/gen-key over-order next-order))
                                                    (let [prev-order (db-order/get-prev-order (db/get-db) property (:db/id over))]
                                                      (db-order/gen-key prev-order over-order)))]

                                    (db/transact! (state/get-current-repo)
                                                  [{:db/id (:db/id active)
                                                    :block/order new-order}
                                                   (outliner-core/block-with-updated-at
                                                    {:db/id (:db/id property)})]
                                                  {:outliner-op :save-block})))}))
     (if config/publishing?
       (constantly [])
       (shui/button
        {:variant :ghost
         :class "justify-start px-0"
         :size :sm
         :on-click
         (fn [e]
           (p/let [values (db-async/<get-block-property-values (state/get-current-repo) (:db/ident property))
                   existing-values (seq (:property/closed-values property))
                   values (if (seq existing-values)
                            (let [existing-ids (set (map :db/id existing-values))]
                              (remove (fn [id] (existing-ids id)) values))
                            values)]
             (shui/popup-show! (.-target e)
                               (fn [{:keys [id]}]
                                 (let [opts {:toggle-fn (fn [] (shui/popup-hide! id))}
                                       values' (->> (if (contains? db-property-type/ref-property-types (get-in property [:block/schema :type]))
                                                      (map #(:block/uuid (db/entity %)) values)
                                                      values)
                                                    (remove string/blank?)
                                                    distinct)]
                                   (if (seq values')
                                     (add-existing-values property values' opts)
                                     (item-config
                                      property
                                      nil
                                      (assoc opts :on-save
                                             (fn [value icon description]
                                               (<upsert-closed-value! property {:value value
                                                                                :description description
                                                                                :icon icon})))))))
                               {:content-props {:class "w-auto"}})))}
        (ui/icon "plus" {:size 16})
        "Add choice"))]))
