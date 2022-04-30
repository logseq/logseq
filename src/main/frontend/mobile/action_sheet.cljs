(ns frontend.mobile.action-sheet
  (:require [frontend.extensions.srs :as srs]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
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
                 (state/set-state! :mobile/show-action-bar? false)
                 (editor-handler/clear-selection!)))))
  [state]
  (when-let [block (state/sub :mobile/actioned-block)]
    (let [block-id   (:block/uuid block)]
      [:div.fixed.action-bar
       (when-not (= (:block/format block) :org)
         (action-command "heading" "Heading"
                         #(let [properties (:block/properties block)
                                heading?   (true? (:heading properties))]
                            (if heading?
                              (editor-handler/remove-block-property! block-id :heading)
                              (editor-handler/set-block-property! block-id :heading true)))))

       (action-command "infinity" "Card" #(srs/make-block-a-card! (:block/uuid block)))
       (action-command "copy" "Copy" #(editor-handler/copy-selection-blocks))
       (action-command "registered" "Copy ref"
                       (fn [_event] (editor-handler/copy-block-ref! block-id #(str "((" % "))"))))
       (action-command "cut" "Cut" #(editor-handler/cut-selection-blocks true))
       (action-command "trash" "Delete" #(editor-handler/delete-block-aux! block true))])))
