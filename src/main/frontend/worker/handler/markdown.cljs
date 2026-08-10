(ns frontend.worker.handler.markdown
  "Markdown mirror operations for the db worker."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.state :as worker-state]))

(def-thread-api :thread-api/markdown-mirror-set-enabled
  [repo enabled?]
  (markdown-mirror/set-enabled! repo enabled?)
  nil)

(def-thread-api :thread-api/markdown-mirror-flush
  [repo]
  (markdown-mirror/<flush-repo! repo {}))

(def-thread-api :thread-api/markdown-mirror-regenerate
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (markdown-mirror/<mirror-repo! repo @conn {})))
