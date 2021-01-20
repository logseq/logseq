(ns frontend.fs.bfs
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [promesa.core :as p]))

(defrecord Bfs []
  protocol/Fs
  (mkdir! [this dir]
    (when js/window.pfs
      (js/window.pfs.mkdir dir)))
  (readdir [this dir]
    (when js/window.pfs
      (js/window.pfs.readdir dir)))
  (unlink! [this path opts]
    (when js/window.pfs
      (p/let [stat (js/window.pfs.stat path)]
        (if (= (.-type stat) "file")
          (js/window.pfs.unlink path opts)
          (p/rejected "Unlinking a directory is not allowed")))))
  (rmdir! [this dir]
    (js/window.workerThread.rimraf dir))
  (read-file [this dir path]
    (let [option (clj->js {:encoding "utf8"})]
      (js/window.pfs.readFile (str dir "/" path) option)))
  (write-file! [this repo dir path content opts]
    (js/window.pfs.writeFile (str dir "/" path) content))
  (rename! [this repo old-path new-path]
    (js/window.pfs.rename old-path new-path))
  (stat [this dir path]
    (js/window.pfs.stat (str dir path))))
