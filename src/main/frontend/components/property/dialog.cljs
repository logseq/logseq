(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [rum.core :as rum]
            [frontend.components.property :as property-component]
            [logseq.db :as ldb]))

(rum/defcs dialog <
  (rum/local nil ::property-value)
  {:init (fn [state]
           (assoc state ::property-key (atom (:property-key (last (:rum/args state))))))}
  [state blocks opts]
  (when (seq blocks)
    (let [*property-key (::property-key state)
          block (first blocks)
          page? (ldb/page? block)]
      [:div.ls-property-dialog
       (property-component/property-input block *property-key (assoc opts :page? page?))])))
