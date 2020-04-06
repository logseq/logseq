(ns frontend.fs
  (:require [frontend.util :as util]
            [promesa.core :as p]))

(defn mkdir
  [dir]
  (js/pfs.mkdir dir))

(defn readdir
  [dir]
  (js/pfs.readdir dir))

(defn read-file
  [dir path]
  (js/pfs.readFile (str dir "/" path)
                   (clj->js {:encoding "utf8"})))

(defn write-file
  [dir path content]
  (js/pfs.writeFile (str dir "/" path) content))

(defn stat
  [dir path]
  (js/pfs.stat (str dir "/" path)))

(defn create-if-not-exists
  ([dir path]
   (create-if-not-exists dir path ""))
  ([dir path initial-content]
   (util/p-handle
    (stat dir path)
    (fn [_stat] true)
    (fn [error]
      (write-file dir path initial-content)
      false))))
