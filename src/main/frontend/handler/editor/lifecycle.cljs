(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler]
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

    (when-let [element (gdom/getElement id)]
      ;; TODO: check whether editor is visible, do less work
      (js/setTimeout #(util/scroll-editor-cursor element) 50)))
  state)

(defn will-remount!
  [_old-state state]
  (let [new-block (:block (first (:rum/args state)))
        edit-block (state/get-edit-content)
        repo (state/get-current-repo)]
    (when (and edit-block
           (= (:block/uuid new-block)
              (:block/uuid edit-block))
           (not= (some-> edit-block string/trim)
                 (some-> (:block/content new-block) string/trim)))
      (when-let [input (state/get-input)]
        (util/set-change-value input
                               (block-handler/sanity-block-content repo (get new-block :block/format :markdown) (:block/content new-block))))))
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
