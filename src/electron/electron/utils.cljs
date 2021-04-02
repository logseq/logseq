(ns electron.utils
  (:require [goog.string :as gstring]))

(defonce mac? (= (.-platform js/process) "darwin"))
(defonce win32? (= (.-platform js/process) "win32"))

(defonce prod? (= js/process.env.NODE_ENV "production"))
(defonce dev? (not prod?))
(defonce logger (js/require "electron-log"))

(defonce open (js/require "open"))
(defonce fetch (js/require "node-fetch"))

(defn format
  [fmt & args]
  (apply gstring/format fmt args))
