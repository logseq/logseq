(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.property.config :as property-config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.util :as util]))

(rum/defc configure-property < rum/reactive db-mixins/query
  [page]
  (let [page (db/sub-block (:db/id page))]
    (shui/tabs-trigger
     {:value "configure"
      :class "py-1 text-xs"
      :on-pointer-down (fn [e]
                         (util/stop e))
      :on-click (fn [^js e]
                  (shui/popup-show! (.-target e)
                                    (fn []
                                      (property-config/dropdown-editor page nil {:debug? (.-altKey e)}))
                                    {:content-props {:class "ls-property-dropdown-editor as-root"}
                                     :align "start"
                                     :as-dropdown? true}))}
     "Configure property")))
