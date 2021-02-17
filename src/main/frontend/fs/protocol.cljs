(ns frontend.fs.protocol)

(defprotocol Fs
  (mkdir! [this dir])
  (readdir [this dir])
  (unlink! [this path opts])
  (rmdir! [this dir])
  (read-file [this dir path opts])
  (write-file! [this repo dir path content opts])
  (rename! [this repo old-path new-path])
  (stat [this dir path])
  (open-dir [this ok-handler])
  (get-files [this path-or-handle ok-handler])
  (watch-dir! [this dir]))
