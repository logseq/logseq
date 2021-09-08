(ns frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.state :as state]
            [goog.dom :as gdom]))

(defn did-mount!
  [state]
  (let [[{:keys [format block-parent-id]} id] (:rum/args state)
        content (get-in @state/state [:editor/content id])]
    (when block-parent-id
      (state/set-editing-block-dom-id! block-parent-id))
    (when content
      (editor-handler/restore-cursor-pos! id content))

    ;; Here we delay this listener, otherwise the click to edit event will trigger a outside click event,
    ;; which will hide the editor so no way for editing.
    (js/setTimeout #(keyboards-handler/esc-save! state) 100)

    (when-let [element (gdom/getElement id)]
      (.focus element)))
  state)

(defn did-remount!
  [_old-state state]
  (keyboards-handler/esc-save! state)
  state)

(defn will-unmount
  [state]
  (let [{:keys [id value format block repo config]} (get-state)
        file? (:file? config)]
    (editor-handler/clear-when-saved!)
    ;; TODO: ugly
    (when-not (contains? #{:insert :indent-outdent :auto-save :undo :redo :delete} (state/get-editor-op))
      (editor-handler/save-block! (get-state) value)))
  state)

(def lifecycle
  {:did-mount did-mount!
   :did-remount did-remount!
   :will-unmount will-unmount})
