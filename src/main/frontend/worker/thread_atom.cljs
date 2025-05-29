(ns frontend.worker.thread-atom
  "atoms from ui-thread"
  (:require [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
            [frontend.worker.state :as worker-state]))

(def-thread-api :thread-api/update-thread-atom
  [atom-key new-value]
  (assert (and (keyword? atom-key)
               (identical? "thread-atom" (namespace atom-key))))
  (when-let [a (get @worker-state/*state atom-key)]
    (reset! a new-value)
    nil))
