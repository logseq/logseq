(ns frontend.worker.handler.undo-redo
  "Undo and redo operations for the db worker."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.undo-redo :as worker-undo-redo]))

(def-thread-api :thread-api/undo-redo-set-pending-editor-info
  [repo editor-info]
  (worker-undo-redo/set-pending-editor-info! repo editor-info)
  nil)

(def-thread-api :thread-api/undo-redo-record-editor-info
  [repo editor-info]
  (worker-undo-redo/record-editor-info! repo editor-info)
  nil)

(def-thread-api :thread-api/undo-redo-record-ui-state
  [repo ui-state-str]
  (worker-undo-redo/record-ui-state! repo ui-state-str)
  nil)

(def-thread-api :thread-api/undo-redo-undo
  [repo]
  (worker-undo-redo/undo repo))

(def-thread-api :thread-api/undo-redo-redo
  [repo]
  (worker-undo-redo/redo repo))

(def-thread-api :thread-api/undo-redo-clear-history
  [repo]
  (worker-undo-redo/clear-history! repo)
  nil)

(def-thread-api :thread-api/undo-redo-get-debug-state
  [repo]
  (worker-undo-redo/get-debug-state repo))
