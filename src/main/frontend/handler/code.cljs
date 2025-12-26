(ns frontend.handler.code
  "Codemirror editor related."
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.graph-parser.utf8 :as utf8]))

(defn save-code-editor!
  []
  (let [{:keys [config state editor]} (get @state/state :editor/code-block-context)]
    (when editor
      (state/set-block-component-editing-mode! false)
      (.save editor)
      (let [textarea (.getTextArea editor)
            ds (.-dataset textarea)
            value (gobj/get textarea "value")
            default-value (or (.-v ds) (gobj/get textarea "defaultValue"))
            block (or (:code-block config) (:block config))]
        (when (not= value default-value)
          ;; update default value for the editor initial state
          (set! ds -v value)
          (cond
            (= :code (:logseq.property.node/display-type block))
            (editor-handler/save-block-if-changed! block value)

            ;; save block content
            (:block/uuid config)
            (let [block (db/entity [:block/uuid (:block/uuid config)])
                  content (:block/raw-title block)
                  {:keys [start_pos end_pos]} (:pos_meta @(:code-options state))
                  offset (if (:block/pre-block? block) 0 2)
                  raw-content (utf8/encode content) ;; NOTE: :pos_meta is based on byte position
                  prefix (utf8/decode (.slice raw-content 0 (- start_pos offset)))
                  surfix (utf8/decode (.slice raw-content (- end_pos offset)))
                  new-content (if (string/blank? value)
                                (str prefix surfix)
                                (str prefix value "\n" surfix))]
              (state/set-edit-content! (state/get-edit-input-id) new-content)
              (editor-handler/save-block-if-changed! block new-content))

            (not-empty (:file-path config))
            (db-editor-handler/save-file! (:file-path config) value)

            :else
            nil))))))
