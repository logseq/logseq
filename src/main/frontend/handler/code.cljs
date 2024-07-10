(ns frontend.handler.code
  "Codemirror editor related."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.graph-parser.utf8 :as utf8]
            [logseq.common.path :as path]
            [frontend.handler.db-based.editor :as db-editor-handler]))

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
            repo (state/get-current-repo)]
        (when (not= value default-value)
          ;; update default value for the editor initial state
          (set! ds -v value)
          (cond
            ;; save block content
            (:block/uuid config)
            (let [block (db/pull [:block/uuid (:block/uuid config)])
                  content (:block/title block)
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

            (and (not-empty (:file-path config))
                 (config/db-based-graph? repo))
            (db-editor-handler/save-file! (:file-path config) value)

            (not-empty (:file-path config))
            (let [path (:file-path config)
                  repo-dir (config/get-repo-dir repo)
                  rpath (when (string/starts-with? path repo-dir)
                          (path/trim-dir-prefix repo-dir path))]
              (if rpath
                ;; in-db file
                (let [db-content (db/get-file rpath)
                      not-in-db? (nil? db-content)
                      old-content (or db-content "")
                      contents-matched? (= (string/trim value) (string/trim old-content))]
                  (when (or
                         (and not-in-db? (not-empty value))
                         (not contents-matched?))
                    (file-handler/alter-file (state/get-current-repo)
                                             rpath
                                             (str (string/trim value) "\n")
                                             {:re-render-root? true})))
                ;; global file
                (file-handler/alter-global-file path (str (string/trim value) "\n") {})))

            :else
            nil))))))
