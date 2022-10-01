(ns ^:no-doc frontend.handler.history
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]))

(defn restore-cursor!
  [{:keys [last-edit-block container pos]}]
  (when (and container last-edit-block)
    #_:clj-kondo/ignore
    (when-let [container (gdom/getElement container)]
      (when-let [block-uuid (:block/uuid last-edit-block)]
        (when-let [block (db/pull [:block/uuid block-uuid])]
          (editor/edit-block! block pos
                              (:block/uuid block)
                              {:custom-content (:block/content block)}))))))

(defn undo!
  [e]
  (util/stop e)
  (state/set-editor-op! :undo)
  (state/clear-editor-action!)
  (editor/save-current-block!)
  (let [{:keys [editor-cursor]} (undo-redo/undo)]
    (restore-cursor! editor-cursor))
  (state/set-editor-op! nil))

(defn redo!
  [e]
  (util/stop e)
  (state/set-editor-op! :redo)
  (state/clear-editor-action!)
  (let [{:keys [editor-cursor]} (undo-redo/redo)]
    (restore-cursor! editor-cursor))
  (state/set-editor-op! nil))
