(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [rum.core :as rum]
            [frontend.components.property :as property-component]))

(rum/defcs dialog <
  (rum/local nil ::property-value)
  {:init (fn [state]
           (assoc state ::property-key (atom (:property-key (last (:rum/args state))))))}
  [state block opts]
  (let [*property-key (::property-key state)
        *property-value (::property-value state)]
    [:div.ls-property-dialog
     (property-component/property-input block *property-key *property-value opts)]))
