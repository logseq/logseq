(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.property.config :as property-config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc configure-property
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
                                      (property-config/property-dropdown page nil {:debug? (.-altKey e)}))
                                    {:content-props {:class "ls-property-dropdown as-root"}
                                     :align "start"
                                     :as-dropdown? true
                                     :dropdown-menu? true}))}
     (t :property/configure))))
