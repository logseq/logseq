(ns frontend.components.quick-add
  "Quick add"
  (:require [frontend.components.page :as page]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.db.core :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(hsx/defc page-blocks
  [page]
  (let [[scroll-container set-scroll-container] (hooks/use-state nil)
        *ref (hooks/use-ref nil)]
    (hooks/use-effect!
     #(set-scroll-container (hooks/deref *ref))
     [])
    [:div.content-inner
     {:ref *ref}
     (when scroll-container
       (page/page-blocks-cp page {:scroll-container scroll-container}))]))

(hsx/defc quick-add
  []
  (hooks/use-effect!
   (fn []
     (state/clear-selection!)
     (when-not (util/mobile?)
       (editor-handler/quick-add-open-last-block!))
     #(state/clear-selection!))
   [])
  (when (model/get-today-journal-page)
    (when-let [add-page (ldb/get-built-in-page (db/get-db) melange-common/quick-add-page-name)]
      (let [mobile? (util/mobile?)
            add-button [:div
                        (shui/button
                         {:variant :default
                          :size :sm
                          :on-click (fn [_e]
                                      (editor-handler/quick-add-blocks!))}
                         (when-not mobile? (shui/shortcut ["mod" "e"]))
                         (t :editor.quick-add/add-to-today))]]
        [:div.ls-quick-add.flex.flex-1.flex-col.w-full.gap-4
         (when-not mobile?
           [:div.flex.flex-row.justify-between.gap-4.items-center
            {:class "border-b pb-4"}
            [:div.font-medium
             (t :editor.quick-add/title)]])
         (if mobile?
           [:div.w-full.mt-4
            (page-blocks add-page)]
           [:div.content {:class "block -ml-6"}
            (page-blocks add-page)])
         (when-not mobile? add-button)]))))
