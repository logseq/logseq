(ns frontend.components.bottom-bar
  "Bottom bar for editor's status, the general rule is to avoid using this
  to present user a simple and clean UI."
  (:require [frontend.ui :as ui]
            [frontend.state :as state]
            [rum.core :as rum]
            [frontend.db :as db]
            [frontend.modules.editor.undo-redo :as undo-redo]))

(rum/defc bar < rum/reactive
  []
  (let [page-only-mode? (state/sub :history/page-only-mode?)
        undo-page-id    (state/sub :history/page)]
    (when (and page-only-mode? undo-page-id)
      [:div#ls-bottom-bar
       [:div.items
        (when undo-page-id
          [:div.item.flex.items-center
           (str "Undo: " (:block/original-name (db/entity undo-page-id)))
           [:a.inline-flex.ml-1 {:on-click undo-redo/toggle-undo-redo-mode!}
            (ui/icon "x")]])]])))
