(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]))

(defn did-mount!
  [state]
  (let [[{:keys [block-parent-id]} id] (:rum/args state)
        content (state/get-edit-content)]
    (when block-parent-id
      (state/set-editing-block-dom-id! block-parent-id))
    ;; FIXME: remove ugly :editor/property-triggered-by-click?
    (if (get-in @state/state [:editor/property-triggered-by-click? id])
      (do
        (when-let [input (gdom/getElement (str id))]
          (cursor/move-cursor-to-end input))
        (state/set-state! :editor/property-triggered-by-click? {}))
      (when content
        (editor-handler/restore-cursor-pos! id content)))

    ;; Here we delay this listener, otherwise the click to edit event will trigger a outside click event,
    ;; which will hide the editor so no way for editing.
    (js/setTimeout #(keyboards-handler/esc-save! state) 100)

    (when-let [element (gdom/getElement id)]
      (.focus element)
      (js/setTimeout #(util/scroll-editor-cursor element) 50)))
  state)

(defn will-remount!
  [_old-state state]
  (keyboards-handler/esc-save! state)
  state)

(defn will-unmount
  [state]
  (editor-handler/clear-when-saved!)
  state)

(def lifecycle
  {:did-mount did-mount!
   :will-remount will-remount!
   :will-unmount will-unmount})
