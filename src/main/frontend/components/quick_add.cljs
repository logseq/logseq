(ns frontend.components.quick-add
  "Quick add"
  (:require [frontend.components.page :as page]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
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
      [:div.ls-quick-capture.flex.flex-1.flex-col.w-full.gap-4
       [:div.font-medium.text-xl.border-b.pb-4
        "Quick add"]
       [:div.block.-ml-6.content
        (page/page-blocks-cp add-page {})]
       [:div.flex.flex-row.gap-2.items-center
        [:div
         (shui/button
          {:variant :outline
           :size :sm
           :on-click (fn [_e]
                       (editor-handler/quick-add-blocks!))}
          (shui/shortcut ["mod" "e"])
          "Add to today")]]])))
