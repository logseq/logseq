(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- <add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context."
  [entity id-or-name* schema {:keys [class-schema? block-uuid]}]
  (p/let [repo (state/get-current-repo)
          id-or-name (or block-uuid id-or-name*)
          ;; Both conditions necessary so that a class can add its own page properties
          add-class-property? (and (ldb/class? entity) class-schema?)
          property (db-async/<get-block repo id-or-name {:children? false})
          property? (ldb/property? property)
          property-title (or (:block/title property) id-or-name)]
    ;; existing property selected or entered
    (if property?
      (do
        (when (and (not (ldb/public-built-in-property? property))
                   (ldb/built-in? property))
          (notification/show! "This is a private built-in property that can't be used." :error))
        property)
      ;; new property entered or converting page to property
      (if (db-property/valid-property-name? property-title)
        (p/let [opts (cond-> {:property-name property-title}
                       (and (not property?) (ldb/internal-page? property))
                       (assoc :properties {:db/id (:db/id property)}))
                result (db-property-handler/upsert-property! nil schema opts)
                property (db/entity (:db/id result))
                _ (when add-class-property?
                    (pv/<add-property! entity (:db/ident property) "" {:class-schema? class-schema? :exit-edit? false}))]
          property)
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
        property-schema (or (and *property-schema @*property-schema)
                            (select-keys property [:logseq.property/type]))
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
                update-schema-fn #(assoc % :logseq.property/type type)]
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
                 (when (= (:logseq.property/type schema) :node) (reset! *show-class-select? true))
                 (db-property-handler/upsert-property!
                  (:db/ident property)
                  schema
                  {})

                 (cond
                   (and *show-class-select? @*show-class-select?)
                   nil
                   add-class-property?
                   (shui/popup-hide!)
                   (pv/batch-operation?)
                   nil
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
                   (pv/<create-new-block! block property "" {:batch-op? true})))))))}

        ;; only set when in property configure modal
        (and *property-name (:logseq.property/type property-schema))
        (assoc :default-value (name (:logseq.property/type property-schema))))
      (shui/select-trigger
       {:class "!px-2 !py-0 !h-8"}
       (shui/select-value
        {:placeholder "Select a property type"}))
      (shui/select-content
       (shui/select-group
        (for [{:keys [label value disabled]} schema-types]
          (shui/select-item {:key label :value value :disabled disabled
                             :on-key-down (fn [e]
                                            (when (= "Enter" (.-key e))
                                              (util/stop-propagation e)))} label)))))
     (when show-type-change-hints?
       (ui/tooltip (svg/info)
                   [:span "Changing the property type clears some property configurations."]))]))

(rum/defc property-select
  [select-opts]
  (let [[properties set-properties!] (hooks/use-state nil)
        [q set-q!] (hooks/use-state "")]
    (hooks/use-effect!
     (fn []
       (p/let [repo (state/get-current-repo)
               properties (if (:class-schema? select-opts)
                            (property-handler/get-class-property-choices)
                            (db-model/get-all-properties repo {:remove-ui-non-suitable-properties? true}))]
         (set-properties! properties)))
     [])
    (hooks/use-effect!
     (fn []
       (p/let [repo (state/get-current-repo)
               block (when-not (string/blank? q)
                       (db-async/<get-block repo q {:children? false}))
               internal-page-exists? (ldb/internal-page? block)]
         (when internal-page-exists?
           (set-properties!
            (cons (assoc block :convert-page-to-property? true) properties)))))
     [q])
    (let [items (->>
                 (map (fn [x]
                        (let [convert? (:convert-page-to-property? x)]
                          {:label (if convert?
                                    (util/format "Convert \"%s\" to property" (:block/title x))
                                    (:block/title x))
                           :value (:block/uuid x)
                           :convert-page-to-property? convert?})) properties)
                 (util/distinct-by-last-wins :value))]
      [:div.ls-property-add.flex.flex-row.items-center.property-key
       {:data-keep-selection true}
       [:div.ls-property-key
        (select/select (merge
                        {:items items
                         :grouped? true
                         :extract-fn :label
                         :dropdown? false
                         :close-modal? false
                         :new-case-sensitive? true
                         :show-new-when-not-exact-match? true
                         ;; :exact-match-exclude-items (fn [s] (contains? excluded-properties s))
                         :input-default-placeholder "Add or change property"
                         :on-input set-q!}
                        select-opts))]])))

(rum/defc property-icon
  [property property-type]
  (let [type (or (:logseq.property/type property) property-type :default)
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
                 :property "letter-p"
                 :page "page"
                 :node "point-filled"
                 "letter-t"))]
    (ui/icon icon {:class "opacity-50"
                   :size 15})))

(defn- property-input-on-chosen
  [block *property *property-key *show-new-property-config? {:keys [class-schema? remove-property?]}]
  (fn [{:keys [value label convert-page-to-property?]}]
    (let [property (when (uuid? value) (db/entity [:block/uuid value]))
          _ (reset! *property-key (if (uuid? value) (if convert-page-to-property? (:block/title property) label) value))
          batch? (pv/batch-operation?)
          repo (state/get-current-repo)]
      (if (and property remove-property?)
        (let [block-ids (map :block/uuid (pv/get-operating-blocks block))]
          (property-handler/batch-remove-block-property! repo block-ids (:db/ident property))
          (shui/popup-hide!))
        (do
          (when (and *show-new-property-config? (not (ldb/property? property)))
            (reset! *show-new-property-config? true))
          (reset! *property property)
          (when-not convert-page-to-property?
            (let [property' (some-> (:db/id property) db/entity)]
              (when (and property' (ldb/property? property'))
                (let [add-class-property? (and (ldb/class? block) class-schema?)
                      type (:logseq.property/type property')
                      default-or-url? (and (contains? #{:default :url} type)
                                           (not (seq (:property/closed-values property'))))]
                  (cond
                    add-class-property?
                    (p/do!
                     (pv/<add-property! block (:db/ident property') "" {:class-schema? class-schema?})
                     (shui/popup-hide!))

                    (and batch? (or (= :checkbox type) (and batch? default-or-url?)))
                    nil

                    (= :checkbox type)
                    (p/do!
                     (ui/hide-popups-until-preview-popup!)
                     (shui/popup-hide!)
                     (let [value (if-some [value (:logseq.property/scalar-default-value property')]
                                   value
                                   false)]
                       (pv/<add-property! block (:db/ident property') value {:exit-edit? true})))

                    default-or-url?
                    (pv/<create-new-block! block property' "" {:batch-op? true})

                    (or (not= :default type)
                        (and (= :default type) (seq (:property/closed-values property'))))
                    (reset! *show-new-property-config? false)))))))))))

(rum/defc property-key-title
  [block property class-schema?]
  (shui/trigger-as
   :a
   {:tabIndex 0
    :title (or (:block/title (:logseq.property/description property))
               (:block/title property))
    :class "property-k flex select-none jtrigger w-full"
    :on-pointer-down (fn [^js e]
                       (when (util/meta-key? e)
                         (route-handler/redirect-to-page! (:block/uuid property))
                         (.preventDefault e)))
    :on-click (fn [^js/MouseEvent e]
                (when-not (util/meta-key? e)
                  (shui/popup-show! (.-target e)
                                    (fn []
                                      (property-config/property-dropdown property block {:debug? (.-altKey e)
                                                                                         :class-schema? class-schema?}))
                                    {:content-props
                                     {:class "ls-property-dropdown as-root"
                                      :onEscapeKeyDown (fn [e]
                                                         (util/stop e)
                                                         (shui/popup-hide!)
                                                         (when-let [input (state/get-input)]
                                                           (.focus input)))}
                                     :align "start"
                                     :dropdown-menu? true
                                     :as-dropdown? true})))}

   (:block/title property)))

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
                                (db-property-handler/set-block-property! (:db/id property)
                                                                         :logseq.property/icon icon)
                                (db-property-handler/remove-block-property! (:db/id property)
                                                                            :logseq.property/icon))
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

(rum/defcs ^:large-vars/cleanup-todo property-input < rum/reactive
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
  (let [*property (::property state)
        *show-new-property-config? (::show-new-property-config? state)
        *show-class-select? (::show-class-select? state)
        *property-schema (::property-schema state)
        property (rum/react *property)
        property-key (rum/react *property-key)
        batch? (pv/batch-operation?)
        hide-property-key? (or (contains? #{:date :datetime} (:logseq.property/type property))
                               (= (:db/ident property) :logseq.property/icon)
                               (pv/select-type? block property)
                               (and
                                batch?
                                (contains? #{:default :url} (:logseq.property/type property))
                                (not (seq (:property/closed-values property))))
                               (and property (ldb/class? property)))]
    [:div.ls-property-input.flex.flex-1.flex-row.items-center.flex-wrap.gap-1
     (if property-key
       [:div.ls-property-add.gap-1.flex.flex-1.flex-row.items-center
        (when-not hide-property-key?
          [:div.flex.flex-row.items-center.property-key.gap-1
           (when-not (:db/id property) (property-icon property (:logseq.property/type @*property-schema)))
           (if (:db/id property)                              ; property exists already
             (property-key-cp block property opts)
             [:div property-key])])
        [:div.flex.flex-row {:on-pointer-down (fn [e] (util/stop-propagation e))}
         (when (not= @*show-new-property-config? :adding-property)
           (cond
             (or (nil? property) @*show-new-property-config?)
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
               (pv/property-value block property (assoc opts :editing? true)))))]]

       (let [on-chosen (property-input-on-chosen block *property *property-key *show-new-property-config? opts)
             input-opts {:on-key-down
                         (fn [e]
                           ;; `Backspace` to close property popup and back to editing the current block
                           (when (and (= (util/ekey e) "Backspace")
                                      (= "" (.-value (.-target e))))
                             (util/stop e)
                             (shui/popup-hide!)))}]
         (property-select (merge (:select-opts opts) {:on-chosen on-chosen
                                                      :input-opts input-opts
                                                      :block block
                                                      :class-schema? class-schema?}))))]))

(rum/defcs new-property < rum/reactive
  [state block opts]
  (when-not config/publishing?
    (let [add-new-property! (fn [e]
                              (state/pub-event! [:editor/new-property (merge opts {:block block
                                                                                   :target (.-target e)})]))]
      [:div.ls-new-property {:style {:margin-left 7 :margin-top 1 :font-size 15}}
       [:a.flex.jtrigger
        {:tab-index 0
         :on-click add-new-property!
         :on-key-press (fn [e]
                         (when (contains? #{"Enter" " "} (util/ekey e))
                           (.preventDefault e)
                           (add-new-property! e)))}
        [:div.flex.flex-row.items-center.shrink-0
         (ui/icon "plus" {:size 15 :class "opacity-50"})
         [:div.ml-1 {:style {:margin-top 1}}
          "Add property"]]]])))

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
      (let [type (get property :logseq.property/type :default)
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
                        (or date? datetime? checkbox?)
                        "property-pair items-center"
                        :else
                        "property-pair items-start")}
         (if (seq sortable-opts)
           (dnd/sortable-item (assoc sortable-opts :class "property-key") property-key-cp')
           [:div.property-key property-key-cp'])

         (let [property-desc (when-not (= (:db/ident property) :logseq.property/description)
                               (:logseq.property/description property))]
           [:div.ls-block.property-value-container.flex.flex-row.gap-1
            {:class (if (contains? #{:checkbox :date :datetime} type)
                      "items-center"
                      "items-start")}

            (when-not (or block? (and property-desc (:class-schema? opts)))
              [:div.flex.items-center {:style {:height 28}}
               [:div {:class "pl-1.5 -mr-[3px] opacity-60"}
                [:span.bullet-container [:span.bullet]]]])
            [:div.flex.flex-1
             [:div.property-value.flex.flex-1
              (if (:class-schema? opts)
                (pv/property-value property (db/entity :logseq.property/description) opts)
                (pv/property-value block property opts))]]])]))))

(rum/defc ordered-properties
  [block properties* sorted-property-entities opts]
  (let [[properties set-properties!] (hooks/use-state properties*)
        [properties-order set-properties-order!] (hooks/use-state (mapv first properties))
        m (zipmap (map first properties*) (map second properties*))
        properties (mapv (fn [k] [k (get m k)]) properties-order)
        choices (map (fn [[k v]]
                       (let [id (subs (str k) 1)
                             opts (assoc opts :sortable-opts {:id id})]
                         {:id id
                          :value k
                          :content (property-cp block k v opts)})) properties)]
    (hooks/use-effect!
     (fn []
       (when (not= properties properties*)
         (set-properties! properties*))

       (when (not= (set (map first properties*))
                   (set (map first properties)))
         (set-properties-order! (mapv first properties*))))
     [properties*])
    (dnd/items choices
               {:sort-by-inner-element? true
                :on-drag-end (fn [properties-order {:keys [active-id over-id direction]}]
                               (set-properties-order! properties-order)
                               (p/let [;; Before reordering properties,
                                       ;; check if the :block/order of these properties is reasonable.
                                       normalize-tx-data (db-property/normalize-sorted-entities-block-order
                                                          sorted-property-entities)
                                       _ (when (seq normalize-tx-data)
                                           (db/transact! (state/get-current-repo) normalize-tx-data))
                                       move-down? (= direction :down)
                                       over (db/entity (keyword over-id))
                                       active (db/entity (keyword active-id))
                                       over-order (:block/order over)
                                       new-order (if move-down?
                                                   (let [next-order (db-order/get-next-order (db/get-db) nil (:db/id over))]
                                                     (db-order/gen-key over-order next-order))
                                                   (let [prev-order (db-order/get-prev-order (db/get-db) nil (:db/id over))]
                                                     (db-order/gen-key prev-order over-order)))]
                                 (db/transact! (state/get-current-repo)
                                               [{:db/id (:db/id active)
                                                 :block/order new-order}
                                                (outliner-core/block-with-updated-at
                                                 {:db/id (:db/id block)})]
                                               {:outliner-op :save-block})))})))

(rum/defc properties-section < rum/static
  [block properties opts]
  (when (seq properties)
    (let [sorted-prop-entities (db-property/sort-properties (map (comp db/entity first) properties))
          prop-kv-map (reduce (fn [m [p v]] (assoc m p v)) {} properties)
          properties' (keep (fn [ent] (find prop-kv-map (:db/ident ent))) sorted-prop-entities)]
      (ordered-properties block properties' sorted-prop-entities opts))))

(rum/defc hidden-properties-cp
  [block hidden-properties {:keys [root-block? sidebar-properties?] :as opts}]
  (when (and (seq hidden-properties) (or root-block? sidebar-properties?))
    [:details.my-1
     [:summary.text-sm.opacity-50.hover:opacity-90.cursor-pointer
      {:style {:margin-left 11}}
      [:span.ml-1 "Hidden properties"]]
     [:div.mt-1
      (properties-section block hidden-properties opts)]]))

(rum/defcs ^:large-vars/cleanup-todo properties-area < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [target-block (first (:rum/args state))
                 block (resolve-linked-block-if-exists target-block)]
             (assoc state
                    ::id (str (random-uuid))
                    ::block block)))}
  [state _target-block {:keys [page-title? journal-page? sidebar-properties? tag-dialog?] :as opts}]
  (let [id (::id state)
        db-id (:db/id (::block state))
        block (db/sub-block db-id)
        show-properties? (or sidebar-properties? tag-dialog?)
        show-empty-and-hidden-properties? (let [{:keys [mode show? ids]} (state/sub :ui/show-empty-and-hidden-properties?)]
                                            (and show?
                                                 (or (= mode :global)
                                                     (and (set? ids) (contains? ids (:block/uuid block))))))
        properties (:block/properties block)
        remove-built-in-or-other-position-properties
        (fn [properties show-in-hidden-properties?]
          (remove (fn [property]
                    (let [id (if (vector? property) (first property) property)]
                      (or
                       (= id :block/tags)
                       (when-let [ent (db/entity id)]
                         (or
                          ;; built-in
                          (and (not (ldb/public-built-in-property? ent))
                               (ldb/built-in? ent))
                          ;; other position
                          (when-not (or
                                     sidebar-properties?
                                     (and page-title? (not journal-page?))
                                     show-empty-and-hidden-properties?
                                     show-in-hidden-properties?)
                            (outliner-property/property-with-other-position? ent))

                          (and (:gallery-view? opts)
                               (contains? #{:logseq.property.class/properties} (:db/ident ent))))))))
                  properties))
        {:keys [all-classes classes-properties]} (outliner-property/get-block-classes-properties (db/get-db) (:db/id block))
        classes-properties-set (set (map :db/ident classes-properties))
        block-own-properties (->> properties
                                  (remove (fn [[id _]] (classes-properties-set id))))
        state-hide-empty-properties? (:ui/hide-empty-properties? (state/get-config))
        ;; This section produces own-properties and full-hidden-properties
        hide-with-property-id (fn [property-id]
                                (let [property (db/entity property-id)]
                                  (boolean
                                   (cond
                                     show-empty-and-hidden-properties?
                                     false
                                     state-hide-empty-properties?
                                     (nil? (get block property-id))
                                     (and (:logseq.property/hide-empty-value property)
                                          (nil? (get properties property-id)))
                                     true
                                     :else
                                     (boolean (:logseq.property/hide? property))))))
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
                            (if (:logseq.property/hide? (db/entity property-id))
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        class-properties (loop [classes all-classes
                                properties (set (map first block-own-properties'))
                                result []]
                           (if-let [class (first classes)]
                             (let [cur-properties (->> (db-property/get-class-ordered-properties class)
                                                       (map :db/ident)
                                                       (remove properties))]
                               (recur (rest classes)
                                      (set/union properties (set cur-properties))
                                      (if (seq cur-properties)
                                        (into result cur-properties)
                                        result)))
                             result))
        full-properties (-> (concat block-own-properties'
                                    (remove property-hide-f (map (fn [p] [p (get block p)]) class-properties)))
                            (remove-built-in-or-other-position-properties false))
        hidden-properties (-> (concat block-hidden-properties
                                      (filter property-hide-f (map (fn [p] [p (get block p)]) class-properties)))
                              (remove-built-in-or-other-position-properties true))
        root-block? (or (= (str (:block/uuid block))
                           (state/get-current-page))
                        (and (= (str (:block/uuid block)) (:id opts))
                             (not (entity-util/page? block))))]
    (cond
      (and (empty? full-properties) (seq hidden-properties) (not root-block?) (not sidebar-properties?))
      nil

      (and (empty? full-properties) (empty? hidden-properties))
      (when show-properties?
        (rum/with-key (new-property block opts) (str id "-add-property")))

      :else
      (let [remove-properties #{:logseq.property/icon :logseq.property/query}
            properties' (->> (remove (fn [[k _v]] (contains? remove-properties k))
                                     full-properties)
                             (remove (fn [[k _v]] (= k :logseq.property.class/properties))))
            page? (entity-util/page? block)
            class? (entity-util/class? block)]
        [:div.ls-properties-area
         {:id id
          :class (util/classnames [{:ls-page-properties page?}])
          :tab-index 0}
         [:<>
          (properties-section block properties' opts)

          (when-not class?
            (hidden-properties-cp block hidden-properties
                                  (assoc opts :root-block? root-block?)))

          (when (and page? (not class?))
            (rum/with-key (new-property block opts) (str id "-add-property")))

          (when class?
            (let [properties (->> (:logseq.property.class/properties block)
                                  (map (fn [e] [(:db/ident e)])))
                  opts' (assoc opts :class-schema? true)]
              [:div.flex.flex-col.gap-1
               [:div {:style {:font-size 15}}
                [:div.property-pair
                 [:div.property-key.text-sm
                  (property-key-cp block (db/entity :logseq.property.class/properties) {})]]
                [:div.text-muted-foreground {:style {:margin-left 26}}
                 "Tag properties are inherited by all nodes using the tag. For example, each #Task node inherits 'Status' and 'Priority'."]]
               [:div.ml-4
                (properties-section block properties opts')
                (hidden-properties-cp block hidden-properties
                                      (assoc opts :root-block? root-block?))
                (rum/with-key (new-property block opts') (str id "-class-add-property"))]]))]]))))
