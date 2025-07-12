(ns frontend.components.quick-add
  "Quick add"
  (:require [frontend.components.page :as page]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
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
                   state)
   :did-mount (fn [state]
                (when-not (util/mobile?)
                  (editor-handler/quick-add-open-last-block!))
                state)}
  []
  (when (model/get-journal-page (date/today))
    (when-let [add-page (ldb/get-built-in-page (db/get-db) common-config/quick-add-page-name)]
      (let [mobile? (util/mobile?)
            add-button [:div
                        (shui/button
                         {:variant :default
                          :size :sm
                          :on-click (fn [_e]
                                      (editor-handler/quick-add-blocks!))}
                         (when-not mobile? (shui/shortcut ["mod" "e"]))
                         "Add to today")]]
        [:div.ls-quick-add.flex.flex-1.flex-col.w-full.gap-4
         [:div.border-b.pb-4.flex.flex-row.justify-between.gap-4.items-center
          [:div.font-medium
           "Quick add"]
          (when mobile? add-button)]
         [:div.content
          {:class (if mobile?
                    "flex flex-1 flex-col w-full"
                    "block -ml-6")}
          (page/page-blocks-cp add-page {})]
         (when-not mobile? add-button)]))))
