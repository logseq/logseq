(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [logseq.outliner.property :as outliner-property]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]
            [frontend.components.icon :as icon-component]
            [frontend.components.dnd :as dnd]
            [frontend.components.property.closed-value :as closed-value]
            [frontend.components.property.util :as components-pu]
            [promesa.core :as p]
            [logseq.db :as ldb]
            [logseq.db.frontend.order :as db-order]
            [logseq.outliner.core :as outliner-core]
            [dommy.core :as d]))

(defn- <create-class-if-not-exists!
  [value]
  (when (string? value)
    (let [page-name (string/trim value)]
      (when-not (string/blank? page-name)
        (p/let [page (page-handler/<create! page-name {:redirect? false
                                                       :create-first-block? false
                                                       :class? true})]
          (:block/uuid page))))))

(rum/defc class-select
  [property {:keys [multiple-choices? disabled?]
             :or {multiple-choices? true}}]
  (let [schema-classes (:property/schema.classes property)]
    [:div.flex.flex-1.col-span-3
     (let [content-fn
           (fn [{:keys [id]}]
             (let [toggle-fn #(shui/popup-hide! id)
                   classes (model/get-all-classes (state/get-current-repo))
                   options (cond->> (map (fn [[name id]]
                                           {:label name :value id})
                                         classes)
                             (= :template (get-in property [:block/schema :type]))
                             (remove (fn [[name _id]] (= name "Root class"))))
                   opts {:items options
                         :input-default-placeholder (if multiple-choices? "Choose classes" "Choose class")
                         :dropdown? false
                         :close-modal? false
                         :multiple-choices? multiple-choices?
                         :selected-choices (map :block/uuid schema-classes)
                         :extract-fn :label
                         :extract-chosen-fn :value
                         :show-new-when-not-exact-match? true
                         :input-opts {:on-blur toggle-fn
                                      :on-key-down
                                      (fn [e]
                                        (case (util/ekey e)
                                          "Escape"
                                          (do
                                            (util/stop e)
                                            (toggle-fn))
                                          nil))}
                         :on-chosen (fn [value select?]
                                      (p/let [result (<create-class-if-not-exists! value)
                                              value' (or result value)
                                              tx-data [[(if select? :db/add :db/retract) (:db/id property) :property/schema.classes [:block/uuid value']]]]
                                        (db/transact! (state/get-current-repo) tx-data {:outliner-op :update-property})
                                        (when-not multiple-choices? (toggle-fn))))}]

               (select/select opts)))]

       [:div.flex.flex-1.cursor-pointer
        {:on-click (if disabled?
                     (constantly nil)
                     #(shui/popup-show! (.-target %) content-fn))}
        (if (seq schema-classes)
          [:div.flex.flex-1.flex-row.items-center.flex-wrap.gap-2
           (for [class schema-classes]
             [:a.text-sm (str "#" (:block/original-name class))])]
          (pv/property-empty-value))])]))

(defn- property-type-label
  [property-type]
  (case property-type
    :default
    "Text"
    :string
    "Text"
    ((comp string/capitalize name) property-type)))

(defn- handle-delete-property!
  [block property & {:keys [class? class-schema?]}]
  (let [class? (or class? (some-> block :block/type (contains? "class")))]
    (when (or (not (and class? class-schema?))
            ;; Only ask for confirmation on class schema properties
              (js/confirm "Are you sure you want to delete this property?"))
      (let [repo (state/get-current-repo)
            [f id] (if (and class? class-schema?)
                     [db-property-handler/class-remove-property! (:db/id block)]
                     [property-handler/remove-block-property! (:block/uuid block)])
            property-id (:db/ident property)]
        (f repo id property-id)))))

(rum/defc schema-type <
  shortcut/disable-all-shortcuts
  [property {:keys [*property-name *property-schema built-in? disabled?
                    show-type-change-hints? in-block-container? block *show-new-property-config?
                    default-open?]}]
  (let [property-name (or (and *property-name @*property-name) (:block/original-name property))
        property-schema (or (and *property-schema @*property-schema) (:block/schema property))
        schema-types (->> (concat db-property-type/user-built-in-property-types
                                  (when built-in?
                                    db-property-type/internal-built-in-property-types))
                          (map (fn [type]
                                 {:label (property-type-label type)
                                  :value type})))]
    [:div {:class (if in-block-container? "flex flex-1" "flex items-center col-span-2")}
     (shui/select
      (cond->
       {:default-open (boolean default-open?)
        :disabled disabled?
        :on-value-change
        (fn [v]
          (let [type (keyword (string/lower-case v))
                update-schema-fn (apply comp
                                        #(assoc % :type type)
                                        (keep
                                         (fn [attr]
                                           (when-not (db-property-type/property-type-allows-schema-attribute? type attr)
                                             #(dissoc % attr)))
                                         [:cardinality :position]))]
            (when *property-schema
              (swap! *property-schema update-schema-fn))
            (let [schema (or (and *property-schema @*property-schema)
                             (update-schema-fn property-schema))
                  repo (state/get-current-repo)]
              (p/do!
               (when block
                 (pv/exit-edit-property))
               (when *show-new-property-config?
                 (reset! *show-new-property-config? false))
               (components-pu/update-property! property property-name schema)
               (when block
                 (let [id (str "ls-property-" (:db/id block) "-" (:db/id property) "-editor")]
                   (state/set-state! :editor/editing-property-value-id {id true}))
                 (if (= type :default)
                   (pv/<create-new-block! block property "")
                   (property-handler/set-block-property! repo (:block/uuid block)
                                                         (:db/ident (db/get-case-page property-name))
                                                         :logseq.property/empty-placeholder)))))))}

        ;; only set when in property configure modal
        (and *property-name (:type property-schema))
        (assoc :default-value (name (:type property-schema))))
      (shui/select-trigger
       {:class "!px-2 !py-0 !h-8"}
       (shui/select-value
        {:placeholder "Select a schema type"}))
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

(rum/defcs ^:large-vars/cleanup-todo property-config
  "All changes to a property must update the db and the *property-schema. Failure to do
   so can result in data loss"
  <
  shortcut/disable-all-shortcuts
  rum/reactive
  db-mixins/query
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:init (fn [state]
           (let [*values (atom :loading)]
             (p/let [result (db-async/<get-block-property-values (state/get-current-repo)
                                                                 (:db/ident (first (:rum/args state))))]
               (reset! *values result))
             (assoc state ::values *values)))
   :will-mount (fn [state]
                 (let [[property _opts] (:rum/args state)]
                   (reset! (::property-name state) (:block/original-name property))
                   (reset! (::property-schema state) (:block/schema property))
                   (state/set-state! :editor/property-configure? true)
                   state))
   :will-unmount (fn [state]
                   (util/schedule #(state/set-state! :editor/property-configure? false))
                   (when-let [*show-property-config? (:*show-new-property-config? (last (:rum/args state)))]
                     (reset! *show-property-config? false))
                   state)}
  [state property {:keys [inline-text add-new-property?] :as opts}]
  (let [values (rum/react (::values state))]
    (when-not (= :loading values)
      (let [*property-name (::property-name state)
            *property-schema (::property-schema state)
            property (db/sub-block (:db/id property))
            built-in? (ldb/built-in? property)
            disabled? (or built-in? config/publishing?)
            property-type (get-in property [:block/schema :type])
            save-property-fn (fn [] (components-pu/update-property! property @*property-name @*property-schema))
            enable-closed-values? (contains? db-property-type/closed-value-property-types (or property-type :default))]
        [:div.property-configure.flex.flex-1.flex-col
         [:div.grid.gap-2.p-1
          [:div.grid.grid-cols-4.gap-1.items-center.leading-8
           [:label.col-span-1 "Name:"]
           (shui/input
            {:class         "col-span-2 !px-2 !py-0 !h-8"
             :auto-focus    (not add-new-property?)
             :on-change     #(reset! *property-name (util/evalue %))
             :on-blur       save-property-fn
             :on-key-press  (fn [e]
                              (when (= "Enter" (util/ekey e))
                                (save-property-fn)))
             :disabled      disabled?
             :default-value @*property-name})]

          [:div.grid.grid-cols-4.gap-1.items-center.leading-8
           [:label.col-span-1 "Icon:"]
           (let [icon-value (:logseq.property/icon property)]
             [:div.col-span-3.flex.flex-row.items-center.gap-2
              (icon-component/icon-picker icon-value
                                          {:on-chosen (fn [_e icon]
                                                        (db-property-handler/upsert-property!
                                                         (:db/ident property)
                                                         (:block/schema property)
                                                         {:properties {:logseq.property/icon icon}}))})

              (when icon-value
                [:a.fade-link.flex {:on-click (fn [_e]
                                                (db-property-handler/remove-block-property!
                                                 (:db/ident property)
                                                 :logseq.property/icon))
                                    :title "Delete this icon"}
                 (ui/icon "X")])])]

          [:div.grid.grid-cols-4.gap-1.items-center.leading-8
           [:label.col-span-1 "Schema type:"]
           (if (or (ldb/built-in? property)
                   (and property-type (seq values)))
             [:div.flex.items-center.col-span-2
              (property-type-label property-type)
              (ui/tippy {:html        "The type of this property is locked once you start using it. This is to make sure all your existing information stays correct if the property type is changed later. To unlock, all uses of a property must be deleted."
                         :class       "tippy-hover ml-2"
                         :interactive true
                         :disabled    false}
                        (svg/help-circle))]
             (schema-type property {:*property-name *property-name
                                    :*property-schema *property-schema
                                    :built-in? built-in?
                                    :disabled? disabled?
                                    :show-type-change-hints? true}))]

          (when (db-property-type/property-type-allows-schema-attribute? (:type @*property-schema) :cardinality)
            [:div.grid.grid-cols-4.gap-1.items-center.leading-8
             [:label "Multiple values:"]
             (let [many? (db-property/many? property)]
               (shui/checkbox
                {:checked           many?
                 :disabled          disabled?
                 :on-checked-change (fn []
                                      (swap! *property-schema assoc :cardinality (if many? :one :many))
                                      (save-property-fn))}))])

          (when (db-property-type/property-type-allows-schema-attribute? (:type @*property-schema) :classes)
            (case (:type @*property-schema)
              :page
              (when (empty? (:property/closed-values property))
                [:div.grid.grid-cols-4.gap-1.items-center.leading-8
                 [:label "Specify classes:"]
                 (class-select property (assoc opts :disabled? disabled?))])

              :template
              [:div.grid.grid-cols-4.gap-1.items-center.leading-8
               [:label "Specify template:"]
               (class-select property (assoc opts
                                             :multiple-choices? false
                                             :disabled? disabled?))]

              nil))

          (when (and enable-closed-values? (empty? (:property/schema.classes property)))
            [:div.grid.grid-cols-4.gap-1.items-start.leading-8
             [:label.col-span-1 "Available choices:"]
             [:div.col-span-3
              (closed-value/choices property opts)]])

          (when (and enable-closed-values?
                     (db-property-type/property-type-allows-schema-attribute? (:type @*property-schema) :position)
                     (seq (:property/closed-values property)))
            (let [position (:position @*property-schema)
                  choices (map
                           (fn [item]
                             (assoc item :selected
                                    (or (and position (= (:value item) position))
                                        (and (nil? position) (= (:value item) "properties")))))
                           [{:label "Block properties"
                             :value "properties"}
                            {:label "Beginning of the block"
                             :value "block-beginning"}
                        ;; {:label "Ending of the block"
                        ;;  :value "block-ending"}
                            ])]
              [:div.grid.grid-cols-4.gap-1.items-center.leading-8
               [:label.col-span-1 "UI position:"]
               [:div.col-span-2
                (shui/select
                 (cond-> {:disabled config/publishing?
                          :on-value-change (fn [v]
                                             (swap! *property-schema assoc :position v)
                                             (save-property-fn))}
                   (string? position)
                   (assoc :default-value position))
                 (shui/select-trigger
                  {:class "!px-2 !py-0 !h-8"}
                  (shui/select-value
                   {:placeholder "Select a position mode"}))
                 (shui/select-content
                  (shui/select-group
                   (for [{:keys [label value]} choices]
                     (shui/select-item {:value value} label)))))]]))

          (let [hide? (:hide? @*property-schema)]
            [:div.grid.grid-cols-4.gap-1.items-center.leading-8
             [:label "Hide by default:"]
             (shui/checkbox
              {:checked           hide?
               :disabled          config/publishing?
               :on-checked-change (fn []
                                    (swap! *property-schema assoc :hide? (not hide?))
                                    (save-property-fn))})])

          (let [description (:description @*property-schema)]
            (when (or (not disabled?)
                      (and disabled? (not (string/blank? description))))
              [:div.grid.grid-cols-4.gap-1.items-start.leading-8
               [:label "Description:"]
               [:div.col-span-3
                (if (and disabled? inline-text)
                  (inline-text {} :markdown description)
                  [:div.mt-1
                   (shui/textarea
                    {:on-change (fn [e]
                                  (swap! *property-schema assoc :description (util/evalue e)))
                     :on-blur save-property-fn
                     :disabled disabled?
                     :default-value description})])]]))]]))))

(defn- add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context.
   For pages, used to add both schema properties or properties for a page"
  [entity property-uuid-or-name {:keys [class-schema? page-configure?]}]
  (p/let [repo (state/get-current-repo)
          ;; Both conditions necessary so that a class can add its own page properties
          add-class-property? (and (contains? (:block/type entity) "class") class-schema?)
          result (when (uuid? property-uuid-or-name)
                   (db-async/<get-block repo property-uuid-or-name {:children? false}))
          ;; In block context result is in :block
          property (some-> (if (:block result) (:db/id (:block result)) (:db/id result))
                           db/entity)]
    ;; existing property selected or entered
    (if property
      (cond
        (and (not (get-in property [:block/schema :public?]))
             (ldb/built-in? property))
        (do (notification/show! "This is a private built-in property that can't be used." :error)
            (pv/exit-edit-property))

        (and (not add-class-property?)
             (= :default (get-in property [:block/schema :type]))
             (not (seq (:property/closed-values property))))
        (do
          (pv/<create-new-block! entity property "")
          nil)

        :else
        (when add-class-property?
          (pv/<add-property! entity (:db/ident property) "" {:class-schema? class-schema?
                                                             ;; Only enter property names from sub-modal as inputting
                                                             ;; property values is buggy in sub-modal
                                                             :exit-edit? page-configure?})))
      ;; new property entered
      (if (db-property/valid-property-name? property-uuid-or-name)
        (if (and (contains? (:block/type entity) "class") page-configure?)
          (pv/<add-property! entity property-uuid-or-name "" {:class-schema? class-schema? :exit-edit? page-configure?})
          (p/do!
           (db-property-handler/upsert-property! nil {:type :default} {:property-name property-uuid-or-name})
           true))
        (do (notification/show! "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['." :error)
            (pv/exit-edit-property))))))

(rum/defc property-select
  [exclude-properties on-chosen input-opts]
  (let [[properties set-properties!] (rum/use-state nil)
        [excluded-properties set-excluded-properties!] (rum/use-state nil)]
    (rum/use-effect!
     (fn []
       (p/let [properties (db-async/<db-based-get-all-properties (state/get-current-repo))]
         (set-properties! (remove exclude-properties properties))
         (set-excluded-properties! (->> properties
                                        (filter exclude-properties)
                                        (map :block/original-name)
                                        set))))
     [])
    [:div.ls-property-add.flex.flex-row.items-center
     [:span.bullet-container.cursor [:span.bullet]]
     [:div.ls-property-key {:style {:padding-left 9
                                    :height "1.5em"}} ; TODO: ugly
      (select/select {:items (map (fn [x]
                                    {:label (:block/original-name x)
                                     :value (:block/uuid x)}) properties)
                      :extract-fn :label
                      :dropdown? true
                      :close-modal? false
                      :new-case-sensitive? true
                      :show-new-when-not-exact-match? true
                      :exact-match-exclude-items (fn [s] (contains? excluded-properties s))
                      :input-default-placeholder "Add property"
                      :on-chosen on-chosen
                      :input-opts input-opts})]]))

(rum/defcs property-input < rum/reactive
  (rum/local false ::show-new-property-config?)
  {:will-unmount (fn [state]
                   (when-let [*property-key (nth (:rum/args state) 1)]
                     (reset! *property-key nil))
                   state)}
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value {:keys [class-schema? in-block-container? page?]
                                               :as opts}]
  (let [*show-new-property-config? (::show-new-property-config? state)
        entity-properties (->> (keys (:block/properties entity))
                               (map #(:block/original-name (db/entity %)))
                               (remove nil?)
                               (set))
        existing-tag-alias (->> db-property/db-attribute-properties
                                (map db-property/built-in-properties)
                                (keep #(when (get entity (:attribute %)) (:original-name %)))
                                set)
        exclude-property-names (set/union entity-properties existing-tag-alias)
        exclude-properties (fn [m]
                             (or (contains? exclude-property-names (:block/original-name m))
                                 ;; Filters out properties from being in wrong :view-context
                                 (and in-block-container? (= :page (get-in m [:block/schema :view-context])))
                                 (and page? (= :block (get-in m [:block/schema :view-context])))))]
    [:div.ls-property-input.flex.flex-1.flex-row.items-center.flex-wrap.gap-1
     (if in-block-container? {:style {:padding-left 22}} {})
     (if @*property-key
       (let [property (db/get-case-page @*property-key)]
         [:div.ls-property-add.grid.grid-cols-5.gap-1.flex.flex-1.flex-row.items-center
          [:div.flex.flex-row.items-center.col-span-2
           [:span.bullet-container.cursor [:span.bullet]]
           [:div {:style {:padding-left 9}} @*property-key]]
          (when property
            [:div.col-span-3.flex.flex-row {:on-pointer-down (fn [e] (util/stop-propagation e))}
             (when-not class-schema?
               (if @*show-new-property-config?
                 (schema-type property {:default-open? true
                                        :in-block-container? in-block-container?
                                        :block entity
                                        :*show-new-property-config? *show-new-property-config?})
                 (pv/property-value entity property @*property-value (assoc opts :editing? true))))])])

       (let [on-chosen (fn [{:keys [value label]}]
                         (reset! *property-key (if (uuid? value) label value))
                         (p/let [result (add-property-from-dropdown entity value opts)]
                           (when (and (true? result) *show-new-property-config?)
                             (reset! *show-new-property-config? true))))
             input-opts {:on-blur (fn []
                                    (pv/exit-edit-property))
                         :on-key-down
                         (fn [e]
                           (case (util/ekey e)
                             "Escape"
                             (pv/exit-edit-property)
                             nil))}]
         (property-select exclude-properties on-chosen input-opts)))]))

(rum/defcs new-property < rum/reactive
  (rum/local false ::new-property?)
  (rum/local nil ::property-key)
  (rum/local nil ::property-value)
  {:will-unmount (fn [state]
                   (state/set-state! :editor/new-property-key nil)
                   state)}
  [state block id keyboard-triggered? opts]
  (let [*new-property? (::new-property? state)
        container-id (state/sub :editor/properties-container)
        new-property? (or keyboard-triggered? (and @*new-property? (= container-id id)))]

    (when-not (and (:in-block-container? opts) (not keyboard-triggered?))
      [:div.ls-new-property
       (let [global-property-key (:editor/new-property-key @state/state)
             *property-key (if @global-property-key global-property-key (::property-key state))
             *property-value (::property-value state)]
         (cond
           new-property?
           (property-input block *property-key *property-value opts)

           (and (or (outliner-property/block-has-viewable-properties? block)
                    (:page-configure? opts))
                (not config/publishing?)
                (not (:in-block-container? opts)))
           [:a.fade-link.flex.add-property
            {:on-click (fn []
                         (reset! *property-key nil)
                         (reset! *property-value nil)
                         (state/set-state! :editor/block block)
                         (state/set-state! :editor/properties-container id)
                         (reset! *new-property? true))}
            [:div.flex.flex-row.items-center {:style {:padding-left 1}}
             (ui/icon "plus" {:size 15})
             [:div.ml-2.text-sm "Add property"]]]

           :else
           [:div {:style {:height 28}}]))])))

(defn- property-collapsed?
  [block property]
  (boolean?
   (some (fn [p] (= (:db/id property) (:db/id p)))
         (:block/collapsed-properties block))))

(rum/defcs property-key <
  (rum/local false ::hover?)
  [state block property {:keys [class-schema? block? collapsed? page-cp inline-text]}]
  (let [*hover? (::hover? state)
        repo (state/get-current-repo)
        icon (:logseq.property/icon property)
        property-name (:block/original-name property)]
    [:div.flex.flex-row.items-center
     {:on-mouse-over   #(reset! *hover? true)
      :on-mouse-leave  #(reset! *hover? false)
      :on-context-menu (fn [^js e]
                         (util/stop e)
                         (shui/popup-show! e
                                           [(shui/dropdown-menu-item
                                             {:on-click (fn []
                                                          (when-let [schema (some-> property :block/schema)]
                                                            (components-pu/update-property! property property-name (assoc schema :hide? true))
                                                            (shui/popup-hide!)))}
                                             "Hide property")
                                            (when-not (ldb/built-in-class-property? block property)
                                              (shui/dropdown-menu-item
                                               {:on-click (fn []
                                                            (handle-delete-property! block property {:class-schema? class-schema?})
                                                            (shui/popup-hide!))}
                                               [:span.w-full.text-red-rx-07.hover:text-red-rx-09
                                                "Delete property"]))]
                                           {:as-dropdown? true
                                            :content-props {:class "w-48"}}))}
     (when block?
       [:a.block-control
        {:on-click (fn [event]
                     (util/stop event)
                     (db-property-handler/collapse-expand-block-property! (:db/id block) (:db/id property) (not collapsed?)))}
        [:span {:class (cond
                         (or collapsed? @*hover?)
                         "control-show cursor-pointer"
                         :else
                         "control-hide")}
         (ui/rotating-arrow collapsed?)]])

     ;; icon picker
     (let [content-fn (fn [{:keys [id]}]
                        (icon-component/icon-search
                         {:on-chosen
                          (fn [_e icon]
                            (when icon
                              (p/let [_ (db-property-handler/upsert-property! (:db/ident property)
                                                                              (:block/schema property)
                                                                              {:properties {:logseq.property/icon icon}})]
                                (shui/popup-hide! id))))}))]

       (shui/trigger-as :button
                        (-> (when-not config/publishing?
                              {:on-click #(shui/popup-show! (.-target %) content-fn {:as-dropdown? true :auto-focus? true})})
                            (assoc :class "flex items-center"))
                        (if icon
                          (icon-component/icon icon)
                          [:span.bullet-container.cursor (when collapsed? {:class "bullet-closed"})
                           [:span.bullet]])))

     (if config/publishing?
       [:a.property-k.flex.select-none.jtrigger.pl-2
        {:on-click #(route-handler/redirect-to-page! (:block/uuid property))}
        (:block/original-name property)]

       (shui/trigger-as :a
                        {:tabIndex 0
                         :title (str "Configure property: " (:block/original-name property))
                         :class "property-k flex select-none jtrigger pl-2"
                         :on-pointer-down (fn [^js e]
                                            (when (util/meta-key? e)
                                              (route-handler/redirect-to-page! (:block/uuid property))
                                              (.preventDefault e)))
                         :on-click (fn [^js e]
                                     (shui/popup-show!
                                      (.-target e)
                                      (fn [{:keys [id]}]
                                        [:div.p-2
                                         [:h2.text-lg.font-medium.mb-2.p-1 "Configure property"]
                                         [:span.close.absolute.right-2.top-2
                                          (shui/button
                                           {:variant :ghost :size :sm :class "!w-4 !h-6"
                                            :on-click #(shui/popup-hide! id)}
                                           (shui/tabler-icon "x" {:size 16}))]
                                         (property-config property
                                                          {:inline-text inline-text
                                                           :page-cp page-cp})])
                                      {:content-props {:class "property-configure-popup-content"
                                                       :collisionPadding {:bottom 10 :top 10}
                                                       :avoidCollisions true
                                                       :align "start"}
                                       :auto-side? true
                                       :auto-focus? true}))}
                        (:block/original-name property)))]))

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
  [block k v {:keys [inline-text page-cp] :as opts}]
  (when (keyword? k)
    (when-let [property (db/sub-block (:db/id (db/entity k)))]
      (let [type (get-in property [:block/schema :type] :default)
            closed-values? (seq (:property/closed-values property))
            v-block (when (integer? v) (db/entity v))
            block? (and v-block
                        (not closed-values?)
                        (:block/page v-block)
                        (contains? #{:default :template} type))
            collapsed? (when block? (property-collapsed? block property))
            date? (= type :date)
            checkbox? (= type :checkbox)]
        [:div {:class (cond
                        (and block? (not closed-values?))
                        "flex flex-1 flex-col gap-1 property-block"
                        (or date? checkbox?)
                        "property-pair items-center"
                        :else
                        "property-pair items-start")}
         [:div.property-key
          {:class "col-span-2"}
          (property-key block property (assoc (select-keys opts [:class-schema?])
                                              :block? block?
                                              :collapsed? collapsed?
                                              :inline-text inline-text
                                              :page-cp page-cp))]
         (if (and (:class-schema? opts) (:page-configure? opts))
           [:div.property-description.text-sm.opacity-70
            {:class "col-span-3"}
            (inline-text {} :markdown (get-in property [:block/schema :description]))]
           (when-not collapsed?
             [:div.property-value
              {:class (if block?
                        "block-property-value"
                        "col-span-3 inline-grid")}
              (pv/property-value block property v opts)]))]))))

(rum/defc properties-section < rum/reactive db-mixins/query
  [block properties opts]
  (when (seq properties)
      ;; Sort properties by :block/order
    (let [properties' (sort-by (fn [[k _v]]
                                 (:block/order (db/entity k))) properties)
          choices (map (fn [[k v]]
                         {:id (subs (str k) 1)
                          :value k
                          :content (property-cp block k v opts)}) properties')]
      (dnd/items choices
                 {:on-drag-end (fn [_ {:keys [active-id over-id direction]}]
                                 (let [move-down? (= direction :down)
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
                                                 {:outliner-op :save-block})))}))))

(defn- async-load-classes!
  [block]
  (let [repo (state/get-current-repo)
        classes (concat (:block/tags block) (outliner-property/get-class-parents (:block/tags block)))]
    (doseq [class classes]
      (db-async/<get-block repo (:db/id class) :children? false))
    classes))

;; TODO: Remove :page-configure? as it only ever seems to be set to true
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
  [state _target-block edit-input-id {:keys [in-block-container? page-configure? class-schema?] :as opts}]
  (let [id (::id state)
        block (db/sub-block (:db/id (::block state)))
        _ (doseq [class (::classes state)]
            (db/sub-block (:db/id class)))
        page? (db/page? block)
        block-properties (:block/properties block)
        properties (if (and class-schema? page-configure?)
                     (->> (db-property/get-class-ordered-properties block)
                          (map :db/ident)
                          (map #(vector % %)))
                     block-properties)
        remove-built-in-properties (fn [properties]
                                     (remove (fn [property]
                                               (let [id (if (vector? property) (first property) property)]
                                                 (or
                                                  (when-not page? (= id :block/tags))
                                                  (when-let [ent (db/entity id)]
                                                    (and (not (get-in ent [:block/schema :public?]))
                                                         (ldb/built-in? ent))))))
                                             properties))
        {:keys [classes all-classes classes-properties]} (outliner-property/get-block-classes-properties (db/get-db) (:db/id block))
        one-class? (= 1 (count classes))
        block-own-properties (->> (concat (when (seq (:block/alias block))
                                            [[:block/alias (:block/alias block)]])
                                          (seq properties))
                                  remove-built-in-properties
                                  (remove (fn [[id _]] ((set classes-properties) id))))
        root-block? (= (:id opts) (str (:block/uuid block)))
        ;; This section produces own-properties and full-hidden-properties
        hide-with-property-id (fn [property-id]
                                (cond
                                  (or root-block? page-configure?)
                                  false
                                  :else
                                  (boolean (:hide? (:block/schema (db/entity property-id))))))
        property-hide-f (cond
                          config/publishing?
                          ;; Publishing is read only so hide all blank properties as they
                          ;; won't be edited and distract from properties that have values
                          (fn [[property-id property-value]]
                            (or (nil? property-value)
                                (hide-with-property-id property-id)))
                          (:ui/hide-empty-properties? (state/get-config))
                          (fn [[property-id property-value]]
                            ;; User's selection takes precedence over config
                            (if (contains? (:block/schema (db/entity property-id)) :hide?)
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {_block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        {_class-hidden-properties true
         class-own-properties false} (group-by property-hide-f
                                               (map (fn [id] [id (get block-properties id)]) classes-properties))
        own-properties (->>
                        (if one-class?
                          (concat block-own-properties' class-own-properties)
                          block-own-properties'))
        class->properties (loop [classes all-classes
                                 properties #{}
                                 result []]
                            (if-let [class (first classes)]
                              (let [cur-properties (->> (db-property/get-class-ordered-properties class)
                                                        (map :db/ident)
                                                        (remove properties)
                                                        (remove hide-with-property-id))]
                                (recur (rest classes)
                                       (set/union properties (set cur-properties))
                                       (if (seq cur-properties)
                                         (conj result [class cur-properties])
                                         result)))
                              result))
        keyboard-triggered? (= (state/sub :editor/new-property-input-id) edit-input-id)]
    (when-not (and (empty? block-own-properties')
                   (empty? class->properties)
                   (not (:page-configure? opts))
                   (not keyboard-triggered?))
      [:div.ls-properties-area
       (cond-> {:id id}
         (and in-block-container? class-schema?)
         (assoc :class "class-properties")
         true (assoc :tab-index 0
                     :on-key-up #(when-let [block (and (= "Escape" (.-key %))
                                                       (.closest (.-target %) "[blockid]"))]
                                   (let [target (.-target %)]
                                     (when-not (d/has-class? target "ls-popup-closed")
                                       (state/set-selection-blocks! [block])
                                       (some-> js/document.activeElement (.blur)))
                                     (d/remove-class! target "ls-popup-closed")))))
       (let [own-properties' (cond
                               (and page? page-configure?)
                               (concat [[:block/tags (:block/tags block)]
                                        [:logseq.property/icon (:logseq.property/icon block)]]
                                       (remove (fn [[k _v]] (contains? #{:block/tags :logseq.property/icon} k)) own-properties))

                               page?
                               (remove (fn [[k _v]] (contains? #{:logseq.property/icon} k)) own-properties)

                               :else
                               own-properties)]
         (properties-section block (if class-schema? properties own-properties') opts))

       (rum/with-key (new-property block id keyboard-triggered? opts) (str id "-add-property"))

       (when (and (seq class->properties) (not one-class?))
         (let [page-cp (:page-cp opts)]
           [:div.parent-properties.flex.flex-1.flex-col.gap-1
            (for [[class class-properties] class->properties]
              (let [id-properties (->> class-properties
                                       remove-built-in-properties
                                       (map (fn [id] [id (get block-properties id)])))]
                (when (seq id-properties)
                  [:div
                   (when page-cp
                     [:span.text-sm.ml-4 (page-cp {} class)])
                   (properties-section block id-properties opts)])))]))])))
