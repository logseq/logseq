(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.block :as component-block]
            [frontend.components.class :as class-component]
            [frontend.components.editor :as editor]
            [frontend.components.property :as property-component]
            [frontend.db :as db]
            [frontend.util :as util]
            [logseq.outliner.property :as outliner-property]
            [rum.core :as rum]))

(rum/defc page-properties
  "This component is called by page-inner and within configure/info modal. This should not
   be displaying properties from both components at the same time"
  < rum/reactive
  [page {:keys [mode configure?]}]
  (let [edit-input-id-prefix (str "edit-block-" (:block/uuid page))
        configure-opts {:selected? false
                        :page-configure? configure?}
        has-viewable-properties? (outliner-property/block-has-viewable-properties? page)]
    (when (or configure? has-viewable-properties?)
      [:div.ls-page-properties
       {:class (util/classnames [{:no-properties (not has-viewable-properties?)}])}
       (if configure?
         (cond
           (= mode :tag)
           (component-block/db-properties-cp {:editor-box editor/box}
                                             page
                                             (str edit-input-id-prefix "-schema")
                                             (assoc configure-opts :class-schema? true))

           (= mode :page)
           (component-block/db-properties-cp {:editor-box editor/box}
                                             page
                                             (str edit-input-id-prefix "-page")
                                             (assoc configure-opts :class-schema? false :page? true)))
         ;; default view for page-inner
         (component-block/db-properties-cp {:editor-box editor/box}
                                           page
                                           (str edit-input-id-prefix "-page")
                                           (assoc configure-opts :class-schema? false :page? true)))])))

(rum/defcs page-configure < rum/reactive
  [state page]
  (let [page-opts {:configure? true}]
    [:div.flex.flex-col.gap-1.pb-4
     (case (:block/type page)
       "property"
       [:div "Configure"]
       ;; (property-component/property-config page {:inline-text component-block/inline-text})

       "class"
       [:div.mt-2.flex.flex-col.gap-2
        (class-component/configure page {:show-title? false})
        (page-properties page (assoc page-opts :mode :tag))])]))

(rum/defcs page-info < rum/reactive
  (rum/local false ::hover?)
  [state page]
  (let [page (db/sub-block (:db/id page))
        type (:block/type page)]
    (when (contains? #{"class" "property"} type)
      [:div.page-info.border.rounded
       [:div.px-4.py-2
        (page-configure page)]])))
