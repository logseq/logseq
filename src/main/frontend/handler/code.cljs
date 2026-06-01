(ns frontend.handler.code
  "Codemirror editor related."
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.extensions.code :as code-editor]
            [frontend.fs :as fs]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.path :as path]
            [logseq.graph-parser.utf8 :as utf8]))

(defn- save-file! [path content]
  (if (db/entity [:file/path path])
    ;; This fn assumes path is is already in db
    (db-editor-handler/save-file! path content)
    (when (util/electron?)
      (if (path/absolute? path)
        (do
          ;; Set global state first in case it's invalid edn
          (when (= path (global-config-handler/global-config-path))
            (global-config-handler/set-global-config-state! content)
            (state/pub-event! [:shortcut/refresh]))
          (fs/write-file! path content))
        (js/console.error "Saving relative file ignored" path content)))))

(defn fenced-code-content
  [content {:keys [start_pos end_pos]} value]
  (let [offset 2
        raw-content (utf8/encode content) ;; NOTE: :pos_meta is based on byte position
        prefix (utf8/decode (.slice raw-content 0 (- start_pos offset)))
        surfix (utf8/decode (.slice raw-content (- end_pos offset)))]
    (if (string/blank? value)
      (str prefix surfix)
      (str prefix value "\n" surfix))))

(defn save-code-editor!
  []
  (let [{:keys [config state editor]} (get @state/state :editor/code-block-context)]
    (when editor
      (state/set-block-component-editing-mode! false)
      (let [value (code-editor/get-value editor)
            default-value (code-editor/default-value editor)
            block (or (:code-block config) (:block config))]
        (when (not= value default-value)
          (code-editor/set-default-value! editor value)
          (cond
            (= :code (:logseq.property.node/display-type block))
            (editor-handler/save-block-if-changed! block value)

            ;; save block content
            (:block/uuid block)
            (let [block (db/entity [:block/uuid (:block/uuid block)])
                  content (or (:block/raw-title block)
                              (:block/title block))
                  new-content (fenced-code-content content
                                                   (:pos_meta @(:code-options state))
                                                   value)]
              (state/set-edit-content! (state/get-edit-input-id) new-content)
              (editor-handler/save-block-if-changed! block new-content))

            (not-empty (:file-path config))
            (save-file! (:file-path config) value)

            :else
            nil))))))
