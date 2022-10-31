(ns frontend.components.property.schema
  "Block property's schema management"
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.handler.property :as property-handler]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.mixins :as mixins]
            [rum.core :as rum]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.components.search.highlight :as highlight]
            [frontend.components.svg :as svg]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.context.i18n :refer [t]]))

(rum/defc property-item
  [k value]
  [:div.grid.grid-cols-5.gap-1.items-center
   [:label.col-span-1.font-medium.py-2 k]
   value])

(rum/defc schema
  [entity]
  [:div.property-schema
   ;; type
   (property-item (t :schema/type)
                  (ui/select
                    [{:label "Text" :value "text"}
                     {:label "Number" :value "number"}
                     {:label "Date" :value "date"}
                     {:label "Choice" :value "choice"}
                     {:label "Url" :value "url"}
                     {:label "Object" :value "object"}
                     {:label "Any" :value "any"}]
                    (fn [selected]
                      (prn "selected: " selected))
                    "form-select w-32 sm:w-32"))

   ;; icon

   ;; cardinality
   (property-item
    (t :schema/multiple-values)
    (ui/checkbox
     {:checked true
      :on-change (fn [event]
                   (prn "on changed"))}))

   ;; description
   (property-item
    (t :schema/description)
    [:input.form-input.simple-input.block.focus:outline-none.col-span-4
     {:placeholder "Optional"
      :on-blur (fn [e]
                 (prn "on-blur: " (util/evalue e))
                 )
      :on-key-up (fn [e]
                   (prn "on-key-up: " (util/evalue e))
                   (case (util/ekey e)
                     "Enter"
                     (prn "save")

                     "Escape"
                     (prn "clear")

                     nil))}])

   ;; predicates
   ;; integrations
   ])
