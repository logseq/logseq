(ns frontend.fs.test-node
  "Test implementation of fs protocol for node.js"
  (:require [frontend.fs.protocol :as protocol]
            ["fs/promises" :as fsp]
            [promesa.core :as p]))

;; Most protocol fns are not defined. Define them as needed for tests
(defrecord NodeTestfs
           []
  protocol/Fs
  (mkdir! [_this dir]
    (fsp/mkdir dir))
  (mkdir-recur! [_this dir]
    (fsp/mkdir dir #js {:recursive true}))
  (readdir [_this dir]
    (fsp/readdir dir))
  (unlink! [_this _repo path _opts]
    (fsp/unlink path))
  (rmdir! [_this dir]
    (fsp/rm dir #js {:recursive true :force true}))
  (read-file [_this _dir path _options]
    (p/let [content (fsp/readFile path)]
      (str content)))
  (read-file-raw [_this _dir path _options]
    (fsp/readFile path))
  (write-file! [_this _repo _dir path content _opts]
    (fsp/writeFile path content))
  (rename! [_this _repo old-path new-path]
    (fsp/rename old-path new-path))
  (copy! [_this _repo old-path new-path]
    (fsp/copyFile old-path new-path))
  (stat [_this fpath]
    (fsp/stat fpath))
  (open-dir [_this _dir]
    nil)
  (get-files [_this _dir]
    nil)
  (watch-dir! [_this _dir _options]
    nil)
  (unwatch-dir! [_this _dir]
    nil))
