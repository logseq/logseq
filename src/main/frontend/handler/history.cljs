(ns frontend.handler.history
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.handler.file :as file]
            [frontend.handler.editor :as editor]
            [frontend.handler.ui :as ui-handler]
            [promesa.core :as p]
            [clojure.core.async :as async]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [dommy.core :as d]
            [frontend.util :as util]
            [medley.core :as medley]
            [frontend.modules.editor.undo-redo :as undo-redo]))

(defn- default-undo
  []
  (js/document.execCommand "undo" false nil))

(defn- default-redo
  []
  (js/document.execCommand "redo" false nil))

(defn restore-cursor!
  [{:keys [block-container last-edit-block pos] :as state}]
  (ui-handler/re-render-root!)
  (when (and block-container last-edit-block pos)
    (when-let [container (gdom/getElement block-container)]
      (when-let [block-uuid (:block/uuid (:block last-edit-block))]
        (when-let [block (db/pull [:block/uuid block-uuid])]
          (editor/edit-block! block pos
                              (:block/format block)
                              (:block/uuid block)))))))

(defn undo!
  []
  (editor/save-current-block-when-idle! {:check-idle? false})
  (let [{:keys [editor-cursor]} (undo-redo/undo)]
    (restore-cursor! editor-cursor)))

(defn redo!
  []
  (let [{:keys [editor-cursor]} (undo-redo/redo)]
    (restore-cursor! editor-cursor)))
