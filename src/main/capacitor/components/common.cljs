(ns capacitor.components.common
  (:require [frontend.util :as utils]))

(defn get-dom-block-uuid
  [^js el]
  (some-> el
    (.closest "[data-blockid]")
    (.-dataset) (.-blockid)
    (uuid)))

(defn get-dom-page-scroll
  [^js el]
  (some-> el (.closest "[part=scroll]")))

(defn keep-keyboard-open
  [^js e]
  (try
    (.keepKeyboardOpen js/window)
    (some-> e (utils/stop))
    (catch js/Error e'
      (js/console.error e'))))