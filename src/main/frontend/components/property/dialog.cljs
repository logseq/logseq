(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [frontend.components.property :as property-component]
            [rum.core :as rum]
            [frontend.modules.shortcut.core :as shortcut]
            [logseq.db :as ldb]))

(rum/defcs dialog <
  shortcut/disable-all-shortcuts
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
