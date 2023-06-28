(ns frontend.components.property
  "Block properties management."
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.property :as property-handler]
            [frontend.db :as db]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [clojure.edn :as edn]))

(rum/defcs property-class-config <
  rum/static
  (rum/local nil ::property-name)
  (rum/local nil ::property-schema)
  {:will-mount (fn [state]
                 (let [[repo property-uuid] (:rum/args state)]
                   (reset! (::property-name state) (:block/name (db/pull repo '[*] [:block/uuid property-uuid])))
                   (reset! (::property-schema state) (:block/schema (db/pull repo '[*] [:block/uuid property-uuid])))
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
          (if (and (string? prop-uuid-or-built-in-prop)
                   (util/uuid-string? prop-uuid-or-built-in-prop))
            (when-let [property-class (db/pull [:block/uuid (uuid prop-uuid-or-built-in-prop)])]
              [:div
               [:a.mr-2
                {:on-click (fn [] (state/set-modal! #(property-class-config repo (uuid prop-uuid-or-built-in-prop))))}
                (:block/name property-class)]
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
