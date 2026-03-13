(ns frontend.test.node-fixtures
  (:require [frontend.fs :as fs]
            [frontend.fs.test-node :as test-node]))

(defonce ^:private *get-fs-fn (atom nil))

(defn setup-get-fs!
  []
  (reset! *get-fs-fn fs/get-fs)
  (set! fs/get-fs (constantly (test-node/->NodeTestfs))))

(defn restore-get-fs!
  []
  (set! fs/get-fs @*get-fs-fn))
