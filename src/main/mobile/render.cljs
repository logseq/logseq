(ns mobile.render
  "Provides the RFX-backed root wrapper for the mobile app."
  (:require [frontend.rfx :as rfx]))

(defn app-root
  [component]
  (rfx/provider component))
