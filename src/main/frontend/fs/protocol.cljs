(ns frontend.fs.protocol
  ;; namespace local config to suppress 'new-path' of 'rename!'. clj-kondo's bug?
  {:clj-kondo/config {:linters {:private-call {:level :off}}}})

(defprotocol Fs
  (mkdir! [this dir])
  (mkdir-recur! [this dir])
  (readdir [this dir])
  (unlink! [this repo path opts])
  (rmdir! [this dir])
  (read-file [this dir path opts])
  (delete-file! [this repo dir path opts])
  (write-file! [this repo dir path content opts])
  (rename! [this repo old-path new-path])
  (stat [this dir path])
  (open-dir [this ok-handler])
  (get-files [this path-or-handle ok-handler])
  (watch-dir! [this dir]))
