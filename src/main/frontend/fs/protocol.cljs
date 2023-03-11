(ns ^:no-doc frontend.fs.protocol
  ;; namespace local config to suppress 'new-path' of 'rename!'. clj-kondo's bug?
  {:clj-kondo/config {:linters {:private-call {:level :off}}}})

(defprotocol Fs
  (mkdir! [this dir])
  (mkdir-recur! [this dir])
  (readdir [this dir])
  (unlink! [this repo path opts])
  (rmdir! [this dir])
  (read-file [this dir path opts])
  (write-file! [this repo dir path content opts])
  (rename! [this repo old-path new-path])
  (copy! [this repo old-path new-path])
  (stat [this path]
    "=> {:type string :size number :mtime number}")
  (open-dir [this dir ok-handler]
    "=> {:path string :files [{...}]}")
  (list-files [this dir ok-handler]
    "dir => [{:path string :content string}]")
  (watch-dir! [this dir options])
  (unwatch-dir! [this dir])
  ;; Ensure the dir is watched, window agnostic.
  ;; Implementation should handle the actual watcher's construction / destruction.
  ;; So shouldn't consider `unwatch-dir!`.
  )
