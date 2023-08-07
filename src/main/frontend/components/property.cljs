(ns frontend.components.property
  "Block properties management."
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.property :as property-handler]
            [frontend.handler.db-based.property :as db-property]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.notification :as notification]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.config :as config]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.components.svg :as svg]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.components.select :as select]
            [logseq.graph-parser.property :as gp-property]
            [medley.core :as medley]
            [cljs-time.coerce :as tc]
            [clojure.set :as set]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.property.util :as pu]
            [frontend.modules.outliner.core :as outliner-core]))

(rum/defc icon
  [block {:keys [_type id]}]            ; only :emoji supported yet
  (let [value (or id "Pick an Icon")
        repo (state/get-current-repo)
        icon-property-id (:block/uuid (db/entity [:block/name "icon"]))]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       (if id
         [:a {:on-click toggle-fn}
          [:em-emoji {:id id}]]
         (ui/button value
                    :small? true
                    :intent "border-link"
                    :on-click toggle-fn)))
     (fn [{:keys [toggle-fn]}]
       (ui/emoji-picker
        {:auto-focus true
         :on-emoji-select (fn [icon]
                            (when-let [id (.-id icon)]
                              (property-handler/update-property! repo (:block/uuid block) {:properties {icon-property-id {:type :emoji
                                                                                                                          :id id}}}))
                            (toggle-fn))})))))


(rum/defcs property-config <
  rum/reactive
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[_repo property] (:rum/args state)]
                   (reset! (::property-name state) (:block/original-name property))
                   (reset! (::property-schema state) (:block/schema property))
                   state))}
  [state repo property]
  (let [*property-name (::property-name state)
        *property-schema (::property-schema state)
        built-in-property? (contains? gp-property/db-built-in-properties-keys-str (:block/original-name property))
        property (db/sub-block (:db/id property))]
    [:div.property-configure
     [:p.font-bold.text-xl
      (if built-in-property?
        "Built-in property"
        "Configure property")]

     [:div.grid.gap-2.p-1.mt-4
      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label "Name:"]
       [:input.form-input
        {:on-change #(reset! *property-name (util/evalue %))
         :disabled built-in-property?
         :value @*property-name}]]

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label "Icon:"]
       (let [icon-value (pu/get-property property :icon)]
         (icon property icon-value))]

      [:div.grid.grid-cols-4.gap-1.leading-8
       [:label "Schema type:"]
       (let [schema-types (->> (keys property-handler/builtin-schema-types)
                               (remove property-handler/internal-builtin-schema-types)
                               (map (comp string/capitalize name))
                               (map (fn [type]
                                      {:label type
                                       :disabled built-in-property?
                                       :value type
                                       :selected (= (keyword (string/lower-case type))
                                                    (:type @*property-schema))})))]
         (ui/select schema-types
                    (fn [_e v]
                      (let [type (keyword (string/lower-case v))]
                        (swap! *property-schema assoc :type type)))))]

      (when-not (= (:type @*property-schema) :checkbox)
        [:div.grid.grid-cols-4.gap-1.items-center.leading-8
         [:label "Multiple values:"]
         (let [many? (boolean (= :many (:cardinality @*property-schema)))]
           (ui/checkbox {:checked many?
                         :disabled built-in-property?
                         :on-change (fn []
                                      (swap! *property-schema assoc :cardinality (if many? :one :many)))}))])

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label "Description:"]
       [:div.col-span-3
        (ui/ls-textarea
         {:on-change (fn [e]
                       (swap! *property-schema assoc :description (util/evalue e)))
          :disabled built-in-property?
          :value (:description @*property-schema)})]]

      [:div
       (when-not built-in-property?
         (ui/button
          "Save"
          :on-click (fn []
                      (property-handler/update-property!
                       repo (:block/uuid property)
                       {:property-name @*property-name
                        :property-schema @*property-schema})
                      (state/close-modal!))))]

      (when config/dev?
        [:div {:style {:max-width 900}}
         [:hr]
         [:p "Debug data:"]
         [:pre (util/pp-str property)]])]]))

(defn- exit-edit-property
  []
  (property-handler/set-editing-new-property! nil)
  (state/clear-edit!))

(defn- add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (add-property! block property-key property-value {}))
  ([block property-key property-value {:keys [exit-edit? class-schema?]
                                       :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (= (:block/type block) "class")]
     (when property-key
       (if (and class? class-schema?)
         (property-handler/class-add-property! repo (:block/uuid block) property-key)
         (property-handler/set-block-property! repo (:block/uuid block) property-key property-value)))
     (when exit-edit?
       (exit-edit-property)))))

(rum/defc date-picker
  [block property value]
  (let [value' (when-not (string/blank? value)
                 (tc/to-local-date value))
        text (if value'
               (str value')
               "Pick a date")
        open-modal! (fn []
                      (state/set-modal!
                       #(ui/datepicker value' {:on-change (fn [_e date]
                                                            (let [repo (state/get-current-repo)]
                                                              (property-handler/set-block-property! repo (:block/uuid block)
                                                                                              (:block/name property)
                                                                                              date)
                                                              (exit-edit-property)
                                                              (state/close-modal!)))})))]
    [:a
     {:tabIndex "0"
      :on-click open-modal!
      :on-key-down (fn [e]
                     (when (= (util/ekey e) "Enter")
                       (open-modal!)))}
     [:span.inline-flex.items-center
      (ui/icon "calendar")
      [:span.ml-1 text]]]))

(defn- set-editing!
  [property editor-id dom-id v]
  (let [v (str v)
        cursor-range (if dom-id
                       (some-> (gdom/getElement dom-id) util/caret-range)
                       "")]
    (state/set-editing! editor-id v property cursor-range)))

(defn- select-page
  [block property opts]
  (let [repo (state/get-current-repo)
        pages (->> (model/get-all-page-original-names repo)
                   (map (fn [p] {:value p})))]
    (select/select {:items pages
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (let [page (string/trim (:value chosen))
                                       id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))]
                                   (when (nil? id)
                                     (page-handler/create! page {:redirect? false
                                                                 :create-first-block? false}))
                                   (let [id' (or id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)])))]
                                     (add-property! block (:block/original-name property) id'))
                                   (when-let [f (:on-chosen opts)] (f))))
                    :show-new-when-not-exact-match? true
                    :input-opts (fn [_]
                                  {:on-blur (or (:on-chosen opts) identity)
                                   :on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Escape"
                                       (when-let [f (:on-chosen opts)] (f))
                                       nil))})})))

(defn- select-block
  [block property opts]
  (let [blocks (->> (model/get-all-block-contents)
                    (remove (fn [b] (= (:db/id block) (:db/id b))))
                    (map (fn [b]
                           (assoc b :value (:block/content b)))))]
    (select/select {:items blocks
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (let [id (:block/uuid chosen)]
                                   (add-property! block (:block/original-name property) id)
                                   (when-let [f (:on-chosen opts)] (f))))
                    :input-opts (fn [not-matched?]
                                  {:on-blur (or (:on-chosen opts) identity)
                                   :on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Enter"
                                       (when not-matched?
                                         (let [repo (state/get-current-repo)
                                               content (string/trim (util/evalue e))]
                                           (when-not (string/blank? content)
                                             (let [pid (:block/uuid (db/entity [:block/name "created-in-property"]))
                                                   new-block (-> (editor-handler/wrap-parse-block {:block/format :markdown
                                                                                                   :block/content content})
                                                                 (outliner-core/block-with-timestamps)
                                                                 (merge {:block/page {:db/id
                                                                                      (or (:db/id (:block/page block))
                                                                                          (:db/id block))}
                                                                         :block/properties {pid true}}))
                                                   id (:block/uuid new-block)]
                                               (db/transact! repo [new-block] {:outliner-op :insert-blocks})
                                               (add-property! block (:block/original-name property) id)
                                               (when-let [f (:on-chosen opts)] (f))))))
                                       "Escape"
                                       (do (exit-edit-property)
                                           (when-let [f (:on-chosen opts)] (f)))
                                       nil))})})))

(defn- select
  [block property opts]
  (let [items (->> (model/get-block-property-values (:block/uuid property))
                   (mapcat (fn [[_id value]]
                             (if (coll? value)
                               (map (fn [v] {:value v}) value)
                               [{:value value}])))
                   (distinct))
        add-property-f #(add-property! block (:block/original-name property) %)]
    (select/select {:items items
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (add-property-f (:value chosen))
                                 (when-let [f (:on-chosen opts)] (f)))
                    :show-new-when-not-exact-match? true
                    :input-opts (fn [_]
                                  {:on-blur (or (:on-chosen opts) identity)
                                   :on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Escape"
                                       (when-let [f (:on-chosen opts)] (f))
                                       nil))})})))

(rum/defc property-scalar-value < rum/reactive db-mixins/query
  [block property value {:keys [inline-text page-cp block-cp
                                editor-id dom-id row?
                                editor-box editor-args
                                editing? editing-atom
                                blocks-container-id]}]
  (let [property (model/sub-block (:db/id property))
        multiple-values? (= :many (:cardinality (:block/schema property)))
        editor-id (or editor-id (str "ls-property-" blocks-container-id "-" (:db/id block) "-" (:db/id property)))
        editing? (or editing? (state/sub [:editor/editing? editor-id]))
        repo (state/get-current-repo)
        type (:type (:block/schema property))
        select-opts {:on-chosen (fn [] (when editing-atom (reset! editing-atom false)))}]
    (case type
      :date
      (date-picker block property value)

      :checkbox
      (let [add-property! (fn []
                            (add-property! block (:block/original-name property) (boolean (not value))))]
        (ui/checkbox {:tabIndex "0"
                      :checked value
                      :on-change (fn [_e] (add-property!))
                      :on-key-down (fn [e]
                                     (when (= (util/ekey e) "Enter")
                                       (add-property!)))}))
      ;; :others
      (if editing?
        [:div.flex.flex-1
         (case type
           (list :number :url)
           [:div.h-6 (select block property select-opts)]

           :page
           [:div.h-6 (select-page block property select-opts)]

           :block
           [:div.h-6 (select-block block property select-opts)]

           (let [config {:editor-opts
                         {:on-key-down
                          (fn [e]
                            (let [enter? (= (util/ekey e) "Enter")]
                              (when (and (contains? #{"Enter" "Escape"} (util/ekey e))
                                         (not (state/get-editor-action)))
                                (util/stop e)
                                (property-handler/set-block-property! repo (:block/uuid block)
                                                                      (:block/original-name property)
                                                                      (util/evalue e)
                                                                      :old-value value)
                                (exit-edit-property)

                                (when (and enter? multiple-values?)
                                  (let [values-count (-> (:block/properties (db/entity (:db/id block)))
                                                         (get (:block/uuid property))
                                                         (count))
                                        editor-id (str "ls-property-" blocks-container-id "-" (:db/id block) "-" (:db/id property) "-" values-count)]
                                    (set-editing! property editor-id nil ""))))))}}]
             (editor-box editor-args editor-id (cond-> config
                                                 multiple-values?
                                                 (assoc :property-value value)))))]
        (let [class (str (when-not row? "flex flex-1 ")
                         (when multiple-values? "property-value-content"))]
          [:div {:id (or dom-id (random-uuid))
                 :class class
                 :style {:min-height 24}
                 :on-click (fn []
                             (let [page-or-block? (contains? #{:page :block} type)]
                               (when (or (not page-or-block?)
                                         (and (string/blank? value) page-or-block?))
                                 (set-editing! property editor-id dom-id value))))}
           (let [type (if (and (= type :default) (uuid? value))
                        (if-let [e (db/entity [:block/uuid value])]
                          (if (:block/name e) :page :block)
                          type)
                        type)]
             (when-not (string/blank? value)
               (case type
                 :page
                 (when-let [page (db/entity [:block/uuid value])]
                   (page-cp {} page))

                 :block
                 (if-let [block (db/entity [:block/uuid value])]
                   [:div.property-block-container.w-full
                    (block-cp [block] {:id (str value)
                                       :editor-box editor-box
                                       :in-property? true})]
                   (if multiple-values?
                     (property-handler/delete-property-value! repo block (:block/uuid property) value)
                     (property-handler/remove-block-property! repo
                                                              (:block/uuid block)
                                                              (:block/uuid property))))

                 (inline-text {} :markdown (str value)))))])))))

(defn- get-property-from-db [name]
  (when-not (string/blank? name)
    (db/entity [:block/name (util/page-name-sanity-lc name)])))

(defn- add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context.
   For pages, used to add both schema properties or properties for a page"
  [entity property-name {:keys [class-schema? blocks-container-id page-configure?]}]
  (let [repo (state/get-current-repo)]
    ;; existing property selected or entered
    (if-let [property (get-property-from-db property-name)]
      (if (contains? gp-property/db-hidden-built-in-properties (keyword property-name))
        (do (notification/show! "This is a built-in property that can't be used." :error)
            (exit-edit-property))
        (if (= "class" (:block/type entity))
          (add-property! entity property-name "" {:class-schema? class-schema?
                                                  ;; Only enter property names from sub-modal as inputting
                                                  ;; property values is buggy in sub-modal
                                                  :exit-edit? page-configure?})
          (let [editor-id (str "ls-property-" blocks-container-id (:db/id entity) "-" (:db/id property))]
            (set-editing! property editor-id "" ""))))
      ;; new property entered
      (if (gp-property/db-valid-property-name? property-name)
        (if (= "class" (:block/type entity))
          (add-property! entity property-name "" {:class-schema? class-schema? :exit-edit? page-configure?})
          (do
            (db-property/upsert-property! repo property-name {:type :default} {})
            ;; configure new property
            (when-let [property (get-property-from-db property-name)]
              (state/set-sub-modal! #(property-config repo property)))))
        (do (notification/show! "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['." :error)
            (exit-edit-property))))))

(rum/defcs property-input < rum/reactive
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value {:keys [class-schema? page-configure?]
                                               :as opts}]
  (let [entity-properties (->> (keys (:block/properties entity))
                               (map #(:block/original-name (db/entity [:block/uuid %])))
                               (set))
        alias (if (seq (:block/alias entity)) #{"alias"} #{})
        exclude-properties (set/union
                            entity-properties
                            alias
                            (->> gp-property/db-hidden-built-in-properties
                                 (map name)
                                 set))
        properties (->> (search/get-all-properties)
                        (remove exclude-properties))]
    (if @*property-key
      (let [property (get-property-from-db @*property-key)]
        [:div.ls-property-add.grid.grid-cols-4.gap-1.flex.flex-row.items-center
         [:div.col-span-1 @*property-key]
         [:div.col-span-3.flex.flex-row
          (when (and property (not class-schema?))
            (property-scalar-value entity property @*property-value (assoc opts :editing? true)))
          [:a.close {:on-mouse-down exit-edit-property}
           svg/close]]])

      [:div.ls-property-add.h-6
       (select/select {:items (map (fn [x] {:value x}) properties)
                       :dropdown? true
                       :show-new-when-not-exact-match? true
                       :exact-match-exclude-items exclude-properties
                       :sub-modal? page-configure?
                       :input-default-placeholder "Add a property"
                       :on-chosen (fn [{:keys [value]}]
                                    (reset! *property-key value)
                                    (add-property-from-dropdown entity value opts))
                       :input-opts {:on-blur exit-edit-property}})])))

(rum/defcs new-property < rum/reactive
  (rum/local nil ::property-key)
  (rum/local nil ::property-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (property-handler/set-editing-new-property! nil))
      :node (js/document.getElementById "edit-new-property")
      :outside? false)))
  [state block edit-input-id properties new-property? opts]
  (let [*property-key (::property-key state)
        *property-value (::property-value state)]
    (cond
      new-property?
      [:div#edit-new-property
       (property-input block *property-key *property-value opts)]

      (or (:page-configure? opts)
          (and (seq properties)
               (not (pu/all-built-in-properties? (keys (:block/properties block))))))
      [:div
       [:a.add-button-link
        {:title "Add another property"
         :on-click (fn []
                     (property-handler/set-editing-new-property! edit-input-id)
                     (reset! *property-key nil)
                     (reset! *property-value nil))}
        (ui/icon "circle-plus" {:size 15})]])))

(rum/defcs property-key
  [state block property {:keys [class-schema?]}]
  (let [repo (state/get-current-repo)
        icon (pu/get-property property :icon)]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       [:a.property-k
        {:data-propertyid (:block/uuid property)
         :data-blockid (:block/uuid block)
         :data-class-schema (boolean class-schema?)
         :title (str "Configure property: " (:block/original-name property))
         :on-click toggle-fn}
        [:div.flex.flex-row.items-center
         (or
          (when-let [id (:id icon)]
            (when (= :emoji (:type icon))
              [:em-emoji {:id id}]))
       ;; default property icon
          (ui/icon "circle-dotted" {:size 16}))
         [:div.ml-1 (:block/original-name property)]]])
     (fn [{:keys [_toggle-fn]}]
       [:div.p-8
        (property-config repo property)])
     {:modal-class (util/hiccup->class
                    "origin-top-right.absolute.left-0.rounded-md.shadow-lg")})))

(rum/defcs multiple-value-item < (rum/local false ::show-close?)
  [state entity property item {:keys [editor-id row?]
                               :as opts}]
  (let [*show-close? (::show-close? state)
        editing? (state/sub [:editor/editing? editor-id])]
    [:div (cond->
              {:on-mouse-over #(reset! *show-close? true)
               :on-mouse-out  #(reset! *show-close? false)}
            (not row?)
            (assoc :class "relative flex flex-1")
            row?
            (assoc :class "relative pr-4"))
     (property-scalar-value entity property item (assoc opts :editing? editing?))
     (when @*show-close?
       [:a.close.fade-in
        {:class "absolute top-0 right-0"
         :title "Delete this value"
         :on-mouse-down
         (fn []
           (property-handler/delete-property-value! (state/get-current-repo)
                                                    entity
                                                    (:block/uuid property)
                                                    item))}
        (ui/icon "x")])]))

(rum/defcs property-value < rum/reactive
  (rum/local false ::editing?)
  [state block property v opts]
  (let [*editing? (::editing? state)
        k (:block/uuid property)
        dom-id (str "ls-property-" (:blocks-container-id opts) "-" k)
        editor-id (str "ls-property-" (:blocks-container-id opts) "-" (:db/id block) "-" (:db/id property))
        schema (:block/schema property)
        multiple-values? (= :many (:cardinality schema))
        row? (and multiple-values? (contains? #{:page} (:type schema)))
        block? (= (:type schema) :block)
        editor-args {:block property
                     :parent-block block
                     :format :markdown}]
    (cond
      multiple-values?
      (let [items (if (coll? v) v (when v [v]))]
        [:div {:class (cond
                        row?
                        "flex flex-1 flex-row items-center flex-wrap"
                        block?
                        "grid"
                        :else
                        "grid gap-1")}
         (for [[idx item] (medley/indexed items)]
           (let [dom-id' (str dom-id "-" idx)
                 editor-id' (str editor-id idx)]
             (rum/with-key
               (multiple-value-item block property item
                                    (merge
                                     opts
                                     {:dom-id dom-id'
                                      :editor-id editor-id'
                                      :editor-args editor-args
                                      :row? row?}))
               dom-id')))

         (cond
           @*editing?
           (property-scalar-value block property v
                                  (merge
                                   opts
                                   {:editor-args editor-args
                                    :editor-id editor-id
                                    :dom-id dom-id
                                    :editing? @*editing?
                                    :editing-atom *editing?}))

           :else
           [:div.rounded-sm.ml-1 {:on-click (fn [] (reset! *editing? true))}
            [:div.flex.flex-row
             [:a.add-button-link.inline-flex {:title "Add another value"
                                              :style {:margin-left -3}}
              (ui/icon "circle-plus")]]])])

      :else
      [:div.flex.flex-1.items-center.property-value-content
       (property-scalar-value block property v
                              (merge
                               opts
                               {:editor-args editor-args
                                :editor-id editor-id
                                :dom-id dom-id}))])))

(defn- resolve-instance-page-if-exists
  "Properties will be updated for the instance page instead of the refed block.
  For example, the block below has a reference to the page \"How to solve it\",
  we'd like the properties of the class \"book\" (e.g. Authors, Published year)
  to be assigned for the page `How to solve it` instead of the referenced block.

  Block:
  - [[How to solve it]] #book
  "
  [block]
  (if-let [instance (:block/instance block)]
    (db/sub-block (:db/id instance))
    (db/sub-block (:db/id block))))

(rum/defcs properties-area < rum/reactive
  [state target-block edit-input-id opts]
  (let [block (resolve-instance-page-if-exists target-block)
        properties (if (and (:class-schema? opts) (:block/schema block))
                     (let [properties (:properties (:block/schema block))]
                       (map (fn [k] [k nil]) properties))
                     (:block/properties block))
        alias (set (map :block/uuid (:block/alias block)))
        alias-properties (when (seq alias)
                           [[(:block/uuid (db/entity [:block/name "alias"])) alias]])
        new-property? (= edit-input-id (state/sub :ui/new-property-input-id))
        class-properties (->> (:block/tags block)
                              (mapcat (fn [tag]
                                        (when (= "class" (:block/type tag))
                                          (let [e (db/entity (:db/id tag))]
                                            (:properties (:block/schema e))))))
                              (map (fn [id]
                                     [id nil])))
        built-in-properties (set/difference
                             (set (map name gp-property/db-built-in-properties-keys))
                             #{"alias"})
        properties (->> (concat (seq alias-properties)
                                (seq properties)
                                class-properties)
                        (util/distinct-by first)
                        (remove (fn [[k _v]]
                                  (when (uuid? k)
                                    (contains? built-in-properties (:block/name (db/entity [:block/uuid k])))))))]
    (when-not (and (empty? properties)
                   (not new-property?)
                   (not (:page-configure? opts)))
      [:div.ls-properties-area
       (when (:selected? opts)
         {:class "select-none"})
       (when (seq properties)
         (for [[k v] properties]
           (when (uuid? k)
             (when-let [property (db/sub-block (:db/id (db/entity [:block/uuid k])))]
               [:div.property-pair
                [:div.property-key.col-span-1
                 (property-key block property (select-keys opts [:class-schema?]))]
                (if (:class-schema? opts)
                  [:div.property-description.col-span-3.font-light
                   (get-in property [:block/schema :description])]
                  [:div.property-value.col-span-3.inline-grid
                   (property-value block property v opts)])]))))
       (new-property block edit-input-id properties new-property? opts)])))
