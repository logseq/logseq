(ns frontend.fs.node
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

(defrecord Node []
  protocol/Fs
  (mkdir! [this dir]
    (ipc/ipc "mkdir" dir))
  (readdir [this dir]                   ; recursive
    (ipc/ipc "readdir" dir))
  (unlink! [this path _opts]
    (ipc/ipc "unlink" path))
  (rmdir! [this dir]
    nil)
  (read-file [this dir path]
    (ipc/ipc "readFile" (str dir "/" path)))
  (write-file! [this repo dir path content _opts]
    (ipc/ipc "writeFile" (str dir "/" path) content))
  (rename! [this repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))
  (stat [this dir path]
    (ipc/ipc "stat" (str dir path))))
