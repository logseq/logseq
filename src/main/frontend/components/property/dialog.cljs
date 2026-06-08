(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [frontend.components.property :as property-component]
            [frontend.db :as db]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc dialog
  [blocks opts]
  (shortcut/use-disable-all-shortcuts!)
  (let [has-blocks? (seq blocks)
        k (:property-key opts)
        *property-key (hooks/use-memo #(atom k) [k])
        *property (hooks/use-memo #(atom (when k (db/get-case-page k))) [k])
        block (first blocks)]
    (hooks/use-effect!
     (fn []
       (when has-blocks?
         (when-let [view-selected-blocks (:selected-blocks opts)]
           (state/set-state! :view/selected-blocks view-selected-blocks))
         (state/set-state! :ui/show-property-dialog? true)
         #(do
            (when-let [close-fn (:on-dialog-close opts)]
              (close-fn))
            (state/set-state! :view/selected-blocks nil)
            (state/set-state! :ui/show-property-dialog? false))))
     [has-blocks?])
    (when has-blocks?
      [:div.ls-property-dialog
       (property-component/property-input block *property-key (assoc opts :*property *property))])))
