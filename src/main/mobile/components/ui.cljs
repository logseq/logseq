(ns mobile.components.ui
  "Mobile ui"
  (:require [mobile.components.popup :as popup]))

(defn open-popup!
  [content-fn opts]
  (popup/popup-show! nil content-fn opts))
