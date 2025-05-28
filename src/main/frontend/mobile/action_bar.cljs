(ns frontend.mobile.action-bar
  "Block Action bar, activated when swipe on a block"
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util.url :as url-util]
            [rum.core :as rum]))

(defn- action-command
  [icon description command-handler]
  (let [callback
        (fn []
          (state/set-state! :mobile/show-action-bar? false)
          (editor-handler/clear-selection!))]
    [:button.bottom-action.flex-row
     {:on-click (fn [_event]
                  (command-handler)
                  (callback))}
     (ui/icon icon {:style {:fontSize 23}})
     [:div.description description]]))

(rum/defcs action-bar < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (editor-handler/clear-selection!)
                 (state/set-state! :mobile/show-action-bar? false)))))
  [state]
  (let [blocks (->> (state/get-selection-block-ids)
                    (keep (fn [id]
                            (db/entity [:block/uuid id]))))
        block-ids (map :block/uuid blocks)]
    [:div.action-bar
     [:div.action-bar-commands
      (action-command "copy" "Copy" #(editor-handler/copy-selection-blocks false))
      (action-command "cut" "Cut" #(editor-handler/cut-selection-blocks true))
      (action-command "registered" "Copy ref"
                      (fn [_event] (editor-handler/copy-block-refs)))
      (action-command "link" "Copy url"
                      (fn [_event] (let [current-repo (state/get-current-repo)
                                         tap-f (fn [block-id]
                                                 (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                                     (editor-handler/copy-block-ref! (first block-ids) tap-f))))]]))
