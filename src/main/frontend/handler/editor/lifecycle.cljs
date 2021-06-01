(ns frontend.handler.editor.lifecycle
  (:require [frontend.state :as state]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]
            [cljs-drag-n-drop.core :as dnd]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.notification :as notification]
            [frontend.db :as db]
            [frontend.date :as date]
            [promesa.core :as p]))

(defn did-mount!
  [state]
  (let [[{:keys [format block-parent-id]} id] (:rum/args state)
        content (get-in @state/state [:editor/content id])
        input (gdom/getElement id)]
    (when block-parent-id
      (state/set-editing-block-dom-id! block-parent-id))
    (editor-handler/restore-cursor-pos! id content)

    (when input
      (dnd/subscribe!
       input
       :upload-images
       {:drop (fn [e files]
                (editor-handler/upload-asset id files format editor-handler/*asset-uploading? true))}))

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
    (when-let [input (gdom/getElement id)]
      ;; (.removeEventListener input "paste" (fn [event]
      ;;                                       (append-paste-doc! format event)))
      (let [s (str "cljs-drag-n-drop." :upload-images)
            a (gobj/get input s)
            timer (:timer a)]

        (and timer
             (dnd/unsubscribe!
              input
              :upload-images))))
    (editor-handler/clear-when-saved!)
    ;; TODO: ugly
    (when-not (contains? #{:insert :indent-outdent :auto-save :undo :redo :delete} (state/get-editor-op))
      (editor-handler/save-block! (get-state) value)))
  state)

(def lifecycle
  {:did-mount did-mount!
   :did-remount did-remount!
   :will-unmount will-unmount})
