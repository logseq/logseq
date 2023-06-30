(ns frontend.components.property
  "Block properties management."
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.db :as db]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [clojure.edn :as edn]
            [clojure.string :as string]))

(rum/defcs property-config <
  rum/static
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[repo property-uuid] (:rum/args state)
                       property (db/pull repo '[*] [:block/uuid property-uuid])]
                   (reset! (::property-name state) (:block/name property))
                   (reset! (::property-schema state) (:block/schema property))
                   state))}
  [state repo property-uuid]
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
      (ui/checkbox {:checked (= :many (:cardinality @*property-schema))
                    :on-change (fn [v]
                                 (swap! *property-schema assoc :cardinality (if (= "on" (util/evalue v)) :many :one)))})]

     [:div
      (ui/button
        "Save"
        :on-click (fn []
                    (property-handler/update-property!
                     repo property-uuid
                     {:property-name @*property-name
                      :property-schema @*property-schema})
                    (state/close-modal!)))]]]))

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
  [state repo block edit-input-id properties]
  (let [new-property? (= edit-input-id (state/sub :ui/new-property-input-id))
        *property-key (::property-key state)
        *property-value (::property-value state)]
    (cond
      new-property?
      [:div#edit-new-property
       [:input.block-properties {:on-change #(reset! *property-key (util/evalue %))}]
       [:input.block-properties {:on-change #(reset! *property-value (util/evalue %))}]
       [:a {:on-click (fn []
                        (when (and @*property-key @*property-value)
                          (property-handler/add-property! repo block @*property-key @*property-value))
                        (reset! *property-key nil)
                        (reset! *property-value nil)
                        (property-handler/set-editing-new-property! nil))}
        "Save"]]

      (seq properties)
      [:a {:title "Add another value"
           :on-click (fn []
                       (property-handler/set-editing-new-property! edit-input-id)
                       (reset! *property-key nil)
                       (reset! *property-value nil))}
       (ui/icon "circle-plus")])))

(rum/defc properties-area < rum/static
  [block properties properties-text-values edit-input-id]
  (let [repo (state/get-current-repo)]
    [:div.ls-properties-area.pl-6
     (when (seq properties)
       [:div
        (for [[prop-uuid-or-built-in-prop v] properties]
          (if (uuid? prop-uuid-or-built-in-prop)
            (when-let [property (db/pull [:block/uuid prop-uuid-or-built-in-prop])]
              [:div
               [:a.mr-2
                {:on-click (fn [] (state/set-modal! #(property-config repo prop-uuid-or-built-in-prop)))}
                (:block/name property)]
               [:span (or (get properties-text-values prop-uuid-or-built-in-prop) (str v))]
               [:a.ml-8 {:on-click
                         (fn []
                           (property-handler/remove-property! repo block prop-uuid-or-built-in-prop))}
                "DEL"]])
            ;; builtin
            [:div
             [:a.mr-2 (str prop-uuid-or-built-in-prop)]
             [:span v]]))])
     (new-property repo block edit-input-id properties)]))
