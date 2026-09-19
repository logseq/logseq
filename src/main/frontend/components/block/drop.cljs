(ns frontend.components.block.drop
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.app-url :as app-url]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- data-transfer-files
  [data-transfer]
  (some-> data-transfer .-files array-seq seq))

(defn- save-files!
  [files target-block]
  (-> (editor-handler/db-based-save-assets! (state/get-current-repo) files
                                            :last-edit-block target-block)
      (p/catch (fn [error]
                 (log/error :block/drop-files-failed {:error error}))))
  nil)

(defn handle-data-transfer-drop!
  [^js event uuid target-block move-to]
  (let [data-transfer (.-dataTransfer event)
        transfer-types (set (js->clj (.-types data-transfer)))
        files (data-transfer-files data-transfer)]
    (cond
      (and (contains? transfer-types "Files") (seq files))
      (do
        (util/stop event)
        (save-files! files target-block))

      (contains? transfer-types "text/plain")
      (let [text (.getData data-transfer "text/plain")]
        (when (app-url/privileged-renderer-url? text)
          (util/stop event))
        (when (app-url/insertable-block-content? text)
          (editor-handler/api-insert-new-block!
           text
           {:block-uuid uuid
            :edit-block? false
            :sibling? (= move-to :sibling)
            :before? (= move-to :top)})))

      :else
      (log/warn :block/unhandled-drop-data-transfer-type {:types transfer-types}))))
