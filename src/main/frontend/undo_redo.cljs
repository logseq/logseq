(ns frontend.undo-redo
  "Main-thread proxy for worker-owned undo/redo."
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [frontend.worker.undo-redo :as worker-undo-redo]))

(defn- worker-not-initialized?
  [e]
  (= "db-worker has not been initialized" (ex-message e)))

(defn- normalize-empty-result
  [result]
  (case result
    :frontend.worker.undo-redo/empty-undo-stack
    :frontend.undo-redo/empty-undo-stack

    :frontend.worker.undo-redo/empty-redo-stack
    :frontend.undo-redo/empty-redo-stack

    result))

(defn clear-history!
  [repo]
  (if util/node-test?
    (do
      (worker-undo-redo/clear-history! repo)
      nil)
    (try
      (state/<invoke-db-worker :thread-api/undo-redo-clear-history repo)
      (catch :default e
        (if (worker-not-initialized? e)
          (do
            (worker-undo-redo/clear-history! repo)
            nil)
          (throw e))))))

(defn undo
  [repo]
  (if util/node-test?
    (normalize-empty-result (worker-undo-redo/undo repo))
    (try
      (state/<invoke-db-worker :thread-api/undo-redo-undo repo)
      (catch :default e
        (if (worker-not-initialized? e)
          (normalize-empty-result (worker-undo-redo/undo repo))
          (throw e))))))

(defn redo
  [repo]
  (if util/node-test?
    (normalize-empty-result (worker-undo-redo/redo repo))
    (try
      (state/<invoke-db-worker :thread-api/undo-redo-redo repo)
      (catch :default e
        (if (worker-not-initialized? e)
          (normalize-empty-result (worker-undo-redo/redo repo))
          (throw e))))))

(defn record-editor-info!
  [repo editor-info]
  (when editor-info
    (if util/node-test?
      (do
        (worker-undo-redo/record-editor-info! repo editor-info)
        nil)
      (try
        (state/<invoke-db-worker :thread-api/undo-redo-record-editor-info repo editor-info)
        (catch :default e
          (if (worker-not-initialized? e)
            (do
              (worker-undo-redo/record-editor-info! repo editor-info)
              nil)
            (throw e)))))))

(defn record-ui-state!
  [repo ui-state-str]
  (when ui-state-str
    (if util/node-test?
      (do
        (worker-undo-redo/record-ui-state! repo ui-state-str)
        nil)
      (try
        (state/<invoke-db-worker :thread-api/undo-redo-record-ui-state repo ui-state-str)
        (catch :default e
          (if (worker-not-initialized? e)
            (do
              (worker-undo-redo/record-ui-state! repo ui-state-str)
              nil)
            (throw e)))))))

(defn <get-debug-state
  [repo]
  (if util/node-test?
    (worker-undo-redo/get-debug-state repo)
    (try
      (state/<invoke-db-worker :thread-api/undo-redo-get-debug-state repo)
      (catch :default e
        (if (worker-not-initialized? e)
          (worker-undo-redo/get-debug-state repo)
          (throw e))))))
