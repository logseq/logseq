(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state :refer [sub]]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [dommy.core :as d]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.db :as db]))

(defn did-mount!
  [state]
  (let [[{:keys [block-parent-id]} id] (:rum/args state)
        content (get @(get @state/state :editor/content) id)]
    (when block-parent-id
      (state/set-editing-block-dom-id! block-parent-id))
    (when content
      (editor-handler/restore-cursor-pos! id content))

    ;; Here we delay this listener, otherwise the click to edit event will trigger a outside click event,
    ;; which will hide the editor so no way for editing.
    (js/setTimeout #(keyboards-handler/esc-save! state) 100)

    ;; try to close all opened dropdown menu
    (when-let [close-fns (vals (sub :modal/dropdowns))]
      (try (doseq [f close-fns] (f)) (catch :default _e ())))

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
  (let [{:keys [block value node]} (get-state)
        property? (= "property" (:block/type block))
        repo (state/get-current-repo)]
    (editor-handler/clear-when-saved!)
    (when (and
           (not (contains? #{:insert :indent-outdent :auto-save :undo :redo :delete} (state/get-editor-op)))
           ;; Don't trigger auto-save if the latest op is undo or redo
           (not (contains? #{:undo :redo} (state/get-editor-latest-op))))
      (if property?
        ;; click outside property value to save it
        (let [parent-block (when-let [id (d/attr node "parentblockid")]
                             (when (util/uuid-string? id)
                               (db/entity [:block/uuid (uuid id)])))
              property (:block/name block)
              old-value (:property-value (last (state/get-editor-args)))]
          (when (and parent-block property)
            (property-handler/add-property! repo parent-block property value
                                            :old-value old-value)))
        (editor-handler/save-block! (get-state) value))))
  state)

(def lifecycle
  {:did-mount did-mount!
   :will-remount will-remount!
   :will-unmount will-unmount})
