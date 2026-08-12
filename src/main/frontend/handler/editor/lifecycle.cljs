(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [dommy.core :as dom]
            [frontend.db.async :as db-async]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(defn- <record-editor-info!
  [repo edit-block-db-id editor-info]
  (p/let [page-info (db-async/<get-block-page-info repo edit-block-db-id)
          page-id (:block/uuid page-info)]
    (when page-id
      (state/<invoke-db-worker :thread-api/undo-redo-record-editor-info
                               repo
                               editor-info))))

(defn did-mount!
  [id config]
  (let [content (state/get-edit-content)
        input (state/get-input)
        node (util/rec-get-node input "ls-block")
        container-id (when node
                       (when-let [container-id-str (dom/attr node "containerid")]
                         (util/safe-parse-int container-id-str)))]
    (when input
      (when-not (:skip-focus? config)
        (.focus input)))
    (when container-id
      (state/set-state! :editor/container-id container-id))

    (when content
      (editor-handler/restore-cursor-pos! id content))

    (when-let [element (gdom/getElement id)]
      ;; TODO: check whether editor is visible, do less work
      (js/setTimeout #(util/scroll-editor-cursor element) 50))

    ;; skip recording editor info when undo or redo is still running
    (when-not (or (:skip-focus? config)
                  (contains? #{:undo :redo} (state/get-state :editor/op)))
      (when-let [edit-block-db-id (:db/id (state/get-edit-block))]
        (let [repo (state/get-current-repo)
              editor-info (state/get-editor-info)]
          (<record-editor-info! repo edit-block-db-id editor-info))))
    (state/set-state! :editor/op nil)))

(defn use-did-mount!
  [id config]
  (hooks/use-layout-effect!
   #(did-mount! id config)
   []))
