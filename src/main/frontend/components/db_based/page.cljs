(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.block :as component-block]
            [frontend.components.editor :as editor]
            [frontend.components.property.config :as property-config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.util :as util]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.ui :as shui]
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

(rum/defc page-info < rum/reactive db-mixins/query
  [page]
  (let [page (db/sub-block (:db/id page))
        type (:block/type page)]
    (case type
      "property"
      [:div.pb-4.-ml-1
       (shui/button
        {:variant "ghost"
         :class "opacity-50 hover:opacity-90"
         :size :sm
         :on-click (fn [^js e]
                     (shui/popup-show! (.-target e)
                                       (fn []
                                         (property-config/dropdown-editor page nil {:debug? (.-altKey e)}))
                                       {:content-props {:class "ls-property-dropdown-editor as-root"}
                                        :align "start"
                                        :as-dropdown? true}))}
        "Configure property")]

      nil)))
