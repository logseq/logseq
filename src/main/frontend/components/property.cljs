(ns frontend.components.property
  "Block properties management."
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.db :as db]
            [frontend.config :as config]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.components.search.highlight :as highlight]
            [frontend.components.svg :as svg]
            [frontend.modules.shortcut.core :as shortcut]
            [medley.core :as medley]))

(rum/defcs property-config <
  rum/static
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[repo property] (:rum/args state)]
                   (reset! (::property-name state) (:block/original-name property))
                   (reset! (::property-schema state) (:block/schema property))
                   state))}
  [state repo property]
  (let [*property-name (::property-name state)
        *property-schema (::property-schema state)]
    [:div.property-configure
     [:h1.title "Configure property"]

     [:div.grid.gap-2.p-1
      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.cols-1 "Name:"]
       [:input.form-input
        {:on-change #(reset! *property-name (util/evalue %))
         :value @*property-name}]]

      [:div.grid.grid-cols-4.gap-1.leading-8
       [:label.cols-1 "Schema type:"]
       (let [schema-types (->> (keys property-handler/builtin-schema-types)
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

      [:div.grid.grid-cols-4.gap-1.items-center.leading-8
       [:label.cols-1 "Multiple values:"]
       (let [many? (boolean (= :many (:cardinality @*property-schema)))]
         (ui/checkbox {:checked many?
                       :on-change (fn []
                                    (swap! *property-schema assoc :cardinality (if many? :one :many)))}))]

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
         [:code
          (str property)]])]]))

(rum/defc search-item-render
  [search-q content]
  [:div.font-medium
   (highlight/highlight-exact-query content search-q)])

(defn- exit-edit-property
  [*property-key *property-value]
  (reset! *property-key nil)
  (reset! *property-value nil)
  (property-handler/set-editing-new-property! nil))

(defn- add-property!
  [block *property-key *property-value]
  (let [repo (state/get-current-repo)]
    (when (and @*property-key @*property-value)
      (property-handler/add-property! repo block @*property-key @*property-value))
    (exit-edit-property *property-key *property-value)))

(rum/defcs property-key-input < rum/reactive
  (rum/local true ::search?)
  shortcut/disable-all-shortcuts
  [state entity *property-key *property-value]
  (let [*search? (::search? state)
        entity-properties (->> (keys (:block/properties entity))
                               (map #(:block/original-name (db/entity [:block/uuid %])))
                               (set))
        result (when-not (string/blank? @*property-key)
                 (->> (search/property-search @*property-key)
                      (remove entity-properties)))]
    [:div
     [:div.ls-property-add.grid.grid-cols-4.gap-1.flex.flex-row.items-center
      [:input#add-property.form-input.simple-input.block.col-span-1.focus:outline-none
       {:placeholder "Property key"
        :value (rum/react *property-key)
        :auto-focus true
        :on-change (fn [e]
                     (reset! *property-key (util/evalue e))
                     (reset! *search? true))
        :on-key-down (fn [e]
                       (case (util/ekey e)
                         "Escape"
                         (exit-edit-property *property-key *property-value)

                         (list "Tab" "Enter")
                         (do
                           (util/stop e)
                           (reset! *search? false)
                           (.focus (js/document.getElementById "add-property-value")))

                         nil))}]

      [:input#add-property-value.form-input.simple-input.block.col-span-1.focus:outline-none
       {:placeholder "Value"
        :on-change #(reset! *property-value (util/evalue %))
        :on-key-down (fn [e]
                       (case (util/ekey e)
                         "Enter"
                         (do
                           (add-property! entity *property-key *property-value)
                           (reset! *search? false))

                         nil))}]

      [:a.close {:on-mouse-down #(exit-edit-property *property-key *property-value)}
       svg/close]]
     (when @*search?
       (ui/auto-complete
        result
        {:class "search-results"
         :on-chosen (fn [chosen]
                      (reset! *property-key chosen)
                      (reset! *search? false)
                      (.focus (js/document.getElementById "add-property-value")))
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
      :node (js/document.getElementById "edit-new-property"))))
  [state repo block edit-input-id properties new-property?]
  (let [*property-key (::property-key state)
        *property-value (::property-value state)]
    (cond
      new-property?
      [:div#edit-new-property
       (property-key-input block *property-key *property-value)]

      (seq properties)
      [:a {:title "Add another property"
           :on-click (fn []
                       (property-handler/set-editing-new-property! edit-input-id)
                       (reset! *property-key nil)
                       (reset! *property-value nil))}
       [:div.block {:style {:height      20
                            :width       20}}
        [:a.add-button-link.block {:title "Add another value"
                                   :style {:margin-left -4}}
         (ui/icon "circle-plus")]]])))

(rum/defcs property-key < (rum/local false ::show-close?)
  [state block property]
  (let [repo (state/get-current-repo)
        *show-close? (::show-close? state)]
    [:div.relative
     {:on-mouse-over (fn [_] (reset! *show-close? true))
      :on-mouse-out (fn [_] (reset! *show-close? false))}
     [:a.mr-2
      {:title (str "Configure property: " (:block/original-name property))
       :on-click (fn [] (state/set-modal! #(property-config repo property)))}
      (:block/original-name property)]
     (when @*show-close?
       [:div.absolute.top-0.right-0
        [:a.fade-link.fade-in.py-2.px-1
         {:title "Remove this property"
          :on-click (fn [_e]
                      (property-handler/remove-property! repo block (:block/uuid property)))}
         (ui/icon "x")]])]))

(rum/defcs multiple-value-item < (rum/local false ::show-close?)
  [state entity property item dom-id' editor-id' {:keys [edit-fn page-cp inline-text]}]
  (let [*show-close? (::show-close? state)
        object? (= :object (:type (:block/schema property)))
        block (when object? (db/pull [:block/uuid item]))]
    [:div.flex.flex-1.flex-row {:on-mouse-over #(reset! *show-close? true)
                                :on-mouse-out  #(reset! *show-close? false)}
     [:div.flex.flex-1.property-value-content
      {:id dom-id'
       :on-click (fn []
                   ;; (edit-fn editor-id' dom-id' item)
                   )}
      (if block
        ;; TODO: page/block
        (str block)
        (inline-text {} :markdown (str item)))]
     (when @*show-close?
       [:a.close.fade-in
        {:title "Delete this value"
         :on-mouse-down
         (fn []
           (property-handler/delete-property-value! (state/get-current-repo)
                                                    entity
                                                    (:block/uuid property)
                                                    item))}
        svg/close])]))

;; (add-property! block *property-key *property-value)
(rum/defcs property-value < rum/reactive
  [state block property {:keys [inline-text editor-box page-cp]}]
  (let [k (:block/uuid property)
        v (get (:block/properties-text-values block)
               k
               (get (:block/properties block) k))
        dom-id (str "ls-property-" k)
        editor-id (str "ls-property-" (:db/id property) "-" k)
        editing? (state/sub [:editor/editing? editor-id])
        schema (:block/schema property)
        edit-fn (fn [editor-id id v]
                  (let [v (str v)
                        cursor-range (util/caret-range (gdom/getElement (or id dom-id)))]
                    (state/set-editing! editor-id v property cursor-range)

                    (js/setTimeout
                     (fn []
                       (state/set-editor-action-data! {:block property
                                                       :pos 0})
                       (state/set-editor-action! :property-value-search))
                     50)))
        multiple-values? (= :many (:cardinality schema))
        type (:type schema)
        editor-args {:block property
                     :parent-block block
                     :format :markdown}]
    (cond
      multiple-values?
      (let [v' (if (coll? v) v (when v [v]))
            v' (if (seq v') v' [""])
            editor-id' (str editor-id (count v'))
            new-editing? (state/sub [:editor/editing? editor-id'])]
        [:div.flex.flex-1.flex-col
         [:div.flex.flex-1.flex-col
          (for [[idx item] (medley/indexed v')]
            (let [dom-id' (str dom-id "-" idx)
                  editor-id' (str editor-id idx)
                  editing? (state/sub [:editor/editing? editor-id'])]
              (if editing?
                (editor-box editor-args editor-id' {})
                (multiple-value-item block property item dom-id' editor-id' {:page-cp page-cp
                                                                             :edit-fn edit-fn
                                                                             :inline-text inline-text}))))

          (let [fv (first v')]
            (when (and (not new-editing?)
                       fv
                       (or (and (string? fv) (not (string/blank? fv)))
                           (and (not (string? fv)) (some? fv))))
              [:div.rounded-sm.ml-1
               {:on-click (fn []
                            (edit-fn (str editor-id (count v')) nil ""))}
               [:div.flex.flex-row
                [:div.block {:style {:height      20
                                     :width       20}}
                 [:a.add-button-link.block {:title "Add another value"
                                            :style {:margin-left -4}}
                  (ui/icon "circle-plus")]]]]))]
         (when new-editing?
           (editor-box editor-args editor-id' {}))])

      editing?
      (editor-box editor-args editor-id {})

      :else
      [:div.flex.flex-1.property-value-content
       {:id dom-id
        :on-click (fn []
                    (edit-fn editor-id nil v))}
       (cond
         (and (= type :date) (string/blank? v))
         [:div "TBD (date icon)"]

         :else
         (when-not (string/blank? (str v))
           (inline-text {} :markdown (str v))))])))

(rum/defc properties-area < rum/reactive
  [block properties properties-text-values edit-input-id block-components-m]
  (let [repo (state/get-current-repo)
        new-property? (= edit-input-id (state/sub :ui/new-property-input-id))]
    (when (or (seq properties) new-property?)
      [:div.ls-properties-area
      (when (seq properties)
        [:div
         (for [[prop-uuid-or-built-in-prop v] properties]
           (if (uuid? prop-uuid-or-built-in-prop)
             (when-let [property (db/sub-block (:db/id (db/entity [:block/uuid prop-uuid-or-built-in-prop])))]
               [:div.grid.grid-cols-4.gap-1
                [:div.property-key.col-span-1
                 (property-key block property)]
                [:div.property-value.col-span-3
                 (property-value block property block-components-m)]])
             ;; TODO: built in properties should have UUID and corresponding schema
             ;; builtin
             [:div
              [:a.mr-2 (str prop-uuid-or-built-in-prop)]
              [:span v]]))])
       (new-property repo block edit-input-id properties new-property?)])))
