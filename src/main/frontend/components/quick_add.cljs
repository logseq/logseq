(ns frontend.components.quick-add
  "Quick add"
  (:require [frontend.components.page :as page]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc quick-add <
  {:will-mount (fn [state]
                 (state/clear-selection!)
                 state)
   :will-unmount (fn [state]
                   (state/clear-edit!)
                   (state/clear-selection!)
                   state)}
  []
  (when (db/get-page (date/today))
    (when-let [add-page (ldb/get-built-in-page (db/get-db) common-config/quick-add-page-name)]
      (let [mobile? (util/mobile?)]
        [:div.ls-quick-capture.flex.flex-1.flex-col.w-full.gap-4
         [:div.font-medium.border-b.pb-4
          {:class (when-not mobile? "text-xs")}
          "Quick add"]
         [:div.content
          {:class (if mobile?
                    "flex flex-1 flex-col w-full"
                    "block -ml-6")}
          (page/page-blocks-cp add-page {})]
         [:div
          (shui/button
           {:variant (if mobile? :default :outline)
            :size :sm
            :on-click (fn [_e]
                        (editor-handler/quick-add-blocks!))}
           (when-not mobile? (shui/shortcut ["mod" "e"]))
           "Add to today")]]))))
