(ns frontend.components.file-content
  (:require [clojure.string :as string]
            [frontend.fs :as fs]
            [frontend.state :as state]))

(defn <read-file-content
  [repo _repo-dir file-path]
  (if-not (string/starts-with? file-path "/")
    (state/<invoke-db-worker :thread-api/get-file-content repo file-path)
    (fs/read-file nil file-path)))
