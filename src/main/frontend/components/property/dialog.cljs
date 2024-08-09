(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [frontend.components.property :as property-component]
            [rum.core :as rum]
            [frontend.modules.shortcut.core :as shortcut]
            [logseq.db :as ldb]
            [frontend.db :as db]))

(rum/defcs dialog <
  shortcut/disable-all-shortcuts
  (rum/local nil ::property-value)
  {:init (fn [state]
           (let [k (:property-key (last (:rum/args state)))]
             (assoc state
                    ::property-key (atom k)
                    ::property (atom (when k (db/get-case-page k))))))}
  [state blocks opts]
  (when (seq blocks)
    (let [*property-key (::property-key state)
          *property (::property state)
          block (first blocks)
          page? (ldb/page? block)]
      [:div.ls-property-dialog
       (property-component/property-input block *property-key (assoc opts
                                                                     :*property *property
                                                                     :page? page?))])))
