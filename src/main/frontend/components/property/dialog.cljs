(ns frontend.components.property.dialog
  "Property && value choose"
  (:require [frontend.components.property :as property-component]
            [frontend.db.async :as db-async]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [logseq.db.frontend.property :as db-property]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- built-in-property
  [ident]
  (when-let [{:keys [title schema closed-values]} (get db-property/built-in-properties ident)]
    (cond-> {:db/id ident
             :db/ident ident
             :block/title title
             :logseq.property/type (:type schema)}
      (seq closed-values)
      (assoc :property/closed-values closed-values))))

(hsx/defc dialog
  [blocks opts]
  (shortcut/use-disable-all-shortcuts!)
  (let [has-blocks? (seq blocks)
        k (:property-key opts)
        *property-key (hooks/use-memo #(atom k) [k])
        *property (hooks/use-memo #(atom (when (keyword? k) (built-in-property k))) [k])
        block (first blocks)]
    (hooks/use-effect!
     (fn []
       (when k
         (p/let [repo (state/get-current-repo)
                 initial-property (when (keyword? k) (built-in-property k))
                 property (if (keyword? k)
                            (state/<invoke-db-worker :thread-api/pull repo '[*] k)
                            (db-async/<get-case-page repo k))]
           (when property
             (reset! *property (merge initial-property property))))))
     [k])
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
