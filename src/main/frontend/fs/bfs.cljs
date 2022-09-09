(ns frontend.fs.bfs
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [promesa.core :as p]))

(defrecord Bfs []
  protocol/Fs
  (mkdir! [_this dir]
    (when (and js/window.pfs (not (util/electron?)))
      (->
       (js/window.pfs.mkdir dir)
       (p/catch (fn [error] (println "Mkdir error: " error))))))
  (readdir [_this dir]
    (when js/window.pfs
      (js/window.pfs.readdir dir)))
  (unlink! [_this _repo path opts]
    (when js/window.pfs
      (p/let [stat (js/window.pfs.stat path)]
        (if (= (.-type stat) "file")
          (js/window.pfs.unlink path opts)
          (p/rejected "Unlinking a directory is not allowed")))))
  (rmdir! [_this dir]
    (js/window.workerThread.rimraf dir))
  (read-file [_this dir path options]
    (js/window.pfs.readFile (str dir "/" path) (clj->js options)))
  (write-file! [_this _repo dir path content _opts]
    (when-not (util/electron?)
      (js/window.pfs.writeFile (str dir "/" path) content)))
  (rename! [_this _repo old-path new-path]
    (js/window.pfs.rename old-path new-path))
  (stat [_this dir path]
    (js/window.pfs.stat (str dir path)))
  (open-dir [_this _ok-handler]
    nil)
  (get-files [_this _path-or-handle _ok-handler]
    nil)
  (watch-dir! [_this _dir _options]
    nil)
  (unwatch-dir! [_this _dir]
    nil))
