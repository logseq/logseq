(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [frontend.db :as db]))

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

    (keyboards-handler/esc-save! state)

    (when-let [element (gdom/getElement id)]
      (.focus element)
      (js/setTimeout #(util/scroll-editor-cursor element) 50)))
  state)

(defn will-remount!
  [old-state state]
  (keyboards-handler/esc-save! state)
  (let [old-content (:block/content (:block (first (:rum/args old-state))))
        new-content (:block/content (:block (first (:rum/args state))))
        input (state/get-input)]
    (when (and input (not= old-content new-content))
      (set! (.-new-value input) new-content))
    state))

(defn will-unmount
  [state]
  (let [{:keys [value block node] :as state} (editor-handler/get-state)
        new-value (or (and node (.-new-value node)) value)]
    (editor-handler/clear-when-saved!)
    (when (db/entity [:block/uuid (:block/uuid block)]) ; block still exists
      (when-not (contains? #{:undo :redo} (state/get-editor-op))
        (editor-handler/save-block! state new-value))))
  state)

(def lifecycle
  {:did-mount did-mount!
   :will-remount will-remount!
   :will-unmount will-unmount})
