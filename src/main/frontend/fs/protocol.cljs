(ns ^:no-doc frontend.fs.protocol
  ;; namespace local config to suppress 'new-path' of 'rename!'. clj-kondo's bug?
  {:clj-kondo/config {:linters {:private-call {:level :off}}}})

(defprotocol Fs
  ;; TODO(andelf): merge mkdir! & mkdir-recur!
  (mkdir! [this dir])
  (mkdir-recur! [this dir])
  ;; TODO(andelf): clarify the return value. How is this different from `get-files`?
  (readdir [this dir]
    "Read directory and return list of files. Won't read file out.
     Used by initial watcher, version files of Logseq Sync.
     
     => [string]")
  (unlink! [this repo path opts])
  ;; FIXME(andelf): remove this API? since the only usage is plugin API
  (rmdir! [this dir])
  (read-file [this dir path opts])
  (write-file! [this repo dir path content opts])
  (rename! [this repo old-path new-path])
  (copy! [this repo old-path new-path])
  (stat [this path]
    "=> {:type string :size number :mtime number}")

  ;; The following APIs are optional
  (open-dir [this dir]
    "Open a directory and return the files in it.
     Used by open a new graph.
     
     => {:path string :files [{...}]}")
  (get-files [this dir]
    "Almost the same as `open-dir`. For returning files.
     Used by re-index/refresh.
     
     => [{:path string :content string}] (absolute path)")
  (watch-dir! [this dir options])
  (unwatch-dir! [this dir]))
