(ns mobile.render
  (:require [frontend.rfx :as rfx]))

(defn app-root
  [component]
  (rfx/provider component))
