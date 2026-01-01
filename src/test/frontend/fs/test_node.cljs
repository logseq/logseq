(ns frontend.fs.test-node
  "Test implementation of fs protocol for node.js"
  (:require [frontend.fs.protocol :as protocol]
            ["fs/promises" :as fsp]
            [promesa.core :as p]))

;; Most protocol fns are not defined. Define them as needed for tests
(defrecord NodeTestfs
           []
  protocol/Fs
  (read-file [_this _dir path _options]
    (p/let [content (fsp/readFile path)]
      (str content)))
  (write-file! [_this _repo _dir path content _opts]
    (fsp/writeFile path content))
  (stat [_this fpath]
    (fsp/stat fpath)))
