(ns frontend.mobile.action-bar
  (:require
   [frontend.db :as db]
   [frontend.extensions.srs :as srs]
   [frontend.handler.editor :as editor-handler]
   [frontend.mixins :as mixins]
   [frontend.state :as state]
   [frontend.ui :as ui]
   [frontend.util :as util]
   [frontend.util.url :as url-util]
   [goog.dom :as gdom]
   [goog.object :as gobj]
   [rum.core :as rum]
   [logseq.graph-parser.util.block-ref :as block-ref]
   [frontend.mobile.util :as mobile-util]))

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
  (when-let [block (state/sub :mobile/actioned-block)]
    (let [{:block/keys [uuid children]} block
          last-child-block-id (when-not (empty? children)
                                (->> (db/get-block-children (state/get-current-repo) uuid)
                                     (filter #(not (db/parents-collapsed? (state/get-current-repo) (:block/uuid %1)))) ;; DOM nodes of blocks the have collapsed parents have no bounding client rect
                                     last
                                     :block/uuid))]

      ;; scroll to the most bottom element of the selected block
      (let [tag-id (or last-child-block-id uuid)
            bottom-el (gdom/getElement (str "block-content-" tag-id))
            bottom (gobj/get (.getBoundingClientRect bottom-el) "bottom")
            vw-height (or (.-height js/window.visualViewport)
                          (.-clientHeight js/document.documentElement))
            delta (- vw-height bottom 170)]
        (when (< delta 0)
          (.scrollBy (util/app-scroll-container-node) #js {:top (- 10 delta)})))
      [:div.action-bar
       [:div.action-bar-commands
        (action-command "infinity" "Card" #(srs/make-block-a-card! (:block/uuid block)))
        (action-command "copy" "Copy" #(editor-handler/copy-selection-blocks false))
        (action-command "cut" "Cut" #(editor-handler/cut-selection-blocks true))
        (action-command "trash" "Delete" #(editor-handler/delete-block-aux! block true))
        (action-command "registered" "Copy ref"
                        (fn [_event] (editor-handler/copy-block-ref! uuid block-ref/->block-ref)))
        (action-command "link" "Copy url"
                        (fn [_event] (let [current-repo (state/get-current-repo)
                                           tap-f (fn [block-id]
                                                   (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                                       (editor-handler/copy-block-ref! uuid tap-f))))
        (when (mobile-util/native-ipad?)
          (action-command "text-direction-ltr" "Right sidebar"
                          (fn [_event]
                            (let [current-repo (state/get-current-repo)]
                              (state/sidebar-add-block! current-repo uuid :block-ref)))))]])))
