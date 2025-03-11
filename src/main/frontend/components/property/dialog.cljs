(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [frontend.components.property :as property-component]
            [frontend.db :as db]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [rum.core :as rum]))

(rum/defcs dialog <
  shortcut/disable-all-shortcuts
  (rum/local nil ::property-value)
  {:init (fn [state]
           (let [opts (last (:rum/args state))
                 k (:property-key opts)]
             (when-let [view-selected-blocks (:selected-blocks opts)]
               (state/set-state! :view/selected-blocks view-selected-blocks))
             (assoc state
                    ::property-key (atom k)
                    ::property (atom (when k (db/get-case-page k))))))
   :will-unmount (fn [state]
                   (when-let [close-fn (:on-dialog-close (last (:rum/args state)))]
                     (close-fn))
                   (state/set-state! :view/selected-blocks nil)
                   state)}
  [state blocks opts]
  (when (seq blocks)
    (let [*property-key (::property-key state)
          *property (::property state)
          block (first blocks)]
      [:div.ls-property-dialog
       (property-component/property-input block *property-key (assoc opts :*property *property))])))
