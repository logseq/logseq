(ns frontend.handler.editor.impl
  (:require [frontend.db.react :as react]
            [frontend.handler.editor.impl.file :as file]
            [frontend.handler.editor.impl.db :as db]
            [frontend.state :as state]))

(defn wrap-parse-block
  [block]
  (if (react/db-graph? (state/get-current-repo))
    (db/wrap-parse-block block)
    (file/wrap-parse-block block)))
