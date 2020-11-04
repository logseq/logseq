(ns frontend.fs
  (:require [frontend.util :as util]))

(defn mkdir
  [dir]
  (when (and dir js/window.pfs)
    (js/window.pfs.mkdir dir)))

(defn readdir
  [dir]
  (when (and dir js/window.pfs)
    (js/window.pfs.readdir dir)))

(defn unlink
  [path opts]
  (js/window.pfs.unlink path opts))

(defn rmdir
  [dir]
  (js/window.workerThread.rimraf dir))

(defn read-file
  [dir path]
  (js/window.pfs.readFile (str dir "/" path)
                          (clj->js {:encoding "utf8"})))

(defn read-file-2
  [dir path]
  (js/window.pfs.readFile (str dir "/" path)
                          (clj->js {})))

(defn write-file
  [dir path content]
  (and js/window.pfs (js/window.pfs.writeFile (str dir "/" path) content)))

(defn stat
  [dir path]
  (js/window.pfs.stat (str dir "/" path)))

(defn create-if-not-exists
  ([dir path]
   (create-if-not-exists dir path ""))
  ([dir path initial-content]
   (let [path (if (util/starts-with? path "/")
                path
                (str "/" path))]
     (util/p-handle
      (stat dir path)
      (fn [_stat] true)
      (fn [error]
        (write-file dir path initial-content)
        false)))))

(defn file-exists?
  [dir path]
  (util/p-handle
   (stat dir path)
   (fn [_stat] true)
   (fn [_e] false)))

(comment
  (def dir "/notes"))
