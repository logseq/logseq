(ns frontend.components.file-content
  (:require [frontend.fs :as fs]
            [frontend.state :as state]
            [logseq.common.path :as path]
            [promesa.core :as p]))

(defn <read-file-content
  [repo _repo-dir file-path]
  (if-not (path/absolute? file-path)
    (state/<invoke-db-worker :thread-api/get-file-content repo file-path)
    (-> (fs/read-file nil file-path)
        (p/catch
         (fn [_]
           (p/do!
            (fs/mkdir-if-not-exists (path/parent file-path))
            (fs/create-if-not-exists nil nil file-path "")
            ""))))))
