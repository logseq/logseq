(ns frontend.handler.editor.lifecycle
  (:require [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.util :as util :refer-macros [profile]]
            [cljs-drag-n-drop.core :as dnd]
            [frontend.handler.editor.keyboards :as keyboards-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.editor :as editor-handler :refer [get-state]]
            [frontend.handler.notification :as notification]
            [frontend.db :as db]
            [frontend.date :as date]
            [frontend.handler.file :as file]
            [promesa.core :as p]
            [frontend.debug :as debug]))

(defn did-mount!
  [state]
  (let [[{:keys [dummy? format block-parent-id]} id] (:rum/args state)
        content (get-in @state/state [:editor/content id])
        input (gdom/getElement id)]
    (when block-parent-id
      (state/set-editing-block-dom-id! block-parent-id))
    (editor-handler/restore-cursor-pos! id content dummy?)

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
  (let [{:keys [id value format block repo dummy? config]} (get-state state)
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
    (if file?
      (let [path (:file-path config)
            content (db/get-file-no-sub path)
            value (some-> (gdom/getElement path)
                          (gobj/get "value"))]
        (when (and
               (not (string/blank? value))
               (not= (string/trim value) (string/trim content)))
          (let [old-page-name (db/get-file-page path false)
                journal? (date/valid-journal-title? path)]
            (p/let [[journal? new-name] (page-handler/rename-when-alter-title-property! old-page-name path format content value)]
              (if (and journal? new-name (not= old-page-name (string/lower-case new-name)))
                (notification/show! "Journal title can't be changed." :warning)
                (let [new-name (if journal? (date/journal-title->default new-name) new-name)
                      new-path (if new-name
                                (if (and
                                     new-name old-page-name
                                     (= (string/lower-case new-name) (string/lower-case old-page-name)))
                                  path
                                  (page-handler/compute-new-file-path path new-name))
                                path)]
                  (file/alter-file (state/get-current-repo) new-path (string/trim value)
                                   {:re-render-root? true})))))))
      (when-not (contains? #{:insert :indent-outdent :auto-save} (state/get-editor-op))
        (editor-handler/save-block! (get-state state) value))))
  state)

(def lifecycle
  {:did-mount did-mount!
   :did-remount did-remount!
   :will-unmount will-unmount})
