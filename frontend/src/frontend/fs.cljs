(ns frontend.fs
  (:require [frontend.config :refer [dir]]))

(defn mkdir
  []
  (js/pfs.mkdir dir))

(defn readdir
  []
  (js/pfs.readdir dir))

(defn read-file
  [path]
  (js/pfs.readFile (str dir "/" path)
                   (clj->js {:encoding "utf8"})))

(defn write-file
  [path content]
  (js/pfs.writeFile (str dir "/" path) content))
