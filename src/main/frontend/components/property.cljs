(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.db :as db]
            [frontend.handler.db-based.property :as db-property]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.graph-parser.property :as gp-property]
            [rum.core :as rum]))

(rum/defc icon
  [block {:keys [_type id]}]            ; only :emoji supported yet
  (let [repo (state/get-current-repo)
        icon-property-id (:block/uuid (db/entity [:block/name "icon"]))]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       (if id
         [:a {:on-click toggle-fn}
          [:em-emoji {:id id}]]
         [:a {:on-click toggle-fn}
          [:div.flex.flex-row.items-center
           (ui/icon "letter-p" {:size 16})
           [:div.ml-1.text-sm "Pick another icon"]]]))
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
  [state repo property {:keys [toggle-fn block]}]
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
       (let [schema-types (->> property-handler/user-face-builtin-schema-types
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
          :on-click (fn [e]
                      (let [block? (= :block (:type @*property-schema))]
                        (util/stop e)
                        (property-handler/update-property!
                         repo (:block/uuid property)
                         {:property-name @*property-name
                          :property-schema @*property-schema})
                        (state/close-modal!)
                        (when toggle-fn (toggle-fn))
                        (when (and block? block)
                          (pv/create-new-block! block property nil))))))]]]))

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
      (if (contains? gp-property/db-hidden-built-in-properties (keyword property-name))
        (do (notification/show! "This is a built-in property that can't be used." :error)
            (pv/exit-edit-property))
        (if (= "class" (:block/type entity))
          (pv/add-property! entity property-name "" {:class-schema? class-schema?
                                                  ;; Only enter property names from sub-modal as inputting
                                                  ;; property values is buggy in sub-modal
                                                     :exit-edit? page-configure?})
          (let [editor-id (str "ls-property-" blocks-container-id (:db/id entity) "-" (:db/id property))]
            (pv/set-editing! property editor-id "" ""))))
      ;; new property entered
      (if (gp-property/db-valid-property-name? property-name)
        (if (= "class" (:block/type entity))
          (pv/add-property! entity property-name "" {:class-schema? class-schema? :exit-edit? page-configure?})
          (do
            (db-property/upsert-property! repo property-name {:type :default} {})
            (when *show-new-property-config?
              (reset! *show-new-property-config? true))))
        (do (notification/show! "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['." :error)
            (pv/exit-edit-property))))))

(rum/defcs property-input < rum/reactive
  (rum/local false ::show-new-property-config?)
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value {:keys [class-schema? page-configure? *configure-show?]
                                               :as opts}]
  (let [repo (state/get-current-repo)
        *show-new-property-config? (::show-new-property-config? state)
        entity-properties (->> (keys (:block/properties entity))
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
      (when-let [property (get-property-from-db @*property-key)]
        [:div.ls-property-add.grid.grid-cols-4.gap-1.flex.flex-row.items-center
         [:div.col-span-1 @*property-key]
         [:div.col-span-3.flex.flex-row.pl-6
          (when (not class-schema?)
            (if @*show-new-property-config?
              (ui/dropdown
               (fn [_opts]
                 (pv/property-scalar-value entity property @*property-value (assoc opts :editing? true)))
               (fn [{:keys [toggle-fn]}]
                 [:div.p-6
                  (property-config repo property {:toggle-fn toggle-fn
                                                  :block entity})])
               {:initial-open? true
                :modal-class (util/hiccup->class
                              "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})
              (pv/property-scalar-value entity property @*property-value (assoc opts :editing? true))))]])

      [:div.ls-property-add.h-6
       (select/select {:items (map (fn [x] {:value x}) properties)
                       :dropdown? true
                       :show-new-when-not-exact-match? true
                       :exact-match-exclude-items exclude-properties
                       :sub-modal? page-configure?
                       :input-default-placeholder "Add a property"
                       :on-chosen (fn [{:keys [value]}]
                                    (reset! *property-key value)
                                    (add-property-from-dropdown entity value (assoc opts :*show-new-property-config? *show-new-property-config?)))
                       :input-opts {:on-blur (fn []
                                               (when *configure-show?
                                                 (reset! *configure-show? false))
                                               (pv/exit-edit-property))
                                    :on-key-down
                                    (fn [e]
                                      (case (util/ekey e)
                                        "Escape"
                                        (do
                                          (when *configure-show?
                                            (reset! *configure-show? false))
                                          (pv/exit-edit-property))
                                        nil))}})])))

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
          (and (or (seq properties)
                   (seq (:block/alias block))
                   (seq (:block/tags block)))))
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
    [:div.flex.flex-row.items-center
     (ui/dropdown
      (fn [{:keys [toggle-fn]}]
        [:a.flex {:on-click toggle-fn}
         (or
          (when-let [id (:id icon)]
            (when (= :emoji (:type icon))
              [:em-emoji {:id id}]))
          ;; default property icon
          (ui/icon "letter-p" {:size 16}))])
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
      (fn [{:keys [toggle-fn]}]
        [:a.property-k
         {:data-propertyid (:block/uuid property)
          :data-blockid (:block/uuid block)
          :data-class-schema (boolean class-schema?)
          :title (str "Configure property: " (:block/original-name property))
          :on-click toggle-fn}
         [:div.ml-1 (:block/original-name property)]])
      (fn [{:keys [toggle-fn]}]
        [:div.p-8
         (property-config repo property {:toggle-fn toggle-fn})])
      {:modal-class (util/hiccup->class
                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg")})]))

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
  {:init (fn [state]
           (assoc state ::blocks-container-id (or (:blocks-container-id (last (:rum/args state)))
                                                  (state/next-blocks-container-id))))}
  [state target-block edit-input-id opts]
  (let [block (resolve-instance-page-if-exists target-block)
        properties (if (and (:class-schema? opts) (:block/schema block))
                     (let [properties (:properties (:block/schema block))]
                       (map (fn [k] [k nil]) properties))
                     (:block/properties block))
        alias (set (map :block/uuid (:block/alias block)))
        tags (set (map :block/uuid (:block/tags block)))
        alias-properties (when (seq alias)
                           [[(:block/uuid (db/entity [:block/name "alias"])) alias]])
        tags-properties (when (seq tags)
                          [[(:block/uuid (db/entity [:block/name "tags"])) tags]])
        class-properties (->> (:block/tags block)
                              (mapcat (fn [tag]
                                        (when (= "class" (:block/type tag))
                                          (let [e (db/entity (:db/id tag))]
                                            (:properties (:block/schema e))))))
                              (map (fn [id]
                                     [id nil])))
        built-in-properties (set/difference
                             (set (map name gp-property/db-built-in-properties-keys))
                             #{"alias" "tags"})
        properties (->> (concat (seq tags-properties)
                                (seq alias-properties)
                                (seq properties)
                                class-properties)
                        (util/distinct-by first)
                        (remove (fn [[k _v]]
                                  (when (uuid? k)
                                    (contains? built-in-properties (:block/name (db/entity [:block/uuid k])))))))
        new-property? (or
                       (and (:*configure-show? opts)
                            @(:*configure-show? opts)
                            (empty? properties))
                       (= edit-input-id (state/sub :ui/new-property-input-id)))
        opts (assoc opts :blocks-container-id (::blocks-container-id state))]
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
               (let [block? (= :block (get-in property [:block/schema :type]))]
                 [:div.property-pair
                  [:div.property-key.col-span-1
                   (property-key block property (select-keys opts [:class-schema?]))]
                  (if (:class-schema? opts)
                    [:div.property-description.col-span-3.font-light
                     (get-in property [:block/schema :description])]
                    [:div.property-value.col-span-3.inline-grid.pl-6 (when block?
                                                                       {:style {:margin-left -20}})
                     (pv/property-value block property v opts)])])))))
       (new-property block edit-input-id properties new-property? opts)])))
