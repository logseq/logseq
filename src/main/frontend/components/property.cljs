(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.util :as components-pu]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.handler.property.util :as pu]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- <add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context."
  [entity property-uuid-or-name schema {:keys [class-schema?]}]
  (p/let [repo (state/get-current-repo)
          ;; Both conditions necessary so that a class can add its own page properties
          add-class-property? (and (ldb/class? entity) class-schema?)
          result (when (uuid? property-uuid-or-name)
                   (db-async/<get-block repo property-uuid-or-name {:children? false}))
          ;; In block context result is in :block
          property (some-> (if (:block result) (:db/id (:block result)) (:db/id result))
                           db/entity)]
    ;; existing property selected or entered
    (if property
      (do
        (when (and (not (ldb/public-built-in-property? property))
                   (ldb/built-in? property))
          (notification/show! "This is a private built-in property that can't be used." :error))
        property)
      ;; new property entered
      (if (db-property/valid-property-name? property-uuid-or-name)
        (if add-class-property?
          (p/let [result (db-property-handler/upsert-property! nil schema {:property-name property-uuid-or-name})
                  property (db/entity (:db/id result))
                  _ (pv/<add-property! entity (:db/ident property) "" {:class-schema? class-schema? :exit-edit? false})]
            property)
          (p/let [result (db-property-handler/upsert-property! nil schema {:property-name property-uuid-or-name})]
            (db/entity (:db/id result))))
        (notification/show! "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['." :error)))))

;; TODO: This component should be cleaned up as it's only used for new properties and used to be used for existing properties
(rum/defcs property-type-select <
  shortcut/disable-all-shortcuts
  [state property {:keys [*property *property-name *property-schema built-in? disabled?
                          show-type-change-hints? block *show-new-property-config?
                          *show-class-select?
                          default-open? class-schema?]
                   :as opts}]
  (let [property-name (or (and *property-name @*property-name) (:block/title property))
        property-schema (or (and *property-schema @*property-schema) (:block/schema property))
        schema-types (->> (concat db-property-type/user-built-in-property-types
                                  (when built-in?
                                    db-property-type/internal-built-in-property-types))
                          (map (fn [type]
                                 {:label (property-config/property-type-label type)
                                  :value type})))]
    [:div {:class "flex items-center"}
     (shui/select
      (cond->
       {:default-open (boolean default-open?)
        :disabled disabled?
        :on-value-change
        (fn [v]
          (let [type (keyword (string/lower-case v))
                update-schema-fn #(assoc % :type type)]
            (when *property-schema
              (swap! *property-schema update-schema-fn))
            (let [schema (or (and *property-schema @*property-schema)
                             (update-schema-fn property-schema))]
              (when *show-new-property-config?
                (reset! *show-new-property-config? :adding-property))
              (p/let [property' (when block (<add-property-from-dropdown block property-name schema opts))
                      property (or property' property)
                      add-class-property? (and (ldb/class? block) class-schema?)]
                (when *property (reset! *property property))
                (p/do!
                 (when *show-new-property-config?
                   (reset! *show-new-property-config? false))
                 (when (= (:type schema) :node) (reset! *show-class-select? true))
                 (components-pu/update-property! property property-name schema)
                 (cond
                   (and *show-class-select? @*show-class-select?)
                   nil
                   add-class-property?
                   (do
                     (shui/popup-hide!)
                     (shui/dialog-close!))
                   (and block (= type :checkbox))
                   (p/do!
                    (ui/hide-popups-until-preview-popup!)
                    (let [value (if-some [value (:logseq.property/scalar-default-value property)]
                                  value
                                  false)]
                      (pv/<add-property! block (:db/ident property) value {:exit-edit? true})))
                   (and block
                        (contains? #{:default :url} type)
                        (not (seq (:property/closed-values property))))
                   (pv/<create-new-block! block property "")))))))}

        ;; only set when in property configure modal
        (and *property-name (:type property-schema))
        (assoc :default-value (name (:type property-schema))))
      (shui/select-trigger
       {:class "!px-2 !py-0 !h-8"}
       (shui/select-value
        {:placeholder "Select a property type"}))
      (shui/select-content
       (shui/select-group
        (for [{:keys [label value disabled]} schema-types]
          (shui/select-item {:value value :disabled disabled} label)))))
     (when show-type-change-hints?
       (ui/tippy {:html        "Changing the property type clears some property configurations."
                  :class       "tippy-hover ml-2"
                  :interactive true
                  :disabled    false}
                 (svg/info)))]))

(rum/defc property-select
  [exclude-properties select-opts]
  (let [[properties set-properties!] (rum/use-state nil)
        [classes set-classes!] (rum/use-state nil)
        [excluded-properties set-excluded-properties!] (rum/use-state nil)]
    (rum/use-effect!
     (fn []
       (p/let [repo (state/get-current-repo)
               properties (db-async/<db-based-get-all-properties repo)
               classes (->> (db-model/get-all-classes repo)
                            (remove ldb/built-in?))]
         (set-classes! classes)
         (set-properties! (remove exclude-properties properties))
         (set-excluded-properties! (->> properties
                                        (filter exclude-properties)
                                        (map :block/title)
                                        set))))
     [])
    (let [items (concat
                 (map (fn [x]
                        {:label (:block/title x)
                         :value (:block/uuid x)}) properties)
                 (map (fn [x]
                        {:label (:block/title x)
                         :value (:block/uuid x)
                         :group "Tags"}) classes))]
      [:div.ls-property-add.flex.flex-row.items-center.property-key
       [:div.ls-property-key
        (select/select (merge
                        {:items items
                         :grouped? true
                         :extract-fn :label
                         :dropdown? false
                         :close-modal? false
                         :new-case-sensitive? true
                         :show-new-when-not-exact-match? true
                         :exact-match-exclude-items (fn [s] (contains? excluded-properties s))
                         :input-default-placeholder "Add or change property"}
                        select-opts))]])))

(rum/defc property-icon
  [property property-type]
  (let [type (or (get-in property [:block/schema :type] property-type) :default)
        ident (:db/ident property)
        icon (cond
               (= ident :block/tags)
               "hash"
               (string/starts-with? (str ident) ":plugin.")
               "puzzle"
               :else
               (case type
                 :number "number"
                 :date "calendar"
                 :datetime "calendar"
                 :checkbox "checkbox"
                 :url "link"
                 :page "page"
                 :node "letter-n"
                 "letter-t"))]
    (ui/icon icon {:class "opacity-50"
                   :size 15})))

(defn- property-input-on-chosen
  [block *property *property-key *show-new-property-config? {:keys [class-schema?]}]
  (fn [{:keys [value label]}]
    (reset! *property-key (if (uuid? value) label value))
    (let [property (when (uuid? value) (db/entity [:block/uuid value]))]
      (when (and *show-new-property-config? (not (ldb/property? property)))
        (reset! *show-new-property-config? true))
      (reset! *property property)
      (when property
        (let [add-class-property? (and (ldb/class? block) class-schema?)
              type (get-in property [:block/schema :type])]
          (cond
            add-class-property?
            (p/do!
             (pv/<add-property! block (:db/ident property) "" {:class-schema? class-schema?})
             (shui/popup-hide!)
             (shui/dialog-close!))

            (= :checkbox type)
            (p/do!
             (ui/hide-popups-until-preview-popup!)
             (shui/popup-hide!)
             (shui/dialog-close!)
             (let [value (if-some [value (:logseq.property/scalar-default-value property)]
                           value
                           false)]
               (pv/<add-property! block (:db/ident property) value {:exit-edit? true})))

            (and (contains? #{:default :url} type)
                 (not (seq (:property/closed-values property))))
            (pv/<create-new-block! block property "")

            ;; using class as property
            (and property (ldb/class? property))
            (let [schema (assoc (:block/schema property)
                                :type :node)]
              (p/do!
               (db/transact! (state/get-current-repo)
                             [{:db/id (:db/id property)
                               :db/ident (:db/ident property)
                               :db/cardinality :db.cardinality/one
                               :db/valueType :db.type/ref
                               :db/index true
                               :block/tags :logseq.class/Property
                               :block/schema schema
                               :property/schema.classes (:db/id property)}]
                             {:outliner-op :save-block})
               (reset! *show-new-property-config? false)))

            (or (not= :default type)
                (and (= :default type) (seq (:property/closed-values property))))
            (reset! *show-new-property-config? false)))))))

(rum/defc property-key-title
  [block property class-schema?]
  (let [block-container (state/get-component :block/container)]
    (shui/trigger-as
     :a
     {:tabIndex 0
      :title (:block/title property)
      :class "property-k flex select-none jtrigger w-full"
      :on-pointer-down (fn [^js e]
                         (when (util/meta-key? e)
                           (route-handler/redirect-to-page! (:block/uuid property))
                           (.preventDefault e)))
      :on-click (fn [^js/MouseEvent e]
                  (if (state/editing?)
                    (editor-handler/escape-editing {:select? true})
                    (shui/popup-show! (.-target e)
                                      (fn []
                                        (property-config/dropdown-editor property block {:debug? (.-altKey e)
                                                                                         :class-schema? class-schema?}))
                                      {:content-props
                                       {:class "ls-property-dropdown-editor as-root"
                                        :onEscapeKeyDown (fn [e]
                                                           (util/stop e)
                                                           (shui/popup-hide!)
                                                           (when-let [input (state/get-input)]
                                                             (.focus input)))}
                                       :align "start"
                                       :as-dropdown? true})))}
     (block-container {:property? true} property))))

(rum/defc property-key-cp < rum/static
  [block property {:keys [other-position? class-schema?]}]
  (let [icon (:logseq.property/icon property)]
    [:div.property-key-inner.jtrigger-view
     ;; icon picker
     (when-not other-position?
       (let [content-fn (fn [{:keys [id]}]
                          (icon-component/icon-search
                           {:on-chosen
                            (fn [_e icon]
                              (if icon
                                (db-property-handler/upsert-property! (:db/ident property)
                                                                      (:block/schema property)
                                                                      {:properties {:logseq.property/icon icon}})
                                (db-property-handler/remove-block-property! (:db/id property)
                                                                            (pu/get-pid :logseq.property/icon)))
                              (shui/popup-hide! id))
                            :icon-value icon
                            :del-btn? (boolean icon)}))]

         [:div.property-icon
          (shui/trigger-as
           :button.property-m
           (-> (when-not config/publishing?
                 {:on-click (fn [^js e]
                              (shui/popup-show! (.-target e) content-fn
                                                {:as-dropdown? true :auto-focus? true
                                                 :content-props {:onEscapeKeyDown #(.preventDefault %)}}))})
               (assoc :class "flex items-center"))
           (if icon
             (icon-component/icon icon {:size 15 :color? true})
             (property-icon property nil)))]))

     (if config/publishing?
       [:a.property-k.flex.select-none.jtrigger
        {:on-click #(route-handler/redirect-to-page! (:block/uuid property))}
        (:block/title property)]
       (property-key-title block property class-schema?))]))

(rum/defcs property-input < rum/reactive
  (rum/local nil ::ref)
  (rum/local false ::show-new-property-config?)
  (rum/local false ::show-class-select?)
  (rum/local {} ::property-schema)
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn [_state _e type]
                 (when (contains? #{:esc} type)
                   (shui/popup-hide!)
                   (shui/popup-hide!)
                   (shui/dialog-close!)
                   (when-let [^js input (state/get-input)]
                     (.focus input)))))))
  {:init (fn [state]
           (state/set-editor-action! :property-input)
           (assoc state ::property (or (:*property (last (:rum/args state)))
                                       (atom nil))))
   :will-unmount (fn [state]
                   (let [args (:rum/args state)
                         *property-key (second args)
                         {:keys [original-block edit-original-block]} (last args)
                         editing-default-property? (and original-block (state/get-edit-block)
                                                        (not= (:db/id original-block) (:db/id (state/get-edit-block))))]
                     (when *property-key (reset! *property-key nil))
                     (when (and original-block edit-original-block)
                       (edit-original-block {:editing-default-property? editing-default-property?})))
                   (state/set-editor-action! nil)
                   state)}
  [state block *property-key {:keys [class-schema?]
                              :as opts}]
  (let [*ref (::ref state)
        *property (::property state)
        *show-new-property-config? (::show-new-property-config? state)
        *show-class-select? (::show-class-select? state)
        *property-schema (::property-schema state)
        page? (ldb/page? block)
        block-types (let [types (ldb/get-entity-types block)]
                      (cond-> types
                        (and page? (not (contains? types :page)))
                        (conj :page)
                        (empty? types)
                        #{:block}))
        exclude-properties (fn [m]
                             (let [view-context (get-in m [:block/schema :view-context] :all)]
                               (or (contains? #{:logseq.property/query} (:db/ident m))
                                   (and (not page?) (contains? #{:block/alias} (:db/ident m)))
                                   ;; Filters out properties from being in wrong :view-context and :never view-contexts
                                   (and (not= view-context :all) (not (contains? block-types view-context)))
                                   (and (ldb/built-in? block) (contains? #{:logseq.property/parent} (:db/ident m))))))
        property (rum/react *property)
        property-key (rum/react *property-key)]
    [:div.ls-property-input.flex.flex-1.flex-row.items-center.flex-wrap.gap-1
     {:ref #(reset! *ref %)}
     (if property-key
       [:div.ls-property-add.gap-1.flex.flex-1.flex-row.items-center
        [:div.flex.flex-row.items-center.property-key.gap-1
         (when-not (:db/id property) (property-icon property (:type @*property-schema)))
         (if (:db/id property)                              ; property exists already
           (property-key-cp block property opts)
           [:div property-key])]
        [:div.flex.flex-row {:on-pointer-down (fn [e] (util/stop-propagation e))}
         (when (not= @*show-new-property-config? :adding-property)
           (cond
             @*show-new-property-config?
             (property-type-select property (merge opts
                                                   {:*property *property
                                                    :*property-name *property-key
                                                    :*property-schema *property-schema
                                                    :default-open? true
                                                    :block block
                                                    :*show-new-property-config? *show-new-property-config?
                                                    :*show-class-select? *show-class-select?}))

             (and property @*show-class-select?)
             (property-config/class-select property (assoc opts
                                                           :on-hide #(reset! *show-class-select? false)
                                                           :multiple-choices? false
                                                           :default-open? true
                                                           :no-class? true))

             :else
             (when (and property (not class-schema?))
               (pv/property-value block property (get block (:db/ident property)) (assoc opts :editing? true)))))]]

       (let [on-chosen (property-input-on-chosen block *property *property-key *show-new-property-config? opts)
             input-opts {:on-key-down
                         (fn [e]
                           ;; `Backspace` to close property popup and back to editing the current block
                           (when (and (= (util/ekey e) "Backspace")
                                      (= "" (.-value (.-target e))))
                             (util/stop e)
                             (shui/popup-hide!)))}]
         (property-select exclude-properties {:on-chosen on-chosen
                                              :input-opts input-opts})))]))

(rum/defcs new-property < rum/reactive
  [state block opts]
  (when-not config/publishing?
    [:div.ls-new-property {:style {:margin-left 6 :margin-top 1}}
     [:a.fade-link.flex.jtrigger
      {:tab-index 0
       :on-click (fn [e]
                   (state/pub-event! [:editor/new-property (merge opts {:block block
                                                                        :target (.-target e)})]))}
      [:div.flex.flex-row.items-center.shrink-0
       (ui/icon "plus" {:size 16})
       [:div.ml-1
        (if (:class-schema? opts)
          "Add tag property"
          "Add property")]]]]))

(defn- resolve-linked-block-if-exists
  "Properties will be updated for the linked page instead of the refed block.
  For example, the block below has a reference to the page \"How to solve it\",
  we'd like the properties of the class \"book\" (e.g. Authors, Published year)
  to be assigned for the page `How to solve it` instead of the referenced block.

  Block:
  - [[How to solve it]] #book
  "
  [block]
  (if-let [linked-block (:block/link block)]
    (db/sub-block (:db/id linked-block))
    (db/sub-block (:db/id block))))

(rum/defc property-cp <
  rum/reactive
  db-mixins/query
  [block k v {:keys [inline-text page-cp sortable-opts] :as opts}]
  (when (keyword? k)
    (when-let [property (db/sub-block (:db/id (db/entity k)))]
      (let [type (get-in property [:block/schema :type] :default)
            closed-values? (seq (:property/closed-values property))
            block? (and v
                        (not closed-values?)
                        (or (and (map? v) (:block/page v))
                            (and (coll? v)
                                 (map? (first v))
                                 (or (:block/page (first v))
                                     (= :logseq.property/empty-placeholder (:db/ident (first v))))))
                        (contains? #{:default :url} type))
            date? (= type :date)
            datetime? (= type :datetime)
            checkbox? (= type :checkbox)
            property-key-cp' (property-key-cp block property (assoc (select-keys opts [:class-schema?])
                                                                    :block? block?
                                                                    :inline-text inline-text
                                                                    :page-cp page-cp))]
        [:div {:key (str "property-pair-" (:db/id block) "-" (:db/id property))
               :class (cond
                        (= (:db/ident property) :logseq.property.class/properties)
                        "property-pair !flex !flex-col"
                        (or date? datetime? checkbox?)
                        "property-pair items-center"
                        :else
                        "property-pair items-start")}
         (if (seq sortable-opts)
           (dnd/sortable-item (assoc sortable-opts :class "property-key") property-key-cp')
           [:div.property-key property-key-cp'])

         (let [class-properties? (= (:db/ident property) :logseq.property.class/properties)
               property-desc (when-not (= (:db/ident property) :logseq.property/description)
                               (:logseq.property/description property))]
           [:div.property-value-container.flex.flex-row.gap-1.items-center
            (cond-> {}
              class-properties? (assoc :class (if (:logseq.property.class/properties block)
                                                "ml-2 -mt-1"
                                                "-ml-1")))
            (when-not (or block? class-properties? (and property-desc (:class-schema? opts)))
              [:div {:class "pl-1.5 -mr-[3px] opacity-60"}
               [:span.bullet-container [:span.bullet]]])
            [:div.flex.flex-1
             [:div.property-value.flex.flex-1
              (cond-> {}
                class-properties? (assoc :class :opacity-90))
              (if (:class-schema? opts)
                (pv/property-value property (db/entity :logseq.property/description) property-desc opts)
                (pv/property-value block property v opts))]]])]))))

(rum/defcs ordered-properties < rum/reactive
  {:init (fn [state]
           (assoc state ::properties-order (atom (mapv first (second (:rum/args state))))))
   :should-update (fn [old-state new-state]
                    (let [[_ p1 opts1] (:rum/args old-state)
                          [_ p2 opts2] (:rum/args new-state)
                          p1-keys (map first p1)
                          p1-set (set p1-keys)
                          p1-m (zipmap (map first p1) (map second p1))
                          p2-m (zipmap (map first p2) (map second p2))
                          p2-set (set (map first p2))]
                      (when-not (= p1-set p2-set)
                        (reset! (::properties-order new-state) (mapv first p2)))
                      (not= [p1-set (map p1-m p1-keys) opts1] [p2-set (map p2-m p1-keys) opts2])))}
  [state block properties opts]
  (let [*properties-order (::properties-order state)
        properties-order (rum/react *properties-order)
        m (zipmap (map first properties) (map second properties))
        properties (mapv (fn [k] [k (get m k)]) properties-order)
        choices (map (fn [[k v]]
                       (let [id (subs (str k) 1)
                             opts (assoc opts :sortable-opts {:id id})]
                         {:id id
                          :value k
                          :content (property-cp block k v opts)})) properties)]
    (dnd/items choices
               {:sort-by-inner-element? true
                :on-drag-end (fn [properties-order {:keys [active-id over-id direction]}]
                               (let [move-down? (= direction :down)
                                     over (db/entity (keyword over-id))
                                     active (db/entity (keyword active-id))
                                     over-order (:block/order over)
                                     new-order (if move-down?
                                                 (let [next-order (db-order/get-next-order (db/get-db) nil (:db/id over))]
                                                   (db-order/gen-key over-order next-order))
                                                 (let [prev-order (db-order/get-prev-order (db/get-db) nil (:db/id over))]
                                                   (db-order/gen-key prev-order over-order)))]
                                 ;; Reset *properties-order without waiting for `db/transact!` so that the UI will not be
                                 ;; converted back to the old order and then the new order.
                                 (reset! *properties-order properties-order)
                                 (db/transact! (state/get-current-repo)
                                               [{:db/id (:db/id active)
                                                 :block/order new-order}
                                                (outliner-core/block-with-updated-at
                                                 {:db/id (:db/id block)})]
                                               {:outliner-op :save-block})))})))

(rum/defc properties-section < rum/reactive db-mixins/query
  [block properties opts]
  (when (seq properties)
      ;; Sort properties by :block/order
    (let [properties' (sort-by (fn [[k _v]]
                                 (if (= k :logseq.property.class/properties)
                                   "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
                                   (:block/order (db/entity k)))) properties)]
      (ordered-properties block properties' opts))))

(defn- async-load-classes!
  [block]
  (let [repo (state/get-current-repo)
        classes (concat (:block/tags block) (outliner-property/get-classes-parents (:block/tags block)))]
    (doseq [class classes]
      (db-async/<get-block repo (:db/id class) :children? false))
    (when (ldb/class? block)
      (doseq [property (:logseq.property.class/properties block)]
        (db-async/<get-block repo (:db/id property) :children? false)))
    classes))

(rum/defcs ^:large-vars/cleanup-todo properties-area < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [target-block (first (:rum/args state))
                 block (resolve-linked-block-if-exists target-block)]
             (assoc state
                    ::id (str (random-uuid))
                    ::block block
                    ::classes (async-load-classes! block))))
   :will-remount (fn [state]
                   (let [block (db/entity (:db/id (::block state)))]
                     (assoc state ::classes (async-load-classes! block))))}
  [state _target-block {:keys [class-schema? sidebar-properties?] :as opts}]
  (let [id (::id state)
        db-id (:db/id (::block state))
        block (db/sub-block db-id)
        show-empty-and-hidden-properties? (let [{:keys [mode show? ids]} (state/sub :ui/show-empty-and-hidden-properties?)]
                                            (and show?
                                                 (or (= mode :global)
                                                     (and (set? ids) (contains? ids (:block/uuid block))))))
        _ (doseq [class (::classes state)]
            (db/sub-block (:db/id class)))
        class? (ldb/class? block)
        block-properties (:block/properties block)
        properties (cond
                     class-schema?
                     (->> (db-property/get-class-ordered-properties block)
                          (map :db/ident)
                          distinct
                          (map #(vector % %)))

                     :else
                     block-properties)
        remove-built-in-or-other-position-properties
        (fn [properties]
          (remove (fn [property]
                    (let [id (if (vector? property) (first property) property)]
                      (or
                       (= id :block/tags)
                       (when-let [ent (db/entity id)]
                         (or
                          ;; built-in
                          (and (not (ldb/public-built-in-property? ent))
                               ;; TODO: Use ldb/built-in? when intermittent lazy loading issue fixed
                               (get db-property/built-in-properties (:db/ident ent)))
                          ;; other position
                          (when-not (or (and (:sidebar? opts) (= (:id opts) (str (:block/uuid block))))
                                        show-empty-and-hidden-properties?)
                            (outliner-property/property-with-other-position? ent))

                          (and (:gallery-view? opts)
                               (contains? #{:logseq.property.class/properties} (:db/ident ent))))))))
                  properties))
        {:keys [all-classes classes-properties]} (outliner-property/get-block-classes-properties (db/get-db) (:db/id block))
        classes-properties-set (set (map :db/ident classes-properties))
        block-own-properties (->> properties
                                  (remove (fn [[id _]] (classes-properties-set id))))
        root-block? (= (:id opts) (str (:block/uuid block)))
        state-hide-empty-properties? (:ui/hide-empty-properties? (state/get-config))
        ;; This section produces own-properties and full-hidden-properties
        hide-with-property-id (fn [property-id]
                                (let [property (db/entity property-id)]
                                  (cond
                                    show-empty-and-hidden-properties?
                                    false
                                    root-block?
                                    false
                                    (and (:logseq.property/hide-empty-value property)
                                         (nil? (get properties property-id)))
                                    true
                                    state-hide-empty-properties?
                                    (nil? (get block property-id))
                                    :else
                                    (boolean (:hide? (:block/schema property))))))
        property-hide-f (cond
                          config/publishing?
                          ;; Publishing is read only so hide all blank properties as they
                          ;; won't be edited and distract from properties that have values
                          (fn [[property-id property-value]]
                            (or (nil? property-value)
                                (hide-with-property-id property-id)))
                          state-hide-empty-properties?
                          (fn [[property-id property-value]]
                            ;; User's selection takes precedence over config
                            (if (contains? (:block/schema (db/entity property-id)) :hide?)
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {_block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        class-properties (loop [classes all-classes
                                properties (set (map first block-own-properties'))
                                result []]
                           (if-let [class (first classes)]
                             (let [cur-properties (->> (db-property/get-class-ordered-properties class)
                                                       (map :db/ident)
                                                       (remove properties)
                                                       (remove hide-with-property-id))]
                               (recur (rest classes)
                                      (set/union properties (set cur-properties))
                                      (if (seq cur-properties)
                                        (into result cur-properties)
                                        result)))
                             result))
        full-properties (->> (concat block-own-properties'
                                     (map (fn [p] [p (get block p)]) class-properties)
                                     (when (and class? (nil? (:logseq.property.class/properties block)))
                                       [[:logseq.property.class/properties nil]]))
                             remove-built-in-or-other-position-properties)]
    (cond
      (and (empty? full-properties) (not (:class-schema? opts)))
      (when sidebar-properties?
        (rum/with-key (new-property block opts) (str id "-add-property")))

      :else
      (let [remove-properties #{:logseq.property/icon :logseq.property/query}
            properties' (remove (fn [[k _v]] (contains? remove-properties k)) full-properties)
            properties'' (cond->> properties'
                           (not class-schema?)
                           (remove (fn [[k _v]] (= k :logseq.property.class/properties))))
            page? (ldb/page? block)]
        [:div.ls-properties-area
         {:id id
          :class (util/classnames [{:class-properties class-schema?
                                    :ls-page-properties (and page? (not class-schema?))}])
          :tab-index 0
          :on-key-up #(when-let [block (and (= "Escape" (.-key %))
                                            (.closest (.-target %) "[blockid]"))]
                        (let [target (.-target %)]
                          (when-not (d/has-class? target "ls-popup-closed")
                            (state/set-selection-blocks! [block])
                            (some-> js/document.activeElement (.blur)))
                          (d/remove-class! target "ls-popup-closed")))}
         (properties-section block (if class-schema? properties properties'') opts)

         (when page?
           (rum/with-key (new-property block opts) (str id "-add-property")))

         (when page?
           (let [properties'' (filter (fn [[k _v]] (= k :logseq.property.class/properties)) properties')]
             (when (seq properties'')
               [:<>
                (when-not class-schema? [:hr.my-4])
                (properties-section block (if class-schema? properties properties'') opts)])))]))))
