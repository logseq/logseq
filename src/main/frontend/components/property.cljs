(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]
            [frontend.components.icon :as icon-component]
            [frontend.components.dnd :as dnd]
            [dommy.core :as dom]
            [frontend.components.property.closed-value :as closed-value]
            [frontend.components.property.util :as components-pu]))

(def icon closed-value/icon)

(defn- create-class-if-not-exists!
  [value]
  (when (string? value)
    (let [page-name (string/trim value)]
      (when-not (string/blank? page-name)
        (page-handler/create! page-name {:redirect? false
                                         :create-first-block? false
                                         :class? true})
        (pu/get-page-uuid page-name)))))

(rum/defc class-select
  [*property-schema schema-classes {:keys [multiple-choices? save-property-fn]
                                    :or {multiple-choices? true}}]
  [:div.flex.flex-1.col-span-3
   (ui/dropdown
    (fn [{:keys [toggle-fn]}]
      [:div.flex.flex-1.cursor-pointer {:on-click toggle-fn}
       (if (seq schema-classes)
         [:div.flex.flex-1.flex-row.items-center.flex-wrap.gap-2
          (for [class schema-classes]
            (if (= class :logseq.class)
              [:a.text-sm "#Logseq Class"]
              (when-let [page (db/entity [:block/uuid class])]
                (let [page-name (:block/original-name page)]
                  [:a.text-sm (str "#" page-name)]))))]
         [:div.opacity-50.pointer.text-sm "Empty"])])
    (fn [{:keys [toggle-fn]}]
      (let [classes (model/get-all-classes (state/get-current-repo))
            options (cond->> (map (fn [[name id]]
                                    {:label name :value id})
                                  classes)
                      (not= :template (:type @*property-schema))
                      (concat [{:label "Logseq Class" :value :logseq.class}]))
            opts (cond->
                  {:items options
                   :input-default-placeholder (if multiple-choices? "Choose classes" "Choose class")
                   :dropdown? false
                   :close-modal? false
                   :multiple-choices? multiple-choices?
                   :selected-choices schema-classes
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
                                    nil))}}
                   multiple-choices?
                   (assoc :on-apply (fn [choices]
                                      (let [choices' (map (fn [value] (or (create-class-if-not-exists! value) value)) choices)]
                                        (swap! *property-schema assoc :classes (set choices'))
                                        (save-property-fn)
                                        (toggle-fn))))

                   (not multiple-choices?)
                   (assoc :on-chosen (fn [value]
                                       (let [value' (or (create-class-if-not-exists! value) value)]
                                         (swap! *property-schema assoc :classes #{value'})
                                         (save-property-fn)
                                         (toggle-fn)))))]

        (select/select opts)))
    {:modal-class (util/hiccup->class
                   "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})])

(defn- property-type-label
  [property-type]
  (if (= property-type :default)
    "Text"
    ((comp string/capitalize name) property-type)))

(rum/defcs ^:large-vars/cleanup-todo property-config
  "All changes to a property must update the db and the *property-schema. Failure to do
   so can result in data loss"
  <
  shortcut/disable-all-shortcuts
  rum/reactive
  db-mixins/query
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[_block property _opts] (:rum/args state)]
                   (reset! (::property-name state) (:block/original-name property))
                   (reset! (::property-schema state) (:block/schema property))
                   (state/set-state! :editor/property-configure? true)
                   state))
   :will-unmount (fn [state]
                   (util/schedule #(state/set-state! :editor/property-configure? false))
                   (when-let [*show-property-config? (:*show-new-property-config? (last (:rum/args state)))]
                     (reset! *show-property-config? false))
                   state)}
  [state block property {:keys [toggle-fn inline-text class-schema? add-new-property? _*show-new-property-config?] :as opts}]
  (let [*property-name (::property-name state)
        *property-schema (::property-schema state)
        built-in-property? (contains? db-property/built-in-properties-keys-str (:block/original-name property))
        property (db/sub-block (:db/id property))
        disabled? (or built-in-property? config/publishing?)
        hide-delete? (or (= (:db/id block) (:db/id property)) ; property page
                         add-new-property?)
        class? (contains? (:block/type block) "class")
        property-type (get-in property [:block/schema :type])
        save-property-fn (fn [] (components-pu/update-property! property @*property-name @*property-schema))
        enable-closed-values? (contains? db-property-type/closed-value-property-types (or property-type :default))]
    [:div.property-configure.flex.flex-1.flex-col
     {:on-mouse-down #(state/set-state! :editor/mouse-down-from-property-configure? true)
      :on-mouse-up #(state/set-state! :editor/mouse-down-from-property-configure? nil)}
     [:div.grid.gap-2.p-1
      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.col-span-1 "Name:"]
       [:input.form-input.col-span-2
        {:on-change #(reset! *property-name (util/evalue %))
         :on-blur save-property-fn
         :on-key-press (fn [e]
                         (when (= "Enter" (util/ekey e))
                           (save-property-fn)))
         :disabled disabled?
         :default-value @*property-name}]]

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.col-span-1 "Icon:"]
       (let [icon-value (pu/get-property property :icon)]
         [:div.col-span-3
          (closed-value/icon icon-value
                             {:disabled? disabled?
                              :on-chosen (fn [_e icon]
                                           (let [icon-property-id (db-pu/get-built-in-property-uuid :icon)]
                                             (db-property-handler/update-property!
                                              (state/get-current-repo)
                                              (:block/uuid property)
                                              {:properties {icon-property-id icon}})))})])]

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.col-span-1 "Schema type:"]
       (let [schema-types (->> (concat db-property-type/user-built-in-property-types
                                       (when built-in-property?
                                         db-property-type/internal-built-in-property-types))
                               (map (fn [type]
                                      {:label (property-type-label type)
                                       :disabled disabled?
                                       :value type
                                       :selected (= type (:type @*property-schema))})))]
         (if (and property-type
                  (seq (model/get-block-property-values (:block/uuid property))))
           [:div.flex.items-center.col-span-2
            (property-type-label property-type)
            (ui/tippy {:html        "The type of this property is locked once you start using it. This is to make sure all your existing information stays correct if the property type is changed later. To unlock, all uses of a property must be deleted."
                       :class       "tippy-hover ml-2"
                       :interactive true
                       :disabled    false}
                      (svg/help-circle))]
           [:div.flex.items-center.col-span-2
            (ui/select schema-types
                       (fn [_e v]
                         (let [type (keyword (string/lower-case v))
                               update-schema-fn (apply comp
                                                       #(assoc % :type type)
                                                       ;; always delete previous closed values as they
                                                       ;; are not valid for the new type
                                                       #(dissoc % :values)
                                                       (keep
                                                        (fn [attr]
                                                          (when-not (db-property-type/property-type-allows-schema-attribute? type attr)
                                                            #(dissoc % attr)))
                                                        [:cardinality :classes :position]))]
                           (swap! *property-schema update-schema-fn)
                           (components-pu/update-property! property @*property-name @*property-schema))))
            (ui/tippy {:html        "Changing the property type clears some property configurations."
                       :class       "tippy-hover ml-2"
                       :interactive true
                       :disabled    false}
                      (svg/info))]))]

      (when (db-property-type/property-type-allows-schema-attribute? (:type @*property-schema) :cardinality)
        [:div.grid.grid-cols-4.gap-1.items-center.leading-8
         [:label "Multiple values:"]
         (let [many? (boolean (= :many (:cardinality @*property-schema)))]
           (ui/checkbox {:checked many?
                         :disabled disabled?
                         :on-change (fn []
                                      (swap! *property-schema assoc :cardinality (if many? :one :many))
                                      (save-property-fn))}))])


      (when (db-property-type/property-type-allows-schema-attribute? (:type @*property-schema) :classes)
       (case (:type @*property-schema)
         :page
         (when (empty? (:values @*property-schema))
           [:div.grid.grid-cols-4.gap-1.items-center.leading-8
            [:label "Specify classes:"]
            (class-select *property-schema
                          (:classes @*property-schema)
                          (assoc opts
                                 :disabled? disabled?
                                 :save-property-fn save-property-fn))])

         :template
         [:div.grid.grid-cols-4.gap-1.items-center.leading-8
          [:label "Specify template:"]
          (class-select *property-schema (:classes @*property-schema)
                        (assoc opts
                               :multiple-choices? false
                               :disabled? disabled?
                               :save-property-fn save-property-fn))]

         nil))

      (when (and enable-closed-values? (empty? (:classes @*property-schema)))
        [:div.grid.grid-cols-4.gap-1.items-start.leading-8
         [:label.col-span-1 "Available choices:"]
         [:div.col-span-3
          (closed-value/choices property *property-name *property-schema)]])

      (when (and enable-closed-values? (seq (:values @*property-schema)))
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
           [:div.col-span-3
            (ui/select choices
                       (fn [_e v]
                         (swap! *property-schema assoc :position v)
                         (save-property-fn)))]]))

      (let [hide? (:hide? @*property-schema)]
        [:div.grid.grid-cols-4.gap-1.items-center.leading-8
         [:label "Hide by default:"]
         (ui/checkbox {:checked hide?
                       :disabled disabled?
                       :on-change (fn []
                                    (swap! *property-schema assoc :hide? (not hide?))
                                    (save-property-fn))})])

      [:div.grid.grid-cols-4.gap-1.items-start.leading-8
       [:label "Description:"]
       [:div.col-span-3
        (if (and disabled? inline-text)
          (inline-text {} :markdown (:description @*property-schema))
          [:div.mt-1
           (ui/ls-textarea
            {:on-change (fn [e]
                          (swap! *property-schema assoc :description (util/evalue e)))
             :on-blur save-property-fn
             :disabled disabled?
             :default-value (:description @*property-schema)})])]]

      (when-not hide-delete?
        [:hr])

      (when-not hide-delete?
        [:a.fade-link {:on-click (fn [e]
                                   (util/stop e)
                                   (when (or (not (and class? class-schema?))
                                             ;; Only ask for confirmation on class schema properties
                                             (js/confirm "Are you sure you want to delete this property?"))
                                     (let [repo (state/get-current-repo)
                                           f (if (and class? class-schema?)
                                               db-property-handler/class-remove-property!
                                               property-handler/remove-block-property!)]
                                       (f repo (:block/uuid block) (:block/uuid property))
                                       (when toggle-fn (toggle-fn)))))}
         "Delete property from this block"])]]))

(defn- get-property-from-db [name]
  (when-not (string/blank? name)
    (db/entity [:block/name (util/page-name-sanity-lc name)])))

(defn- add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context.
   For pages, used to add both schema properties or properties for a page"
  [entity property-name {:keys [class-schema? page-configure?
                                *show-new-property-config?]}]
  (let [repo (state/get-current-repo)]
    ;; existing property selected or entered
    (if-let [_property (get-property-from-db property-name)]
      (if (contains? db-property/hidden-built-in-properties (keyword property-name))
        (do (notification/show! "This is a built-in property that can't be used." :error)
            (pv/exit-edit-property))
        ;; Both conditions necessary so that a class can add its own page properties
        (when (and (contains? (:block/type entity) "class") class-schema?)
          (pv/add-property! entity property-name "" {:class-schema? class-schema?
                                                     ;; Only enter property names from sub-modal as inputting
                                                     ;; property values is buggy in sub-modal
                                                     :exit-edit? page-configure?})))
      ;; new property entered
      (if (db-property/valid-property-name? property-name)
        (if (and (contains? (:block/type entity) "class") page-configure?)
          (pv/add-property! entity property-name "" {:class-schema? class-schema? :exit-edit? page-configure?})
          (do
            (db-property-handler/upsert-property! repo property-name {} {})
            (when *show-new-property-config?
              (reset! *show-new-property-config? true))))
        (do (notification/show! "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['." :error)
            (pv/exit-edit-property))))))

(rum/defcs property-input < rum/reactive
  (rum/local false ::show-new-property-config?)
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value {:keys [class-schema? _page-configure? in-block-container?]
                                               :as opts}]
  (let [*show-new-property-config? (::show-new-property-config? state)
        entity-properties (->> (keys (:block/properties entity))
                               (map #(:block/original-name (db/entity [:block/uuid %])))
                               (remove nil?)
                               (set))
        existing-tag-alias (reduce (fn [acc prop]
                                     (if (seq (get entity (get-in db-property/built-in-properties [prop :attribute])))
                                       (if-let [name (get-in db-property/built-in-properties [prop :original-name])]
                                         (conj acc name)
                                         acc)
                                       acc))
                                   #{}
                                   [:tags :alias])
        exclude-properties* (set/union entity-properties existing-tag-alias)
        exclude-properties (set/union exclude-properties* (set (map string/lower-case exclude-properties*)))
        properties (->> (search/get-all-properties)
                        (remove exclude-properties))]
    [:div.ls-property-input.flex.flex-1.flex-row.items-center.flex-wrap.gap-1
     (if in-block-container? {:style {:padding-left 22}} {})
     (if @*property-key
       (when-let [property (get-property-from-db @*property-key)]
         [:div.ls-property-add.grid.grid-cols-5.gap-1.flex.flex-1.flex-row.items-center
          [:div.flex.flex-row.items-center.col-span-2
           [:span.bullet-container.cursor [:span.bullet]]
           [:div {:style {:padding-left 6}} @*property-key]]
          [:div.col-span-3.flex.flex-row {:on-mouse-down (fn [e] (util/stop-propagation e))}
           (when-not class-schema?
             (if @*show-new-property-config?
               (ui/dropdown
                (fn [_opts]
                  (pv/property-value entity property @*property-value
                                     (assoc opts
                                            :editing? true
                                            :*show-new-property-config? *show-new-property-config?)))
                (fn [{:keys [toggle-fn]}]
                  [:div.p-6
                   (property-config entity property (merge opts {:toggle-fn toggle-fn
                                                                 :block entity
                                                                 :add-new-property? true
                                                                 :*show-new-property-config? *show-new-property-config?}))])
                {:initial-open? true
                 :modal-class (util/hiccup->class
                               "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})
               (pv/property-value entity property @*property-value (assoc opts :editing? true))))]])

       [:div.ls-property-add.flex.flex-row.items-center
        [:span.bullet-container.cursor [:span.bullet]]
        [:div.ls-property-key {:style {:padding-left 6
                                       :height "1.5em"}} ; TODO: ugly
         (select/select {:items (map (fn [x] {:value x}) properties)
                         :dropdown? true
                         :close-modal? false
                         :show-new-when-not-exact-match? true
                         :exact-match-exclude-items exclude-properties
                         :input-default-placeholder "Add property"
                         :on-chosen (fn [{:keys [value]}]
                                      (reset! *property-key value)
                                      (add-property-from-dropdown entity value (assoc opts :*show-new-property-config? *show-new-property-config?)))
                         :input-opts {:on-blur (fn [] (pv/exit-edit-property))
                                      :on-key-down
                                      (fn [e]
                                        (case (util/ekey e)
                                          "Escape"
                                          (pv/exit-edit-property)
                                          nil))}})]])]))

(defonce *last-new-property-input-id (atom nil))
(rum/defcs new-property < rum/reactive
  (rum/local nil ::property-key)
  (rum/local nil ::property-value)
  (rum/local false ::enter-key-down-triggered?)
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (when-not (:editor/property-configure? @state/state)
                   (property-handler/set-editing-new-property! nil)))
      :node (js/document.getElementById "edit-new-property"))
     (mixins/on-key-down state
                         ;; enter
                         {13 (fn [_e]
                               (reset! *last-new-property-input-id (:ui/new-property-input-id @state/state))
                               (reset! (::enter-key-down-triggered? state) true))})
     (mixins/on-enter state
                      {:on-enter (fn [e]
                                   (when-not (or (state/editing?)
                                                 (state/selection?))
                                     (when (and
                                            @(::enter-key-down-triggered? state)
                                            (or (= "main-content-container" (.-id (.-target e)))
                                                (= (.-tagName (.-target e)) "BODY")))
                                       (let [nodes (dom/by-class "add-property")
                                             last-input-id @*last-new-property-input-id
                                             node (if last-input-id
                                                    (some (fn [node]
                                                            (when (dom/has-class? node last-input-id) node)) nodes)
                                                    (first nodes))]
                                         (when node (.click node)))
                                       (reset! (::enter-key-down-triggered? state) false))))
                       :node js/window})))
  [state block edit-input-id new-property? opts]
  [:div.ls-new-property
   (let [*property-key (::property-key state)
         *property-value (::property-value state)]
     (cond
       new-property?
       [:div#edit-new-property
        (property-input block *property-key *property-value opts)]

       (and (or (db-property-handler/block-has-viewable-properties? block)
                (:page-configure? opts))
            (not config/publishing?)
            (not (:in-block-container? opts)))
       [:a.fade-link.flex.add-property
        {:class edit-input-id
         :on-click (fn []
                     (property-handler/set-editing-new-property! edit-input-id)
                     (reset! *property-key nil)
                     (reset! *property-value nil))}
        [:div.flex.flex-row.items-center {:style {:padding-left 1}}
         (ui/icon "plus" {:size 15})
         [:div.ml-1.text-sm {:style {:padding-left 2}} "Add property"]]]

       :else
       [:div {:style {:height 28}}]))])

(defn- property-collapsed?
  [block property]
  (boolean?
   (some (fn [p] (= (:db/id property) (:db/id p)))
         (:block/collapsed-properties block))))

(rum/defcs property-key <
  (rum/local false ::hover?)
  [state block property {:keys [class-schema? block? collapsed? inline-text]}]
  (let [*hover? (::hover? state)
        repo (state/get-current-repo)
        icon (pu/get-property property :icon)]
    [:div.flex.flex-row.items-center {:on-mouse-over #(reset! *hover? true)
                                      :on-mouse-leave #(reset! *hover? false)}
     (when block?
       [:a.block-control
        {:on-click (fn [event]
                     (util/stop event)
                     (db-property-handler/collapse-expand-property! repo block property (not collapsed?)))}
        [:span {:class (cond
                         (or collapsed? @*hover?)
                         "control-show cursor-pointer"
                         :else
                         "control-hide")}
         (ui/rotating-arrow collapsed?)]])
     (ui/dropdown
      (fn [{:keys [toggle-fn]}]
        [:button.flex {:on-click toggle-fn}
         (if icon
           (icon-component/icon icon)
           [:span.bullet-container.cursor (when collapsed? {:class "bullet-closed"})
            [:span.bullet]])])
      (fn [{:keys [toggle-fn]}]
        [:div.p-4
         (icon-component/icon-search
          {:on-chosen
           (fn [_e icon]
             (let [icon-property-id (db-pu/get-built-in-property-uuid :icon)]
               (when icon
                 (db-property-handler/update-property! repo
                                                       (:block/uuid property)
                                                       {:properties {icon-property-id icon}})
                 (toggle-fn))))})])
      {:modal-class (util/hiccup->class
                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})
     (ui/dropdown
      (if config/publishing?
        (fn [_opts]
          [:a.property-k
           {:on-click #(route-handler/redirect-to-page! (:block/name property))}
           [:div {:style {:padding-left 6}} (:block/original-name property)]])
        (fn [{:keys [toggle-fn]}]
          [:a.property-k
           {:title (str "Configure property: " (:block/original-name property))
            :on-mouse-down (fn [e]
                             (when (util/meta-key? e)
                               (route-handler/redirect-to-page! (:block/name property))
                               (.preventDefault e)))
            :on-click toggle-fn}
           [:div {:style {:padding-left 6}} (:block/original-name property)]]))
      (fn [{:keys [toggle-fn]}]
        [:div.p-8 {:style {:min-width 700}}
         [:h2.title "Configure property"]
         (property-config block property
                          {:toggle-fn toggle-fn
                           :inline-text inline-text
                           :class-schema? class-schema?})])
      {:modal-class (util/hiccup->class
                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg")})]))

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
  [block k v {:keys [inline-text] :as opts}]
  (when (uuid? k)
    (when-let [property (db/sub-block (:db/id (db/entity [:block/uuid k])))]
      (let [type (get-in property [:block/schema :type] :default)
            closed-values? (seq (get-in property [:block/schema :values]))
            v-block (when (uuid? v) (db/entity [:block/uuid v]))
            block? (and v-block
                        (not closed-values?)
                        (:block/page v-block)
                        (contains? #{:default :template} type))
            collapsed? (when block? (property-collapsed? block property))
            date? (= type :date)]
        [:div {:class (cond
                        (and block? (not closed-values?))
                        "flex flex-1 flex-col gap-1 property-block"
                        date?
                        "property-pair items-center"
                        :else
                        "property-pair items-start")}
         [:div.property-key
          {:class "col-span-2"}
          (property-key block property (assoc (select-keys opts [:class-schema?])
                                              :block? block?
                                              :collapsed? collapsed?
                                              :inline-text inline-text))]
         (if (and (:class-schema? opts) (:page-configure? opts))
           [:div.property-description.text-sm.opacity-70
            {:class "col-span-3"}
            (inline-text {} :markdown (get-in property [:block/schema :description]))]
           (when-not collapsed?
             [:div.property-value {:class (if block?
                                            "block-property-value"
                                            "col-span-3 inline-grid")}
              (pv/property-value block property v opts)]))]))))

(rum/defc properties-section < rum/reactive db-mixins/query
  [block properties opts]
  (let [class? (:class-schema? opts)]
    (when (seq properties)
      (if class?
        (let [choices (map (fn [[k v]]
                             {:id (str k)
                              :value k
                              :content (property-cp block k v opts)}) properties)]
          (dnd/items choices
                     {:on-drag-end (fn [properties]
                                     (let [schema (assoc (:block/schema block)
                                                         :properties properties)]
                                       (when (seq properties)
                                         (db-property-handler/class-set-schema! (state/get-current-repo) (:block/uuid block) schema))))}))
        (for [[k v] properties]
          (property-cp block k v opts))))))

(rum/defcs hidden-properties < (rum/local true ::hide?)
  [state block hidden-properties opts]
  (let [*hide? (::hide? state)]
    [:div.hidden-properties.flex.flex-col.gap-1
     [:a.text-sm.flex.flex-row.items-center.fade-link.select-none
      {:on-click #(swap! *hide? not)}
      [:span {:style {:margin-left -1}}
       (ui/rotating-arrow @*hide?)]
      [:div {:style {:margin-left 3}} "Hidden properties"]]
     (when-not @*hide?
       (properties-section block hidden-properties opts))]))

(rum/defcs ^:large-vars/cleanup-todo properties-area < rum/reactive
  [state target-block edit-input-id {:keys [in-block-container? page-configure? class-schema?] :as opts}]
  (let [block (resolve-linked-block-if-exists target-block)
        block-properties (:block/properties block)
        properties (if (and class-schema? page-configure?)
                     (let [properties (:properties (:block/schema block))]
                       (map (fn [k] [k nil]) properties))
                     (sort-by first block-properties))
        alias (set (map :block/uuid (:block/alias block)))
        alias-properties (when (seq alias)
                           [[(db-pu/get-built-in-property-uuid :alias) alias]])
        remove-built-in-properties (fn [properties]
                                     (remove (fn [x]
                                               (let [id (if (uuid? x) x (first x))]
                                                 (when (uuid? id)
                                                   (contains? db-property/hidden-built-in-properties (keyword (:block/name (db/entity [:block/uuid id])))))))
                                             properties))
        {:keys [classes all-classes classes-properties]} (db-property-handler/get-block-classes-properties (:db/id block))
        one-class? (= 1 (count classes))
        block-own-properties (->> (concat (seq alias-properties)
                                          (seq properties))
                                  remove-built-in-properties
                                  (remove (fn [[id _]] ((set classes-properties) id))))
        ;; This section produces own-properties and full-hidden-properties
        hide-with-property-id (fn [property-id]
                                (let [eid (if (uuid? property-id) [:block/uuid property-id] property-id)]
                                  (boolean (:hide? (:block/schema (db/entity eid))))))
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
                            (if (contains? (:block/schema (db/entity [:block/uuid property-id])) :hide?)
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        {class-hidden-properties true
         class-own-properties false} (group-by property-hide-f
                                               (map (fn [id] [id (get block-properties id)]) classes-properties))
        own-properties (->>
                        (if one-class?
                          (concat block-own-properties' class-own-properties)
                          block-own-properties'))
        full-hidden-properties (concat block-hidden-properties class-hidden-properties)
        new-property? (= edit-input-id (state/sub :ui/new-property-input-id))
        class->properties (loop [classes all-classes
                                 properties #{}
                                 result []]
                            (if-let [class (first classes)]
                              (let [cur-properties (->> (:properties (:block/schema class))
                                                        (remove properties)
                                                        (remove hide-with-property-id))]
                                (recur (rest classes)
                                       (set/union properties (set cur-properties))
                                       (conj result [class cur-properties])))
                              result))]
    (when-not (and (empty? block-own-properties)
                   (empty? class->properties)
                   (not new-property?)
                   (not (:page-configure? opts)))
      [:div.ls-properties-area (cond-> {:class [(if class-schema? "class-properties" "page-properties")]}
                                 (:selected? opts)
                                 (update :class conj "select-none"))
       (properties-section block (if class-schema? properties own-properties) opts)

       (when (and (seq full-hidden-properties) (not class-schema?) (not config/publishing?))
         (hidden-properties block full-hidden-properties opts))

       (when (or new-property? (not in-block-container?))
         (new-property block edit-input-id new-property? opts))

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
                     [:span.text-sm (page-cp {} class)])
                   (properties-section block id-properties opts)])))]))])))
