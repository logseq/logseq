(ns frontend.modules.file.core
  "Convert block trees to content"
  (:require [frontend.common.file.core :as common-file]
            [frontend.state :as state]
            [frontend.db :as db]))

;; TODO: remove this file and move export related code to worker

(defn tree->file-content
  [tree opts]
  (when-let [repo (state/get-current-repo)]
    (let [db (db/get-db repo)
          context {:export-bullet-indentation (state/get-export-bullet-indentation)}]
      (common-file/tree->file-content repo db tree opts context))))
