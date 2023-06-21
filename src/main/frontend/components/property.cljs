(ns frontend.components.property
  "Block properties management."
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.handler.property :as property-handler]
            [frontend.db :as db]
            [rum.core :as rum]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.search :as search]
            ;; [frontend.components.search.highlight :as highlight]
            [frontend.components.svg :as svg]
            [frontend.modules.shortcut.core :as shortcut]
            [medley.core :as medley]
            [clojure.edn :as edn]))

(rum/defcs property-class-config <
  rum/static
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[repo property-uuid] (:rum/args state)]
                   (reset! (::property-name state) (:property/name (db/pull repo '[*] [:block/uuid property-uuid])))
                   (reset! (::property-schema state) (:property/schema (db/pull repo '[*] [:block/uuid property-uuid])))
                   state))}
  [state repo property-uuid]
  (let [*property-name (::property-name state)
        *property-schema (::property-schema state)]
    [:div
     [:div
      [:span.mr-8 "property name:"]
      [:input
       {:on-change #(reset! *property-name (util/evalue %))
        :value @*property-name}]]
     [:div
      [:span.mr-8 "property schema:"]
      [:input
       {:on-change #(reset! *property-schema (util/evalue %))
        :value (str @*property-schema)}]]
     [:a
      {:on-click (fn []
                   (property-handler/update-property-class!
                    repo property-uuid
                    {:property-name @*property-name
                     :property-schema (edn/read-string @*property-schema)}))}
      "Save"]]))

(rum/defcs properties-area <
  rum/reactive
  (rum/local nil ::properties)
  (rum/local nil ::property-key)
  (rum/local nil ::property-value)
  {:will-mount (fn [state]
                 (reset! (::properties state) (second (:rum/args state)))
                 state)}
  [state block _properties edit-input-id]
  (let [new-property? (state/sub edit-input-id :path-in-sub-atom :ui/new-property)
        *properties (::properties state)
        *property-key (::property-key state)
        *property-value (::property-value state)
        repo (state/get-current-repo)]
    [:div.ls-properties-area.pl-6
     (when (seq @*properties)
       [:div
        (for [[prop-uuid-or-built-in-prop v] @*properties]
          (if (and (string? prop-uuid-or-built-in-prop)
                   (util/uuid-string? prop-uuid-or-built-in-prop))
            (when-let [property-class (db/pull [:block/uuid (uuid prop-uuid-or-built-in-prop)])]
              [:div
               [:a.mr-2
                {:on-click (fn [] (state/set-modal! #(property-class-config repo (uuid prop-uuid-or-built-in-prop))))}
                (:property/name property-class)]
               [:span v]
               [:a.ml-8 {:on-click
                         (fn []
                           (property-handler/remove-property! repo block prop-uuid-or-built-in-prop)
                           (reset! *properties (:block/properties (db/pull [:block/uuid (:block/uuid block)]))))}
                "DEL"]])
            ;; builtin
            [:div
             [:a.mr-2 (str prop-uuid-or-built-in-prop)]
             [:span v]]))])
     (cond
       new-property?
       [:div
        [:input.block-properties {:on-change #(reset! *property-key (util/evalue %))}]
        [:input.block-properties {:on-change #(reset! *property-value (util/evalue %))}]
        [:a {:on-click (fn []
                         (when (and @*property-key @*property-value)
                           (property-handler/add-property! repo block @*property-key @*property-value)
                           (reset! *properties (:block/properties (db/pull [:block/uuid (:block/uuid block)]))))
                         (reset! *property-key nil)
                         (reset! *property-value nil))}
         "Save"]]

       (seq @*properties)
       [:a {:title "Add another value"
            :on-click (fn []
                        (state/set-state! edit-input-id true :path-in-sub-atom :ui/new-property)
                        (reset! *property-key nil)
                        (reset! *property-value nil))}
        (ui/icon "circle-plus")])]))
