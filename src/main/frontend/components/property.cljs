(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as db-model]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db.property :as db-property]
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]))

(rum/defc icon
  [block {:keys [_type id]} {:keys [disabled?]}]            ; only :emoji supported yet
  (let [repo (state/get-current-repo)
        icon-property-id (:block/uuid (db/entity [:block/name "icon"]))]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       (if id
         [:a {:on-click #(when-not disabled? (toggle-fn))}
          [:em-emoji {:id id}]]
         [:a.flex.flex-row.items-center {:on-click #(when-not disabled? (toggle-fn))}
          (ui/icon "point" {:size 16})
          [:div.ml-1.text-sm "Pick another icon"]]))
     (fn [{:keys [toggle-fn]}]
       (ui/emoji-picker
        {:auto-focus true
         :on-emoji-select (fn [icon]
                            (when-let [id (.-id icon)]
                              (property-handler/update-property! repo (:block/uuid block) {:properties {icon-property-id {:type :emoji
                                                                                                                          :id id}}}))
                            (toggle-fn))})))))

(rum/defcs class-select < (rum/local false ::open?)
  [state *property-schema schema-classes {:keys [multiple-choices? disabled?]
                                          :or {multiple-choices? true}}]
  (let [*open? (::open? state)]
    (if @*open?
      (let [classes (db-model/get-all-classes (state/get-current-repo))
            options (map (fn [[name id]] {:label name
                                          :value id})
                         classes)
            opts (cond->
                  {:items options
                   :input-default-placeholder (if multiple-choices? "Choose classes" "Choose class")
                   :dropdown? true
                   :multiple-choices? multiple-choices?
                   :selected-choices schema-classes
                   :extract-fn :label
                   :extract-chosen-fn :value
                   :input-opts {:on-blur (fn [] (reset! *open? false))
                                :on-key-down
                                (fn [e]
                                  (case (util/ekey e)
                                    "Escape"
                                    (do
                                      (util/stop e)
                                      (reset! *open? false))
                                    nil))}}
                   multiple-choices?
                   (assoc :on-apply (fn [choices]
                                      (swap! *property-schema assoc :classes choices)
                                      (reset! *open? false)))

                   (not multiple-choices?)
                   (assoc :on-chosen (fn [value]
                                       (swap! *property-schema assoc :classes [value])
                                       (reset! *open? false))))]
        (select/select opts))
      [:div.flex.flex-1.flex-row.cursor.items-center.flex-wrap.gap-2.col-span-3
       {:on-click #(when-not disabled? (reset! *open? true))}
       (if (seq schema-classes)
         (for [class schema-classes]
           (when-let [page (db/entity [:block/uuid class])]
             (let [page-name (:block/original-name page)]
               [:a.text-sm (str "#" page-name)])))
         [:div.text-sm
          (if multiple-choices?
            "Click to add classes"
            "Click to select a class")])])))

(rum/defcs property-config <
  rum/reactive
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[_repo property] (:rum/args state)]
                   (reset! (::property-name state) (:block/original-name property))
                   (reset! (::property-schema state) (:block/schema property))
                   state))}
  [state repo property {:keys [toggle-fn] :as opts}]
  (let [*property-name (::property-name state)
        *property-schema (::property-schema state)
        built-in-property? (contains? db-property/built-in-properties-keys-str (:block/original-name property))
        property (db/sub-block (:db/id property))
        disabled? (or built-in-property? config/publishing?)]
    [:div.property-configure.flex.flex-1.flex-col
     [:div.font-bold.text-xl
      (if disabled?
        "Property fields"
        "Configure property")]

     [:div.grid.gap-2.p-1.mt-4
      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.col-span-1 "Name:"]
       [:input.form-input.col-span-2
        {:on-change #(reset! *property-name (util/evalue %))
         :disabled disabled?
         :value @*property-name}]]

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.col-span-1 "Icon:"]
       (let [icon-value (pu/get-property property :icon)]
         [:div.col-span-3
          (icon property icon-value {:disabled? disabled?})])]

      [:div.grid.grid-cols-4.gap-1.leading-8
       [:label.col-span-1 "Schema type:"]
       (let [schema-types (->> (concat property-handler/user-face-builtin-schema-types
                                       (when built-in-property?
                                         property-handler/internal-builtin-schema-types))
                               (map (comp string/capitalize name))
                               (map (fn [type]
                                      {:label (if (= type "Default") "Text" type)
                                       :disabled disabled?
                                       :value type
                                       :selected (= (keyword (string/lower-case type))
                                                    (:type @*property-schema))})))]
         [:div.col-span-2
          (ui/select schema-types
                     (fn [_e v]
                       (let [type (keyword (string/lower-case v))]
                         (swap! *property-schema assoc :type type))))])]

      (when (= :page (:type @*property-schema))
        [:div.grid.grid-cols-4.gap-1.leading-8
         [:label "Specify classes:"]
         (class-select *property-schema (:classes @*property-schema) (assoc opts :disabled? disabled?))])

      (when (= :template (:type @*property-schema))
        [:div.grid.grid-cols-4.gap-1.leading-8
         [:label "Specify template:"]
         (class-select *property-schema (:classes @*property-schema)
                       (assoc opts :multiple-choices? false :disabled? disabled?))])

      (when-not (contains? #{:checkbox :default :template} (:type @*property-schema))
        [:div.grid.grid-cols-4.gap-1.items-center.leading-8
         [:label "Multiple values:"]
         (let [many? (boolean (= :many (:cardinality @*property-schema)))]
           (ui/checkbox {:checked many?
                         :disabled disabled?
                         :on-change (fn []
                                      (swap! *property-schema assoc :cardinality (if many? :one :many)))}))])

      (when-not built-in-property?
        (let [hide? (:hide? @*property-schema)]
          [:div.grid.grid-cols-4.gap-1.items-center.leading-8
           [:label "Hide by default:"]
           (ui/checkbox {:checked hide?
                         :disabled disabled?
                         :on-change (fn []
                                      (swap! *property-schema assoc :hide? (not hide?)))})]))

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label "Description:"]
       [:div.col-span-3
        (ui/ls-textarea
         {:on-change (fn [e]
                       (swap! *property-schema assoc :description (util/evalue e)))
          :disabled disabled?
          :value (:description @*property-schema)})]]

      [:div
       (when-not disabled?
         (ui/button
          "Save"
          :on-click (fn [e]
                      (util/stop e)
                      (property-handler/update-property!
                       repo (:block/uuid property)
                       {:property-name @*property-name
                        :property-schema @*property-schema})
                      (when toggle-fn (toggle-fn)))))]]]))

(defn- get-property-from-db [name]
  (when-not (string/blank? name)
    (db/entity [:block/name (util/page-name-sanity-lc name)])))

(defn- add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context.
   For pages, used to add both schema properties or properties for a page"
  [entity property-name {:keys [class-schema? blocks-container-id page-configure?
                                *show-new-property-config?]}]
  (let [repo (state/get-current-repo)]
    ;; existing property selected or entered
    (if-let [property (get-property-from-db property-name)]
      (if (contains? db-property/hidden-built-in-properties (keyword property-name))
        (do (notification/show! "This is a built-in property that can't be used." :error)
            (pv/exit-edit-property))
        (if (contains? (:block/type entity) "class")
          (pv/add-property! entity property-name "" {:class-schema? class-schema?
                                                  ;; Only enter property names from sub-modal as inputting
                                                  ;; property values is buggy in sub-modal
                                                     :exit-edit? page-configure?})
          (let [editor-id (str "ls-property-" blocks-container-id (:db/id entity) "-" (:db/id property))]
            (pv/set-editing! property editor-id "" ""))))
      ;; new property entered
      (if (db-property/valid-property-name? property-name)
        (if (contains? (:block/type entity) "class")
          (pv/add-property! entity property-name "" {:class-schema? class-schema? :exit-edit? page-configure?})
          (do
            (db-property-handler/upsert-property! repo property-name {:type :default} {})
            (when *show-new-property-config?
              (reset! *show-new-property-config? true))))
        (do (notification/show! "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['." :error)
            (pv/exit-edit-property))))))

(rum/defcs property-input < rum/reactive
  (rum/local false ::show-new-property-config?)
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value {:keys [class-schema? page-configure? in-block-container?]
                                               :as opts}]
  (let [repo (state/get-current-repo)
        *show-new-property-config? (::show-new-property-config? state)
        entity-properties (->> (keys (:block/properties entity))
                               (map #(:block/original-name (db/entity [:block/uuid %])))
                               (set))
        existing-tag-alias (reduce (fn [acc prop]
                                     (if (seq (get entity (get-in db-property/built-in-properties [prop :attribute])))
                                       (conj acc (get-in db-property/built-in-properties [prop :original-name]))
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
           [:div.ml-1 @*property-key]]
          [:div.col-span-3.flex.flex-row
           (when (not (and class-schema? page-configure?))
             (if @*show-new-property-config?
               (ui/dropdown
                (fn [_opts]
                  (pv/property-scalar-value entity property @*property-value (assoc opts :editing? true)))
                (fn [{:keys [toggle-fn]}]
                  [:div.p-6
                   (property-config repo property (merge opts
                                                         {:toggle-fn toggle-fn
                                                          :block entity}))])
                {:initial-open? true
                 :modal-class (util/hiccup->class
                               "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})
               (pv/property-scalar-value entity property @*property-value (assoc opts :editing? true))))]])

       [:div.ls-property-add.flex.flex-row.items-center
        [:span.bullet-container.cursor [:span.bullet]]
        [:div.ml-1 {:style {:height "1.5em"}} ; TODO: ugly
         (select/select {:items (map (fn [x] {:value x}) properties)
                         :dropdown? true
                         :show-new-when-not-exact-match? true
                         :exact-match-exclude-items exclude-properties
                         :input-default-placeholder "Add a property"
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

(rum/defcs new-property < rum/reactive
  (rum/local nil ::property-key)
  (rum/local nil ::property-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn [] (property-handler/set-editing-new-property! nil))
      :node (js/document.getElementById "edit-new-property")
      :outside? false)))
  [state block edit-input-id properties new-property? opts]
  [:div.ls-new-property
   (let [*property-key (::property-key state)
         *property-value (::property-value state)]
     (cond
       new-property?
       [:div#edit-new-property
        (property-input block *property-key *property-value opts)]

       (and (or (:page-configure? opts)
                (seq properties)
                (seq (:block/alias block))
                (seq (:block/tags block)))
            (not config/publishing?)
            (or (:page-configure? opts) (not (:in-block-container? opts))))
       [:a.fade-link.flex
        {:on-click (fn []
                     (property-handler/set-editing-new-property! edit-input-id)
                     (reset! *property-key nil)
                     (reset! *property-value nil))}
        [:div.flex.flex-row.items-center
         (ui/icon "circle-plus" {:size 15})
         [:div.ml-1.text-sm "Add property"]]]

       :else
       [:div {:style {:height 28}}]))])

(defn- property-collapsed?
  [block property]
  (boolean?
   (some (fn [p] (= (:db/id property) (:db/id p)))
         (:block/collapsed-properties block))))

(rum/defcs property-key <
  (rum/local false ::hover?)
  [state block property {:keys [class-schema? block? collapsed?]}]
  (let [*hover? (::hover? state)
        repo (state/get-current-repo)
        icon (pu/get-property property :icon)]
    [:div.flex.flex-row.items-center {:on-mouse-over #(reset! *hover? true)
                                      :on-mouse-leave #(reset! *hover? false)}
     (when block?
       [:a.block-control
        {:on-click (fn [event]
                     (util/stop event)
                     (property-handler/collapse-expand-property! repo block property (not collapsed?)))}
        [:span {:class (cond
                         (or collapsed? @*hover?)
                         "control-show cursor-pointer"
                         :else
                         "control-hide")}
         (ui/rotating-arrow collapsed?)]])
     (ui/dropdown
      (fn [{:keys [toggle-fn]}]
        [:a.flex {:on-click toggle-fn}
         (or
          (when-let [id (:id icon)]
            (when (= :emoji (:type icon))
              [:em-emoji {:id id}]))
          [:span.bullet-container.cursor (when collapsed? {:class "bullet-closed"})
           [:span.bullet]])])
      (fn [{:keys [toggle-fn]}]
        (ui/emoji-picker
         {:auto-focus true
          :on-emoji-select (fn [icon]
                             (when-let [id (.-id icon)]
                               (let [icon-property-id (:block/uuid (db/entity [:block/name "icon"]))]
                                 (property-handler/update-property! repo
                                                                    (:block/uuid property)
                                                                    {:properties {icon-property-id {:type :emoji
                                                                                                    :id id}}})))
                             (toggle-fn))}))
      {:modal-class (util/hiccup->class
                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})
     (ui/dropdown
      (if config/publishing?
        (fn [_opts]
          [:a.property-k
           {:on-click #(route-handler/redirect-to-page! (:block/name property))}
           [:div.ml-1 (:block/original-name property)]])
        (fn [{:keys [toggle-fn]}]
          [:a.property-k
           {:data-propertyid (:block/uuid property)
            :data-blockid (:block/uuid block)
            :data-class-schema (boolean class-schema?)
            :title (str "Configure property: " (:block/original-name property))
            :on-mouse-down (fn [e]
                             (when (util/meta-key? e)
                               (route-handler/redirect-to-page! (:block/name property))
                               (.preventDefault e)))
            :on-click toggle-fn}
           [:div.ml-1 (:block/original-name property)]]))
      (fn [{:keys [toggle-fn]}]
        [:div.p-8
         (property-config repo property {:toggle-fn toggle-fn})])
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

(defn- get-namespace-parents
  [tags]
  (let [tags' (filter (fn [tag] (contains? (:block/type tag) "class")) tags)
        *namespaces (atom #{})]
    (doseq [tag tags']
      (when-let [ns (:block/namespace tag)]
        (loop [current-ns ns]
          (when (and
                 current-ns
                 (contains? (:block/type ns) "class")
                 (not (contains? @*namespaces (:db/id ns))))
            (swap! *namespaces conj current-ns)
            (recur (:block/namespace current-ns))))))
    @*namespaces))

(rum/defc properties-section < rum/reactive db-mixins/query
  [block properties {:keys [inline-text] :as opts}]
  (when (seq properties)
    (for [[k v] properties]
      (when (uuid? k)
        (when-let [property (db/sub-block (:db/id (db/entity [:block/uuid k])))]
          (let [type (get-in property [:block/schema :type] :default)
                block? (and (contains? #{:default :template} type)
                            (uuid? v)
                            (db/entity [:block/uuid v]))
                collapsed? (when block? (property-collapsed? block property))]
            [:div {:class (if block?
                            "flex flex-1 flex-col gap-1 property-block"
                            "property-pair items-center")}
             [:div.property-key
              {:class "col-span-2"}
              (property-key block property (assoc (select-keys opts [:class-schema?])
                                                  :block? block?
                                                  :collapsed? collapsed?))]
             (if (and (:class-schema? opts) (:page-configure? opts))
               [:div.property-description.text-sm.opacity-70
                {:class "col-span-3"}
                (inline-text {} :markdown (get-in property [:block/schema :description]))]
               (when-not collapsed?
                 [:div.property-value {:class (if block?
                                                "block-property-value"
                                                "col-span-3 inline-grid")}
                  (pv/property-value block property v opts)]))]))))))

(rum/defcs hidden-properties < (rum/local true ::hide?)
  [state block hidden-properties opts]
  (let [*hide? (::hide? state)]
    [:div.hidden-properties.flex.flex-col.gap-1
     [:a.block-control.text-sm.flex.flex-row.items-center
      {:on-click #(swap! *hide? not)}
      (ui/rotating-arrow @*hide?)
      [:div "Hidden properties"]]
     (when-not @*hide?
       (properties-section block hidden-properties opts))]))

(rum/defcs properties-area < rum/reactive
  {:init (fn [state]
           (assoc state ::blocks-container-id (or (:blocks-container-id (last (:rum/args state)))
                                                  (state/next-blocks-container-id))))}
  [state target-block edit-input-id {:keys [in-block-container? page-configure?] :as opts}]
  (let [block (resolve-linked-block-if-exists target-block)
        class-schema? (and (:class-schema? opts) (:block/schema block))
        block-properties (:block/properties block)
        properties (if (and class-schema? page-configure?)
                     (let [properties (:properties (:block/schema block))]
                       (map (fn [k] [k nil]) properties))
                     (sort-by first block-properties))
        alias (set (map :block/uuid (:block/alias block)))
        alias-properties (when (seq alias)
                           [[(:block/uuid (db/entity [:block/name "alias"])) alias]])
        remove-built-in-properties (fn [properties]
                                     (remove (fn [x]
                                               (let [id (if (uuid? x) x (first x))]
                                                 (when (uuid? id)
                                                   (contains? db-property/hidden-built-in-properties (keyword (:block/name (db/entity [:block/uuid id])))))))
                                             properties))
        classes (->> (:block/tags block)
                     (sort-by :block/name)
                     (filter (fn [tag] (contains? (:block/type tag) "class"))))
        one-class? (= 1 (count classes))
        namespace-parents (get-namespace-parents classes)
        all-classes (->> (concat classes namespace-parents)
                         (filter (fn [class]
                                   (seq (:properties (:block/schema class))))))
        classes-properties (-> (mapcat (fn [class]
                                         (seq (:properties (:block/schema class)))) all-classes)
                               distinct)
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
        own-properties (if one-class?
                         (concat block-own-properties' class-own-properties)
                         block-own-properties')
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
                              result))
        opts (assoc opts :blocks-container-id (::blocks-container-id state))]
    (when-not (and (empty? own-properties)
                   (empty? class->properties)
                   (not new-property?)
                   (not (:page-configure? opts)))
      [:div.ls-properties-area (cond->
                                {}
                                 (:selected? opts)
                                 (assoc :class "select-none"))
       (properties-section block (if class-schema? properties own-properties) opts)

       (when (and (seq full-hidden-properties) (not class-schema?) (not config/publishing?))
         (hidden-properties block full-hidden-properties opts))

       (when (or new-property? (not in-block-container?))
         (new-property block edit-input-id properties new-property? opts))

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
