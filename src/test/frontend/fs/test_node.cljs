(ns frontend.fs.test-node
  "Test implementation of fs protocol for node.js"
  (:require [frontend.fs.protocol :as protocol]
            ["fs" :as fs-node]))

;; Most protocol fns are not defined. Define them as needed for tests
(defrecord NodeTestfs
  []
  protocol/Fs
  (read-file [_this _dir path _options]
             (str (fs-node/readFileSync path)))
  (write-file! [_this _repo _dir path content _opts]
               (fs-node/writeFileSync path content)))
