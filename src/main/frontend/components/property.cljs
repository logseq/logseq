(ns frontend.components.property
  "Block properties management."
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.property :as property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.config :as config]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.components.search.highlight :as highlight]
            [frontend.components.svg :as svg]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.components.select :as select]
            [logseq.graph-parser.property :as gp-property]
            [medley.core :as medley]
            [cljs-time.coerce :as tc]))

(rum/defcs property-config <
  rum/static
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[_repo property] (:rum/args state)]
                   (reset! (::property-name state) (:block/original-name property))
                   (reset! (::property-schema state) (:block/schema property))
                   state))}
  [state repo property ]
  (let [*property-name (::property-name state)
        *property-schema (::property-schema state)]
    [:div.property-configure
     [:h1.title "Configure property"]

     [:div.grid.gap-2.p-1
      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label "Name:"]
       [:input.form-input
        {:on-change #(reset! *property-name (util/evalue %))
         :value @*property-name}]]

      [:div.grid.grid-cols-4.gap-1.leading-8
       [:label "Schema type:"]
       (let [schema-types (->> (keys property-handler/builtin-schema-types)
                               (remove gp-property/db-built-in-properties-keys)
                               (map (comp string/capitalize name))
                               (map (fn [type]
                                      {:label type
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
                         :on-change (fn []
                                      (swap! *property-schema assoc :cardinality (if many? :one :many)))}))])

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label "Description:"]
       [:div.col-span-3
        (ui/ls-textarea
         {:on-change (fn [e]
                       (swap! *property-schema assoc :description (util/evalue e)))
          :value (:description @*property-schema)})]]

      [:div
       (ui/button
         "Save"
         :on-click (fn []
                     (property-handler/update-property!
                      repo (:block/uuid property)
                      {:property-name @*property-name
                       :property-schema @*property-schema})
                     (state/close-modal!)))]

      (when config/dev?
        [:div {:style {:max-width 900}}
         [:hr]
         [:p "Debug data:"]
         [:pre (util/pp-str property)]])]]))

(rum/defc search-item-render
  [search-q content]
  [:div.font-medium
   (highlight/highlight-exact-query content search-q)])

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
         (property-handler/class-add-property! repo block property-key)
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
  [block property]
  (let [repo (state/get-current-repo)
        pages (->> (model/get-all-page-original-names repo)
                   (map (fn [p] {:value p})))]
    (select/select {:items pages
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (let [page (:value chosen)
                                       id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))]
                                   (add-property! block (:block/original-name property) id)))
                    :input-opts (fn [not-matched?]
                                  {:on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Enter"
                                       (when not-matched?
                                         (let [page (string/trim (util/evalue e))]
                                           (when-not (string/blank? page)
                                             (page-handler/create! page {:redirect? false
                                                                         :create-first-block? false})
                                             (let [id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))]
                                               (add-property! block (:block/original-name property) id)))))
                                       "Escape"
                                       (exit-edit-property)
                                       nil))})})))

(defn- select-block
  [block property]
  (let [blocks (->> (model/get-all-block-contents)
                   (map (fn [b]
                          (assoc b :value (:block/content b)))))]
    (select/select {:items blocks
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (let [id (:block/uuid chosen)]
                                   (add-property! block (:block/original-name property) id)))
                    :input-opts (fn [not-matched?]
                                  {:on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Enter"
                                       (when not-matched?
                                         (let [content (string/trim (util/evalue e))]
                                           (when-not (string/blank? content)
                                             (let [property-page config/property-page]
                                               (when-not (db/entity [:block/name property-page])
                                                 (let [id (db/new-block-id)]
                                                   (db/transact! [{:block/uuid id
                                                                  :block/name property-page
                                                                  :block/original-name property-page
                                                                  :block/type "page"
                                                                  :block/created-at (util/time-ms)
                                                                  :block/updated-at (util/time-ms)}])))
                                               (let [new-block (editor-handler/api-insert-new-block! content
                                                                                                     {:page property-page
                                                                                                      :replace-empty-target? false})]
                                                 (when-let [id (:block/uuid new-block)]
                                                   (add-property! block (:block/original-name property) id)))))))
                                       "Escape"
                                       (exit-edit-property)
                                       nil))})})))

(defn- select
  [block property]
  (let [items (->> (model/get-block-property-values (:block/uuid property))
                   (mapcat (fn [[_id value]]
                             (if (coll? value)
                               (map (fn [v] {:value v}) value)
                               [{:value value}])))
                   (distinct))
        add-property-f #(add-property! block (:block/original-name property) %)]
    (select/select {:items items
                    :dropdown? true
                    :on-chosen (fn [chosen] (add-property-f (:value chosen)))
                    :input-opts (fn [not-matched?]
                                  {:on-key-down (fn [e]
                                                 (case (util/ekey e)
                                                   "Enter"
                                                   (when not-matched?
                                                     (add-property-f (util/evalue e)))

                                                   "Escape"
                                                   (exit-edit-property)

                                                   nil))})})))

(rum/defc property-scalar-value < rum/reactive
  [block property value {:keys [inline-text page-cp block-cp
                                editor-id dom-id
                                editor-box editor-args
                                new-item? editing?
                                blocks-container-id]}]
  (let [multiple-values? (= :many (:cardinality (:block/schema property)))
        editor-id (or editor-id (str "ls-property-" blocks-container-id "-" (:db/id block) "-" (:db/id property)))
        editing? (or editing? (state/sub [:editor/editing? editor-id]))
        repo (state/get-current-repo)
        type (:type (:block/schema property))]
    (when (or (not new-item?) editing?)
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
            (select block property)

            :page
            (select-page block property)

            :block
            (select-block block property)

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
         [:div.flex.flex-1
          (cond->
              {:id (or dom-id (random-uuid))
               :style {:min-height 24}
               :on-click (fn []
                           (let [page-or-block? (contains? #{:page :block} type)]
                             (when (or (not page-or-block?)
                                       (and (string/blank? value) page-or-block?))
                              (set-editing! property editor-id dom-id value))))}
            multiple-values?
            (assoc :class "property-value-content"))
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
                                     :editor-box editor-box})]
                 (if multiple-values?
                   (property-handler/delete-property-value! repo block (:block/uuid property) value)
                   (property-handler/remove-block-property! repo (:block/uuid block) (:block/uuid property))))

               (inline-text {} :markdown (str value)))))])))))

(rum/defcs property-key-input <
  (rum/local false ::key-down-triggered?)
  [state block *property-key *property-value *search? {:keys [blocks-container-id class-schema?]}]
  (let [*key-down-triggered? (::key-down-triggered? state)]
    [:input#add-property.form-input.simple-input.block.col-span-1.focus:outline-none
     {:placeholder "Add a property"
      :tabindex "0"
      :value @*property-key
      :auto-focus true
      :on-change (fn [e]
                   (reset! *property-key (util/evalue e))
                   (reset! *search? true))
      :on-key-down (fn [_e]
                     (reset! *key-down-triggered? true))
      :on-key-up (fn [e]
                   (when @*key-down-triggered?
                     (case (util/ekey e)
                       "Escape"
                       (exit-edit-property)

                       (list "Tab" "Enter")
                       (let [k (util/evalue e)]
                         (when (= (util/ekey e) "Tab")
                           (util/stop e))
                         (reset! *property-key k)
                         (reset! *search? false)
                         ;; new property
                         (let [property (db/entity [:block/name (util/page-name-sanity-lc k)])
                               value (when-not (contains? #{:date :checkbox :number :url} (:type (:block/schema property)))
                                       "")]
                           (reset! *property-value value)
                           (add-property! block @*property-key @*property-value {:exit-edit? (some? value)
                                                                                 :class-schema? class-schema?})
                           (when property
                             (let [editor-id (str "ls-property-" blocks-container-id (:db/id block) "-" (:db/id property))]
                               (set-editing! property editor-id "" "")))))

                       nil)
                     (reset! *key-down-triggered? false)))}]))

(rum/defcs property-input < rum/reactive
  (rum/local true ::search?)
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value opts]
  (let [*search? (::search? state)
        entity-properties (->> (keys (:block/properties entity))
                               (map #(:block/original-name (db/entity [:block/uuid %])))
                               (set))
        result (when-not (string/blank? @*property-key)
                 (->> (search/property-search @*property-key)
                      (remove entity-properties)))
        property (when @*property-key
                   (db/entity [:block/name (util/page-name-sanity-lc @*property-key)]))]
    [:div
     [:div.ls-property-add.grid.grid-cols-4.gap-1.flex.flex-row.items-center
      (property-key-input entity *property-key *property-value *search? (select-keys opts [:blocks-container-id :class-schema?]))
      [:div.col-span-3.flex.flex-row
       (when (and property
                  (not (:class-schema? opts))
                  (not @*search?))
         (property-scalar-value entity property @*property-value (assoc opts :editing? true)))
       [:a.close {:on-mouse-down exit-edit-property}
        svg/close]]]
     (when @*search?
       (ui/auto-complete
        result
        {:class "search-results"
         :on-chosen (fn [chosen]
                      (reset! *property-key chosen)
                      (reset! *search? false))
         :item-render #(search-item-render @*property-key %)}))]))

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

     (or (seq properties)
         (:page-configure? opts))
     [:a {:title "Add another property"
          :on-click (fn []
                      (property-handler/set-editing-new-property! edit-input-id)
                      (reset! *property-key nil)
                      (reset! *property-value nil))}
      [:div.block {:style {:height      20
                           :width       20}}
       [:a.add-button-link.block.mt-1 {:style {:margin-left -4}}
        (ui/icon "circle-plus")]]])))

(rum/defcs property-key
  [state block property {:keys [class-schema?]}]
  (let [repo (state/get-current-repo)]
    [:a
     {:data-propertyid (:block/uuid property)
      :data-blockid (:block/uuid block)
      :data-class-schema (boolean class-schema?)
      :title (str "Configure property: " (:block/original-name property))
      :on-click (fn []
                  (state/set-sub-modal! #(property-config repo property)))}
     (:block/original-name property)]))

(rum/defcs multiple-value-item < (rum/local false ::show-close?)
  [state entity property items item {:keys [editor-id new-item?]
                                     :as opts}]
  (let [*show-close? (::show-close? state)
        editing? (state/sub [:editor/editing? editor-id])]
    [:div.flex.flex-1.flex-row {:on-mouse-over #(reset! *show-close? true)
                                :on-mouse-out  #(reset! *show-close? false)}
     (property-scalar-value entity property item (assoc opts :editing? editing?))
     (when (and (or (not new-item?) editing?)
                @*show-close?
                (seq items))
       [:a.close.fade-in
        {:title "Delete this value"
         :on-mouse-down
         (fn []
           (property-handler/delete-property-value! (state/get-current-repo)
                                                    entity
                                                    (:block/uuid property)
                                                    item))}
        svg/close])]))

(rum/defcs property-value < rum/reactive
  [state block property value opts]
  (let [k (:block/uuid property)
        v (get (:block/properties block) k)
        dom-id (str "ls-property-" (:blocks-container-id opts) "-" k)
        editor-id (str "ls-property-" (:blocks-container-id opts) "-" (:db/id block) "-" (:db/id property))
        schema (:block/schema property)
        multiple-values? (= :many (:cardinality schema))
        editor-args {:block property
                     :parent-block block
                     :format :markdown}]
    (cond
      multiple-values?
      (let [items (if (coll? v) v (when v [v]))
            v' (if (seq items) items [""])
            v' (conj v' ::new-value-placeholder) ; new one
            ]
        [:div.grid.gap-1
         (for [[idx item] (medley/indexed v')]
           (let [dom-id' (str dom-id "-" idx)
                 editor-id' (str editor-id idx)]
             (rum/with-key
               (multiple-value-item block property items item
                                    (merge
                                     opts
                                     {:dom-id dom-id'
                                      :editor-id editor-id'
                                      :editor-args editor-args
                                      :new-item? (= item ::new-value-placeholder)}))
               dom-id')))

         (let [fv (first v')]
           (when (and fv
                      (or (and (string? fv) (not (string/blank? fv)))
                          (and (not (string? fv)) (some? fv))))
             [:div.rounded-sm.ml-1
              {:on-click (fn []
                           (set-editing! property (str editor-id (dec (count v'))) nil ""))}
              [:div.flex.flex-row
               [:div.block {:style {:height      20
                                    :width       20}}
                [:a.add-button-link.block {:title "Add another value"
                                           :style {:margin-left -4}}
                 (ui/icon "circle-plus")]]]]))])

      :else
      [:div.flex.flex-1.items-center.property-value-content
       (property-scalar-value block property value
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
        new-property? (= edit-input-id (state/sub :ui/new-property-input-id))
        class-properties (->> (:block/tags block)
                              (mapcat (fn [tag]
                                        (when (= "class" (:block/type tag))
                                          (let [e (db/entity (:db/id tag))]
                                            (:properties (:block/schema e))))))
                              (map (fn [id]
                                     [id nil])))
        built-in-properties (set (map name gp-property/db-built-in-properties-keys))
        properties (->> (concat (seq properties) class-properties)
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
                  [:div.property-value.col-span-3
                   (property-value block property v (assoc opts :parsed-value v))])]))))
       (new-property block edit-input-id properties new-property? opts)])))
