(ns frontend.components.property.config
  (:require [clojure.string :as string]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.default-value :as pdv]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.core :as outliner-core]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

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

(defn- loop-focusable-elements!
  ([^js cnt] (loop-focusable-elements! cnt
                                       ".ui__button:not([disabled]), .ui__input, .ui__textarea"))
  ([^js cnt selectors]
   (when-let [els (some-> cnt (.querySelectorAll selectors) (seq))]
     (let [active js/document.activeElement
           current-idx (.indexOf els active)
           total-len (count els)
           to-idx (cond
                    (or (= -1 current-idx)
                        (= total-len (inc current-idx)))
                    0
                    :else
                    (inc current-idx))]
       (some-> els (nth to-idx) (.focus))))))

(defn- set-property-description!
  [property description]
  (if-let [ent (:logseq.property/description property)]
    (db/transact! (state/get-current-repo)
                  [(outliner-core/block-with-updated-at
                    {:db/id (:db/id ent) :block/title description})]
                  {:outliner-op :save-block})
    (when-not (string/blank? description)
      (db-property-handler/set-block-property!
       (:db/id property)
       :logseq.property/description description))))

(defn- <create-class-if-not-exists!
  [value]
  (when (string? value)
    (let [page-name (string/trim value)]
      (when-not (string/blank? page-name)
        (p/let [page (db-page-handler/<create-class! page-name {:redirect? false
                                                                :create-first-block? false})]
          (:block/uuid page))))))

(rum/defc class-select
  [property {:keys [multiple-choices? disabled? default-open? no-class? on-hide]
             :or {multiple-choices? true}}]
  (let [*ref (rum/use-ref nil)]
    (rum/use-effect!
     (fn []
       (when default-open?
         (some-> (rum/deref *ref)
                 (.click))))
     [default-open?])
    (let [schema-classes (:property/schema.classes property)]
      [:div.flex.flex-1.col-span-3
       (let [content-fn
             (fn [{:keys [id]}]
               (let [toggle-fn #(do
                                  (when (fn? on-hide) (on-hide))
                                  (shui/popup-hide! id))
                     classes (model/get-all-readable-classes (state/get-current-repo) {:except-root-class? true})
                     options (map (fn [class]
                                    {:label (:block/title class)
                                     :value (:block/uuid class)})
                                  classes)
                     options (if no-class?
                               (cons {:label "Skip choosing tag"
                                      :value :no-tag}
                                     options)
                               options)
                     opts {:items options
                           :input-default-placeholder (if multiple-choices? "Choose tags" "Choose tag")
                           :dropdown? false
                           :close-modal? false
                           :multiple-choices? multiple-choices?
                           :selected-choices (map :block/uuid schema-classes)
                           :extract-fn :label
                           :extract-chosen-fn :value
                           :show-new-when-not-exact-match? true
                           :input-opts {:on-key-down
                                        (fn [e]
                                          (case (util/ekey e)
                                            "Escape"
                                            (do
                                              (util/stop e)
                                              (toggle-fn))
                                            nil))}
                           :on-chosen (fn [value select?]
                                        (if (= value :no-tag)
                                          (toggle-fn)
                                          (p/let [result (<create-class-if-not-exists! value)
                                                  value' (or result value)
                                                  tx-data [[(if select? :db/add :db/retract) (:db/id property) :property/schema.classes [:block/uuid value']]]
                                                  _ (db/transact! (state/get-current-repo) tx-data {:outliner-op :update-property})]
                                            (when-not multiple-choices? (toggle-fn)))))}]

                 (select/select opts)))]

         [:div.flex.flex-1.cursor-pointer
          {:ref *ref
           :on-click (if disabled?
                       (constantly nil)
                       #(shui/popup-show! (.-target %) content-fn {:id :ls-node-tags-sub-pane}))}
          (if (seq schema-classes)
            [:div.flex.flex-1.flex-row.items-center.flex-wrap.gap-2
             {:class "max-w-[300px]"}
             (for [class schema-classes]
               [:a.text-sm (str "#" (:block/title class))])
             [:span.opacity-60.pl-1.top-1.relative.hover:opacity-80.active:opacity-60
              (shui/tabler-icon "edit")]]
            (pv/property-empty-btn-value property))])])))

(rum/defc name-edit-pane
  [property {:keys [set-sub-open! disabled?]}]
  (let [*form-data (rum/use-ref {:icon (:logseq.property/icon property)
                                 :title (or (:block/title property) "")
                                 :description (or (db-property/property-value-content (:logseq.property/description property)) "")})
        [form-data, set-form-data!] (rum/use-state (rum/deref *form-data))
        [saving?, set-saving!] (rum/use-state false)
        *el (rum/use-ref nil)
        *input-ref (rum/use-ref nil)
        title (util/trim-safe (:title form-data))
        description (util/trim-safe (:description form-data))]

    (rum/use-effect!
     (fn []
       (js/setTimeout #(some-> (rum/deref *el) (.focus)) 32))
     [])

    [:div.ls-property-name-edit-pane.outline-none
     {:on-key-down (fn [^js e] (when (= "Tab" (.-key e))
                                 (loop-focusable-elements! (rum/deref *el))))
      :tab-index -1
      :ref *el}
     [:div.flex.items-center.input-wrap
      (icon-component/icon-picker (:icon form-data)
                                  {:on-chosen (fn [_e icon] (set-form-data! (assoc form-data :icon icon)))
                                   :popup-opts {:align "start"}
                                   :del-btn? (boolean (:icon form-data))
                                   :empty-label "?"})
      (shui/input {:ref *input-ref :size "sm" :default-value title :placeholder "name"
                   :disabled disabled? :on-change (fn [^js e] (set-form-data! (assoc form-data :title (util/trim-safe (util/evalue e)))))})]
     [:div.pt-2 (shui/textarea {:placeholder "description" :default-value description
                                :disabled disabled? :on-change (fn [^js e] (set-form-data! (assoc form-data :description (util/trim-safe (util/evalue e)))))})]

     (let [dirty? (not= (rum/deref *form-data) form-data)]
       [:div.pt-2.flex.justify-end
        (shui/button {:size "sm" :disabled (or saving? (not dirty?))
                      :variant (if dirty? :default :secondary)
                      :on-click (fn []
                                  (set-saving! true)
                                  (-> [(db-property-handler/upsert-property!
                                        (:db/ident property)
                                        (:block/schema property)
                                        {:property-name title
                                         :properties {:logseq.property/icon (:icon form-data)}})
                                       (when (not= description (:description (rum/deref *form-data)))
                                         (set-property-description! property description))]
                                      (p/all)
                                      (p/then #(set-sub-open! false))
                                      (p/catch #(shui/toast! (str %) :error))
                                      (p/finally #(set-saving! false))))}
                     "Save")])]))

(rum/defc choice-base-edit-form
  [own-property block]
  (let [create? (:create? block)
        uuid (:block/uuid block)
        *form-data (rum/use-ref
                    {:value (or (str (db-property/closed-value-content block)) "")
                     :icon (:logseq.property/icon block)
                     :description (or (db-property/property-value-content (:logseq.property/description block)) "")})
        [form-data, set-form-data!] (rum/use-state (rum/deref *form-data))
        *input-ref (rum/use-ref nil)]

    (rum/use-effect!
     (fn []
       (when create?
         (js/setTimeout #(some-> (rum/deref *input-ref) (.focus)) 60)))
     [])

    [:div.ls-base-edit-form
     [:div.flex.items-center.input-wrap
      (icon-component/icon-picker
       (:icon form-data)
       {:on-chosen (fn [_e icon] (set-form-data! (assoc form-data :icon icon)))
        :empty-label "?"
        :del-btn? (boolean (:icon form-data))
        :popup-opts {:align "start"}})

      (shui/input {:ref *input-ref :size "sm"
                   :default-value (:value form-data)
                   :on-change (fn [^js e] (set-form-data! (assoc form-data :value (util/trim-safe (util/evalue e)))))
                   :placeholder "title"})]
     [:div.pt-2 (shui/textarea
                 {:placeholder "description" :default-value (:description form-data)
                  :on-change (fn [^js e] (set-form-data! (assoc form-data :description (util/trim-safe (util/evalue e)))))})]
     [:div.pt-2.flex.justify-end
      (let [dirty? (not= (rum/deref *form-data) form-data)]
        (shui/button {:size "sm"
                      :disabled (not dirty?)
                      :on-click (fn []
                                  (-> (<upsert-closed-value! own-property
                                                             (cond-> form-data uuid (assoc :id uuid)))
                                      (p/then #(shui/popup-hide!))
                                      (p/catch #(shui/toast! (str %) :error))))
                      :variant (if dirty? :default :secondary)}
                     "Save"))]]))

(defn restore-root-highlight-item!
  [id]
  (js/setTimeout
   #(some-> (gdom/getElement id) (.focus)) 32))

(rum/defc dropdown-editor-menuitem
  [{:keys [id icon title desc submenu-content item-props sub-content-props disabled? toggle-checked? on-toggle-checked-change checkbox?]}]
  (let [submenu-content (when-not disabled? submenu-content)
        item-props' (if (and disabled? (:on-select item-props))
                      (assoc item-props :on-select (fn [] nil))
                      item-props)
        [sub-open? set-sub-open!] (rum/use-state false)
        toggle? (boolean? toggle-checked?)
        id1 (str (or id icon (random-uuid)))
        id2 (str "d2-" id1)
        or-close-menu-sub! (fn []
                             (when (and (not (shui-popup/get-popup :ls-icon-picker))
                                        (not (shui-popup/get-popup :ls-base-edit-form))
                                        (not (shui-popup/get-popup :ls-node-tags-sub-pane)))
                               (set-sub-open! false)
                               (restore-root-highlight-item! id1)))
        wrap-menuitem (if submenu-content
                        #(shui/dropdown-menu-sub
                          {:open sub-open?
                           :on-open-change (fn [v] (if v (set-sub-open! true) (or-close-menu-sub!)))}
                          (shui/dropdown-menu-sub-trigger (merge {:id id1} item-props') %)
                          (shui/dropdown-menu-portal
                           (shui/dropdown-menu-sub-content
                            (merge {:hideWhenDetached true
                                    :onEscapeKeyDown or-close-menu-sub!} sub-content-props)
                            (if (fn? submenu-content)
                              (submenu-content {:set-sub-open! set-sub-open! :id id1}) submenu-content))))
                        #(shui/dropdown-menu-item
                          (merge {:on-select (fn []
                                               (when toggle?
                                                 (some-> (gdom/getElement id2) (.click))))
                                  :id id1}
                                 item-props') %))]
    (wrap-menuitem
     [:div.inner-wrap.cursor-pointer
      {:class (util/classnames [{:disabled disabled?}])}
      [:strong
       (some-> icon (name) (shui/tabler-icon {:size 14
                                              :style {:margin-top "-1"}}))
       [:span title]]
      (cond
        (fn? desc)
        (desc)
        (boolean? toggle-checked?)
        [:span.scale-90.flex.items-center
         (let [f (if checkbox? shui/checkbox shui/switch)]
           (f {:id id2 :size "sm" :checked toggle-checked?
               :disabled disabled? :on-click #(util/stop-propagation %)
               :on-checked-change (or on-toggle-checked-change identity)}))]
        :else
        [:label [:span desc]
         (when disabled? (shui/tabler-icon "forbid-2" {:size 15}))])])))

(rum/defc choice-item-content < rum/reactive db-mixins/query
  [property block]
  (let [delete-choice! (fn []
                         (p/do!
                          (db-property-handler/delete-closed-value! (:db/id property) (:db/id block))
                          (re-init-commands! property)))
        update-icon! (fn [icon]
                       (property-handler/set-block-property!
                        (state/get-current-repo) (:block/uuid block) :logseq.property/icon
                        (select-keys icon [:id :type :color])))
        icon (:logseq.property/icon block)
        value (db-property/closed-value-content block)]
    [:li
     (shui/button {:size :sm :variant :ghost :title "Drag && Drop to reorder"}
                  (shui/tabler-icon "grip-vertical" {:size 14}))
     (icon-component/icon-picker icon {:on-chosen (fn [_e icon] (update-icon! icon))
                                       :popup-opts {:align "start"}
                                       :del-btn? (boolean icon)
                                       :empty-label "?"
                                       :button-opts {:title "Set Icon"}})
     [:strong {:on-click (fn [^js e]
                           (shui/popup-show! (.-target e)
                                             (fn [] (choice-base-edit-form property block))
                                             {:id :ls-base-edit-form
                                              :align "start"}))}
      value]
     (shui/dropdown-menu
      (shui/dropdown-menu-trigger
       {:as-child true}
       (shui/button
        {:size :sm :variant :ghost
         :title "More settings"}
        (shui/tabler-icon "dots" {:size 16})))
      (shui/dropdown-menu-content
       ;; default choice
       (let [property-type (get-in property [:block/schema :type])
             property (db/sub-block (:db/id property))
             default-type? (contains? #{:default :number} property-type)
             default-value (when default-type? (:logseq.property/default-value property))
             default-value? (= (:db/id default-value) (:db/id block))]
         (when default-type?
           (shui/dropdown-menu-item
            {:key "default value"
             :on-click #(let [value (if default-value? nil (:db/id block))]
                          (db-property-handler/set-block-property! (:db/ident property) :logseq.property/default-value
                                                                   value))}
            (shui/checkbox {:id "default value"
                            :size :sm
                            :title "Set as default choice"
                            :class "mr-1 opacity-50 hover:opacity-100"
                            :checked default-value?})
            "Set as default choice")))

       (shui/dropdown-menu-item
        {:key "delete"
         :class "del"
         :on-click delete-choice!}
        (ui/icon "x" {:class "scale-90 pr-1 opacity-80"})
        "Delete")))]))

(rum/defc add-existing-values
  [property values {:keys [toggle-fn]}]
  (let [uuid-values? (every? uuid? values)
        values' (if uuid-values?
                  (let [values' (map #(db/entity [:block/uuid %]) values)]
                    (->> values'
                         (util/distinct-by db-property/closed-value-content)
                         (map :block/uuid)))
                  values)]
    [:div.flex.flex-col.gap-1.w-64.p-4.overflow-y-auto
     {:class "max-h-[50dvh]"}
     [:div "Existing values:"]
     [:ol
      (for [value values']
        [:li (if (uuid? value)
               (let [result (db/entity [:block/uuid value])]
                 (db-property/closed-value-content result))
               (str value))])]
     (shui/button
      {:on-click (fn []
                   (p/let [_ (db-property-handler/add-existing-values-to-closed-values! (:db/id property) values')]
                     (toggle-fn)))}
      "Add choices")]))

(rum/defc choices-sub-pane < rum/reactive db-mixins/query
  [property {:keys [disabled?]}]
  (let [values (:property/closed-values property)
        choices (doall
                 (keep (fn [value]
                         (db/sub-block (:db/id value)))
                       values))
        choice-items (map
                      (fn [block]
                        (let [id (:block/uuid block)]
                          {:id (str id)
                           :value id
                           :content (choice-item-content property block)}))
                      choices)]
    [:div.ls-property-dropdown-editor.ls-property-choices-sub-pane
     (when (seq choices)
       [:ul.choices-list
        (dnd/items choice-items
                   {:sort-by-inner-element? false
                    :on-drag-end (fn [_ {:keys [active-id over-id direction]}]
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
                                                   {:outliner-op :save-block})))})])

     (shui/dropdown-menu-separator)

     ;; add choice
     (when-not disabled?
       (dropdown-editor-menuitem
        {:icon :plus :title "Add choice"
         :item-props {:on-click
                      (fn [^js e]
                        (p/let [values (db-async/<get-block-property-values (state/get-current-repo) (:db/ident property))
                                existing-values (seq (:property/closed-values property))
                                values (if (seq existing-values)
                                         (let [existing-ids (set (map :db/id existing-values))]
                                           (remove (fn [id] (existing-ids id)) values))
                                         values)]
                          (shui/popup-show! (.-target e)
                                            (fn [{:keys [id]}]
                                              (let [opts {:toggle-fn (fn [] (shui/popup-hide! id))}
                                                    values' (->> (if (contains? db-property-type/all-ref-property-types (get-in property [:block/schema :type]))
                                                                   (->> values
                                                                        (map db/entity)
                                                                        (remove (fn [e]
                                                                                  (let [value (db-property/property-value-content e)]
                                                                                    (and (string? value) (string/blank? value)))))
                                                                        (map :block/uuid))
                                                                   (remove string/blank? values))
                                                                 distinct)]
                                                (if (seq values')
                                                  (add-existing-values property values' opts)
                                                  (choice-base-edit-form property {:create? true}))))
                                            {:id :ls-base-edit-form
                                             :align "start"})))}}))]))

(rum/defc checkbox-state-mapping
  [choices]
  (let [select-cp (fn [opts]
                    (shui/select
                     opts
                     (shui/select-trigger
                      (shui/select-value {:placeholder "Select a choice"}))
                     (shui/select-content
                      (map (fn [choice]
                             (shui/select-item {:value (:db/id choice)} (:block/title choice))) choices))))
        checked-choice (some (fn [choice] (when (true? (:logseq.property/choice-checkbox-state choice)) choice)) choices)
        unchecked-choice (some (fn [choice] (when (false? (:logseq.property/choice-checkbox-state choice)) choice)) choices)]
    [:div.flex.flex-col.gap-4.text-sm.p-2
     [:div.text-muted-foreground "Checkbox state mapping"]
     [:div.flex.flex-col.gap-2
      [:div "Map unchecked to"]
      (select-cp
       (cond->
        {:on-value-change
         (fn [value]
           (db-property-handler/set-block-property! value :logseq.property/choice-checkbox-state false))}
         unchecked-choice
         (assoc :default-value (:db/id unchecked-choice))))

      [:div.mt-2 "Map checked to"]
      (select-cp
       (cond->
        {:on-value-change
         (fn [value]
           (db-property-handler/set-block-property! value :logseq.property/choice-checkbox-state true))}
         checked-choice
         (assoc :default-value (:db/id checked-choice))))]]))

(def position-labels
  {:properties {:icon :layout-distribute-horizontal :title "Block properties"}
   :block-left {:icon :layout-align-right :title "Beginning of the block"}
   :block-right {:icon :layout-align-left :title "End of the block"}
   :block-below {:icon :layout-align-top :title "Below the block"}})

(rum/defc ui-position-sub-pane
  [property {:keys [id set-sub-open! _position]}]
  (let [handle-select! (fn [^js e]
                         (when-let [v (some-> (.-target e) (.-dataset) (.-value))]
                           (db-property-handler/upsert-property!
                            (:db/ident property)
                            (assoc (:block/schema property) :position (keyword v))
                            {:property-name (:block/title property)})
                           (set-sub-open! false)
                           (restore-root-highlight-item! id)))
        item-props {:on-select handle-select!}]
    [:div.ls-property-dropdown-editor.ls-property-ui-position-sub-pane
     (for [[k v] position-labels]
       (let [item-props (assoc item-props :data-value k)]
         (dropdown-editor-menuitem
          (assoc v :item-props item-props))))]))

(defn property-type-label
  [property-type]
  (case property-type
    :default
    "Text"
    :datetime
    "DateTime"
    ((comp string/capitalize name) property-type)))

(defn- handle-delete-property!
  [block property & {:keys [class? class-schema?]}]
  (let [class? (or class? (ldb/class? block))
        remove! #(let [repo (state/get-current-repo)]
                   (if (and class? class-schema?)
                     (db-property-handler/class-remove-property! (:db/id block) (:db/id property))
                     (property-handler/remove-block-property! repo (:block/uuid block) (:db/ident property))))]
    (if (and class? class-schema?)
      (-> (shui/dialog-confirm!
           [:p (str "Are you sure you want to delete the property from this tag?")]
           {:id :delete-property-from-class
            :data-reminder :ok})
          (p/then remove!))
      (-> (shui/dialog-confirm!
           "Are you sure you want to delete the property from this node?"
           {:id :delete-property-from-node
            :data-reminder :ok})
          (p/then remove!)))))

(rum/defc property-type-sub-pane
  [property {:keys [id set-sub-open! _position]}]
  (let [handle-select! (fn [^js e]
                         (when-let [v (some-> (.-target e) (.-dataset) (.-value))]
                           (p/do!
                            (db-property-handler/upsert-property!
                             (:db/ident property)
                             (assoc (:block/schema property) :type (keyword v))
                             {})
                            (set-sub-open! false)
                            (restore-root-highlight-item! id))))
        item-props {:on-select handle-select!}
        schema-types (->> db-property-type/user-built-in-property-types
                          (map (fn [type]
                                 {:label (property-type-label type)
                                  :value type})))]
    [:div.ls-property-dropdown-editor.ls-property-type-sub-pane
     (for [{:keys [label value]} schema-types]
       (let [option {:id label
                     :title label
                     :desc ""
                     :item-props (assoc item-props :data-value value)}]
         (dropdown-editor-menuitem option)))]))

(rum/defc default-value-subitem
  [property]
  (let [property-type (get-in property [:block/schema :type])
        option (if (= :checkbox property-type)
                 (let [default-value (:logseq.property/scalar-default-value property)]
                   {:icon :settings-2
                    :title "Default value"
                    :toggle-checked? (boolean default-value)
                    :checkbox? true
                    :on-toggle-checked-change (fn []
                                                (db-property-handler/set-block-property! (:block/uuid property) :logseq.property/scalar-default-value (not default-value)))})
                 (let [default-value (:logseq.property/default-value property)]
                   {:icon :settings-2 :title "Default value"
                    :desc (if default-value (db-property/property-value-content default-value) "Set value")
                    :submenu-content (fn [] (pdv/default-value-config property))}))]
    (dropdown-editor-menuitem option)))

(rum/defc ^:large-vars/cleanup-todo dropdown-editor-impl
  "property: block entity"
  [property owner-block values {:keys [class-schema? debug?]}]
  (let [title (:block/title property)
        property-schema (:block/schema property)
        property-type (get property-schema :type)
        property-type-label' (some-> property-type (property-type-label))
        enable-closed-values? (contains? db-property-type/closed-value-property-types
                                         (or property-type :default))
        icon (:logseq.property/icon property)
        icon (when icon [:span.float-left.w-4.h-4.overflow-hidden.leading-4.relative
                         (icon-component/icon icon {:size 15})])
        built-in? (ldb/built-in? property)
        disabled? (or built-in? config/publishing?)]
    [:<>
     (dropdown-editor-menuitem {:icon :pencil :title "Property name" :desc [:span.flex.items-center.gap-1 icon title]
                                :submenu-content (fn [ops] (name-edit-pane property (assoc ops :disabled? disabled?)))})
     (let [disabled?' (or disabled? (and property-type (seq values)))]
       (dropdown-editor-menuitem {:icon :letter-t
                                  :title "Property type"
                                  :desc (if disabled?'
                                          (ui/tippy {:html        [:div.w-96
                                                                   "The type of this property is locked once you start using it. This is to make sure all your existing information stays correct if the property type is changed later. To unlock, all uses of a property must be deleted."]
                                                     :class       "tippy-hover ml-2"
                                                     :interactive true
                                                     :disabled    false}
                                                    (str property-type-label'))
                                          (str property-type-label'))
                                  :disabled? disabled?'
                                  :submenu-content (fn [ops]
                                                     (property-type-sub-pane property ops))}))

     (when (and (= property-type :node)
                (not (contains? #{:logseq.property/parent} (:db/ident property))))
       (dropdown-editor-menuitem {:icon :hash
                                  :title "Specify node tags"
                                  :desc ""
                                  :submenu-content (fn [_ops]
                                                     [:div.px-4
                                                      (class-select property {:default-open? false})])}))

     (when (and (contains? db-property-type/default-value-ref-property-types property-type)
                (not (db-property/many? property))
                (not (and enable-closed-values?
                          (seq (:property/closed-values property))))
                (not= :logseq.property/enable-history? (:db/ident property)))
       (default-value-subitem property))

     (when enable-closed-values?
       (let [values (:property/closed-values property)]
         (dropdown-editor-menuitem {:icon :list :title "Available choices"
                                    :desc (when (seq values) (str (count values) " choices"))
                                    :submenu-content (fn [] (choices-sub-pane property {:disabled? config/publishing?}))})))

     (when enable-closed-values?
       (let [values (:property/closed-values property)]
         (when (>= (count values) 2)
           (let [checked? (contains?
                           (set (map :db/id (:logseq.property/checkbox-display-properties owner-block)))
                           (:db/id property))]
             (dropdown-editor-menuitem
              {:icon :checkbox :title "Show as checkbox"
               :desc (when owner-block
                       (shui/switch
                        {:id "show as checkbox" :size "sm"
                         :checked checked?
                         :on-click util/stop-propagation
                         :on-checked-change
                         (fn [value]
                           (if value
                             (db-property-handler/set-block-property! (:db/id owner-block) :logseq.property/checkbox-display-properties (:db/id property))
                             (db-property-handler/delete-property-value! (:db/id owner-block) :logseq.property/checkbox-display-properties (:db/id property))))}))
               :submenu-content (fn []
                                  (checkbox-state-mapping values))})))))

     (when (and (contains? db-property-type/cardinality-property-types property-type) (not disabled?))
       (let [many? (db-property/many? property)]
         (dropdown-editor-menuitem {:icon :checks :title "Multiple values"
                                    :toggle-checked? many?
                                    :on-toggle-checked-change
                                    (fn []
                                      (let [update-cardinality-fn #(db-property-handler/upsert-property! (:db/ident property)
                                                                                                         (assoc property-schema :cardinality (if many? :one :many)) {})]
                                      ;; Only show dialog for existing values as it can be reversed for unused properties
                                        (if (and (seq values) (not many?))
                                          (-> (shui/dialog-confirm!
                                               "This action cannot be undone. Do you want to change this property to have multiple values?")
                                              (p/then update-cardinality-fn))
                                          (update-cardinality-fn))))})))

     (when (not= :logseq.property/enable-history? (:db/ident property))
       (let [property-type (get-in property [:block/schema :type])
             group' (->> [(when (and (not (contains? #{:logseq.property/parent :logseq.property.class/properties} (:db/ident property)))
                                     (contains? #{:default :number :date :checkbox :node} property-type)
                                     (not
                                      (and (= :default property-type)
                                           (empty? (:property/closed-values property))
                                           (contains? #{nil :properties} (:position property-schema)))))
                            (let [position (:position property-schema)]
                              (dropdown-editor-menuitem {:icon :float-left :title "UI position" :desc (some->> position (get position-labels) (:title))
                                                         :item-props {:class "ui__position-trigger-item"}
                                                         :disabled? config/publishing?
                                                         :submenu-content (fn [ops] (ui-position-sub-pane property (assoc ops :position position)))})))

                          (when (not (contains? #{:logseq.property/parent :logseq.property.class/properties} (:db/ident property)))
                            (dropdown-editor-menuitem {:icon :eye-off :title "Hide by default" :toggle-checked? (boolean (:hide? property-schema))
                                                       :disabled? config/publishing?
                                                       :on-toggle-checked-change #(db-property-handler/upsert-property! (:db/ident property)
                                                                                                                        (assoc property-schema :hide? %) {})}))
                          (when (not (contains? #{:logseq.property/parent :logseq.property.class/properties} (:db/ident property)))
                            (dropdown-editor-menuitem {:icon :eye-off :title "Hide empty value" :toggle-checked? (boolean (:logseq.property/hide-empty-value property))
                                                       :disabled? config/publishing?
                                                       :on-toggle-checked-change #(db-property-handler/set-block-property! (:db/id property)
                                                                                                                           :logseq.property/hide-empty-value
                                                                                                                           (not (:logseq.property/hide-empty-value property)))}))]
                         (remove nil?))]
         (when (> (count group') 0)
           (cons (shui/dropdown-menu-separator) group'))))

     (when owner-block
       [:<>
        (shui/dropdown-menu-separator)
        (dropdown-editor-menuitem
         {:icon :share-3 :title "Go to this property" :desc ""
          :item-props {:class "opacity-90 focus:opacity-100"
                       :on-select (fn []
                                    (shui/popup-hide-all!)
                                    (route-handler/redirect-to-page! (:block/uuid property)))}})])

     (when (and owner-block
                ;; Any property should be removable from Tag Properties
                (or class-schema?
                    (not (and
                          (ldb/class? owner-block)
                          (contains? #{:logseq.property/parent} (:db/ident property))))))
       (dropdown-editor-menuitem
        {:id :delete-property :icon :x
         :title (if class-schema? "Delete property from tag" "Delete property from node")
         :desc "" :disabled? false
         :item-props {:class "opacity-60 focus:!text-red-rx-09 focus:opacity-100"
                      :on-select (fn [^js e]
                                   (util/stop e)
                                   (-> (p/do!
                                        (handle-delete-property! owner-block property {:class-schema? class-schema?})
                                        (shui/popup-hide-all!))
                                       (p/catch (fn [] (restore-root-highlight-item! :delete-property)))))}}))
     (when debug?
       [:<>
        (shui/dropdown-menu-separator)
        (dropdown-editor-menuitem
         {:icon :bug :title (str (:db/ident property)) :desc "" :disabled? false
          :item-props {:class "opacity-60 focus:opacity-100 focus:!text-red-rx-08"
                       :on-select (fn []
                                    (dev-common-handler/show-entity-data (:db/id property))
                                    (shui/popup-hide!))}})])]))

(rum/defcs dropdown-editor < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [*values (atom :loading)
                 repo (state/get-current-repo)
                 property (first (:rum/args state))
                 ident (:db/ident property)]
             (p/let [_ (db-async/<get-block repo (:block/uuid property))
                     result (db-async/<get-block-property-values repo ident)]
               (reset! *values result))
             (assoc state ::values *values)))}
  [state property* owner-block opts]
  (let [property (db/sub-block (:db/id property*))
        owner-block (when (:db/id owner-block) (db/sub-block (:db/id owner-block)))
        values (rum/react (::values state))]
    (when-not (= :loading values)
      (dropdown-editor-impl property owner-block values opts))))
