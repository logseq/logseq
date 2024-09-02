(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.property.config :as property-config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc configure-property < rum/reactive db-mixins/query
  [page]
  (let [page (db/sub-block (:db/id page))]
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
      "Configure property")]))
