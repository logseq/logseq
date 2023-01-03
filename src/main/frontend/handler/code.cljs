(ns frontend.handler.code
  "Codemirror editor related."
  (:require [frontend.state :as state]
            [goog.object :as gobj]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [logseq.graph-parser.utf8 :as utf8]
            [clojure.string :as string]))

(defn save-code-editor!
  []
  (let [{:keys [config state editor]} (get @state/state :editor/code-block-context)]
    (state/set-state! :editor/skip-saving-current-block? true)
    (state/set-block-component-editing-mode! false)
    (when editor
      (.save editor)
      (let [textarea (.getTextArea editor)
            value (gobj/get textarea "value")
            default-value (gobj/get textarea "defaultValue")]
        (when (not= value default-value)
          (cond
            (:block/uuid config)
            (let [block (db/pull [:block/uuid (:block/uuid config)])
                  content (:block/content block)
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

            (:file-path config)
            (let [path (:file-path config)
                  content (or (db/get-file path) "")]
              (when (and
                     (not (string/blank? value))
                     (not= (string/trim value) (string/trim content)))
                (file-handler/alter-file (state/get-current-repo)
                                         path
                                         (str (string/trim value) "\n")
                                         {:re-render-root? true})))

            :else
            nil))))))
