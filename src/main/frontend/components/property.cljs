(ns frontend.components.property
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.handler.property :as property-handler]
            [frontend.db :as db]))

(defn properties
  [entity]
  (let [properties (:block/properties entity)
        inherited-from-pages (:block/inherit-from entity)]
    [:div.ls-properties-area
     [:div
      (for [[k v] properties]
        (let [key (:block/original-name (db/entity [:block/uuid k]))]
          [:div.grid.grid-cols-4.gap-4
           [:div.property-key.col-span-1 key]
           [:div.property-value.col-span-2 v]]))]

     (for [page inherited-from-pages]
       (let [page (db/entity (:db/id page))]
         [:div.inherited-properties.py-4
          [:div.text-2xl.py-2 (str "Inherited from: " (:block/original-name page))]
          (for [[k v] (:block/properties page)]
            (let [key (:block/original-name (db/entity [:block/uuid k]))]
              [:div.grid.grid-cols-4.gap-4
               [:div.property-key.col-span-1 key]
               [:div.property-value.col-span-2 v]]))]))

     [:div.ls-property-add.grid.grid-cols-4.gap-4
      [:input.form-input.block.col-span-1
       {:placeholder "Key"
        :on-blur (fn [e]
                   (let [k (util/evalue e)]
                     (when-not (string/blank? k)
                       (property-handler/add-property! (:db/id entity) k))))
        :on-change (fn [e])}]
      [:input.form-input.block.col-span-2
       {:placeholder "Value"
        :on-blur (fn [e])
        :on-change (fn [e])}]]]))
