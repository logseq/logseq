(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [rum.core :as rum]
            [frontend.components.property :as property-component]))

(rum/defcs dialog <
  (rum/local nil ::property-value)
  {:init (fn [state]
           (assoc state ::property-key (atom (:property-key (last (:rum/args state))))))}
  [state blocks opts]
  (let [*property-key (::property-key state)]
    [:div.ls-property-dialog
     (property-component/property-input (first blocks) *property-key opts)]))
