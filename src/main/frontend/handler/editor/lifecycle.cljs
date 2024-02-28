(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [frontend.db :as db]
            [frontend.handler.block :as block-handler]
            [clojure.string :as string]))

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
  [_old-state state]
  (let [new-block (:block (first (:rum/args state)))
        repo (state/get-current-repo)]
    (when (not= (string/trim (state/get-edit-content))
                (string/trim (:block/content new-block)))
      (util/set-change-value (state/get-input)
                             (block-handler/sanity-block-content repo (get new-block :block/format :markdown) (:block/content new-block)))))
  (keyboards-handler/esc-save! state)
  state)

(defn will-unmount
  [state]
  (let [{:keys [value block] :as state} (editor-handler/get-state)
        editor-op (state/get-editor-op)]
    (editor-handler/clear-when-saved!)
    (state/set-editor-op! nil)
    (when (db/entity [:block/uuid (:block/uuid block)]) ; block still exists
      (when-not (or (contains? #{:undo :redo :escape} editor-op)
                    (state/editor-in-composition?))
        (editor-handler/save-block! state value))))
  state)

(def lifecycle
  {:did-mount did-mount!
   :will-remount will-remount!
   :will-unmount will-unmount})
