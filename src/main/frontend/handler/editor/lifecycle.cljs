(ns ^:no-doc frontend.handler.editor.lifecycle
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [dommy.core :as dom]
            ;; [clojure.string :as string]
            ;; [frontend.handler.block :as block-handler]
            ))

(defn did-mount!
  [state]
  (let [[{:keys [block-parent-id]} id] (:rum/args state)
        content (state/get-edit-content)
        input (state/get-input)
        node (util/rec-get-node input "ls-block")
        container-id (when node
                       (when-let [container-id-str (dom/attr node "containerid")]
                         (util/safe-parse-int container-id-str)))]
    (when container-id
      (state/set-state! :editor/container-id container-id))

    (when block-parent-id
      (state/set-editing-block-dom-id! block-parent-id))

    (when content
      (editor-handler/restore-cursor-pos! id content))

    (when-let [element (gdom/getElement id)]
      ;; TODO: check whether editor is visible, do less work
      (js/setTimeout #(util/scroll-editor-cursor element) 50))

    ;; skip recording editor info when undo or redo is still running
    (when-not (contains? #{:undo :redo} @(:editor/op @state/state))
      (let [^js worker @state/*db-worker
            page-id (:block/uuid (:block/page (db/entity (:db/id (state/get-edit-block)))))
            repo (state/get-current-repo)]
        (when page-id
          (.record-editor-info worker repo (str page-id) (ldb/write-transit-str (state/get-editor-info))))))

    (state/set-state! :editor/op nil))
  state)

;; (defn will-remount!
;;   [_old-state state]
;;   (let [new-block (:block (first (:rum/args state)))
;;         edit-block (state/get-edit-content)
;;         repo (state/get-current-repo)]
;;     (when (and edit-block
;;            (= (:block/uuid new-block)
;;               (:block/uuid edit-block))
;;            (not= (some-> edit-block string/trim)
;;                  (some-> (:block/title new-block) string/trim)))
;;       (when-let [input (state/get-input)]
;;         (util/set-change-value input
;;                                (block-handler/sanity-block-content repo (get new-block :block/format :markdown) (:block/title new-block))))))
;;   state)


(def lifecycle
  {:did-mount did-mount!
   ;; :will-remount will-remount!
   })
