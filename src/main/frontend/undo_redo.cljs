(ns frontend.undo-redo
  "Main-thread proxy for worker-owned undo/redo."
  (:require [frontend.state :as state]
            [frontend.util :as util]))

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

(defn- invoke-db-worker
  [thread-api & args]
  (try
    (apply state/<invoke-db-worker thread-api args)
    (catch :default e
      (if (worker-not-initialized? e)
        nil
        (throw e)))))

(defn clear-history!
  [repo]
  (if util/node-test?
    nil
    (invoke-db-worker :thread-api/undo-redo-clear-history repo)))

(defn undo
  [repo]
  (if util/node-test?
    :frontend.undo-redo/empty-undo-stack
    (or (some-> (invoke-db-worker :thread-api/undo-redo-undo repo)
                normalize-empty-result)
        :frontend.undo-redo/empty-undo-stack)))

(defn redo
  [repo]
  (if util/node-test?
    :frontend.undo-redo/empty-redo-stack
    (or (some-> (invoke-db-worker :thread-api/undo-redo-redo repo)
                normalize-empty-result)
        :frontend.undo-redo/empty-redo-stack)))

(defn record-editor-info!
  [repo editor-info]
  (when editor-info
    (if util/node-test?
      nil
      (invoke-db-worker :thread-api/undo-redo-record-editor-info repo editor-info))))

(defn record-ui-state!
  [repo ui-state-str]
  (when ui-state-str
    (if util/node-test?
      nil
      (invoke-db-worker :thread-api/undo-redo-record-ui-state repo ui-state-str))))

(defn <get-debug-state
  [repo]
  (when-not util/node-test?
    (invoke-db-worker :thread-api/undo-redo-get-debug-state repo)))
