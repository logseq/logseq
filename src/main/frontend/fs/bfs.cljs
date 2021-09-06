(ns frontend.fs.bfs
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [promesa.core :as p]))

(defrecord Bfs []
  protocol/Fs
  (mkdir! [this dir]
    (when (and js/window.pfs (not (util/electron?)))
      (->
       (js/window.pfs.mkdir dir)
       (p/catch (fn [error] (println "Mkdir error: " error))))))
  (readdir [this dir]
    (when js/window.pfs
      (js/window.pfs.readdir dir)))
  (unlink! [this repo path opts]
    (when js/window.pfs
      (p/let [stat (js/window.pfs.stat path)]
        (if (= (.-type stat) "file")
          (js/window.pfs.unlink path opts)
          (p/rejected "Unlinking a directory is not allowed")))))
  (rmdir! [this dir]
    (js/window.workerThread.rimraf dir))
  (read-file [this dir path options]
    (js/window.pfs.readFile (str dir "/" path) (clj->js options)))
  (write-file! [this repo dir path content opts]
    (when-not (util/electron?)
      (js/window.pfs.writeFile (str dir "/" path) content)))
  (rename! [this repo old-path new-path]
    (js/window.pfs.rename old-path new-path))
  (stat [this dir path]
    (js/window.pfs.stat (str dir path)))
  (open-dir [this ok-handler]
    nil)
  (get-files [this path-or-handle ok-handler]
    nil)
  (watch-dir! [this dir]
    nil))
