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
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [mobile.components.ui :as mobile-ui]
            [rum.core :as rum]))

(rum/defc page-blocks
  [page]
  (let [[scroll-container set-scroll-container] (rum/use-state nil)
        *ref (rum/use-ref nil)]
    (hooks/use-effect!
     #(set-scroll-container (rum/deref *ref))
     [])
    [:div.content-inner
     {:ref *ref}
     (when scroll-container
       (page/page-blocks-cp page {:scroll-container scroll-container}))]))

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
         (if mobile?
           (mobile-ui/classic-app-container-wrap
            (page-blocks add-page))
           [:div.content {:class "block -ml-6"}
            (page-blocks add-page)])
         (when-not mobile? add-button)]))))
