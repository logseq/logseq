(ns frontend.fs.node
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]))

(defrecord Node []
  protocol/Fs
  (mkdir! [this dir]
    nil)
  (readdir [this dir]
    nil)
  (unlink! [this path opts]
    nil)
  (rmdir! [this dir]
    nil)
  (read-file [this dir path]
    nil)
  (write-file! [this repo dir path content opts]
    nil)
  (rename! [this repo old-path new-path]
    nil)
  (stat [this dir path]
    nil))
