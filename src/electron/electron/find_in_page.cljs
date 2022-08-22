(ns electron.find-in-page
  (:require [electron.window :as win]))

(defn find!
  [^js window search option]
  (when window
    (.findInPage ^js (.-webContents window) search option)))

(defn clear!
  [^js window]
  (when window
    (.stopFindInPage ^js (.-webContents window) "clearSelection")))
