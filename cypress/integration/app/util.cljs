(ns app.util
  (:refer-clojure :exclude [first get]))

(def cy js/cy)

(defn back-to-home
  []
  (.. cy (get ".cp__header-logo")
      (first)
      (click)))

(defn edit-block
  [content]
  (.. cy (get "textarea")
      (first)
      (click)
      (type content)))

(defn tab
  []
  (.. cy (realPress "Tab")))

(defn shift+tab
  []
  (.. cy (realPress #js ["Shift" "Tab"])))

(defn shift+up
  []
  (.. cy (realPress #js ["Shift" "ArrowUp"])))

(defn shift+down
  []
  (.. cy (realPress #js ["Shift" "ArrowDown"])))

(defn backspace
  []
  (edit-block "{backspace}"))

(defn delete
  []
  (.. cy (realPress "Delete")))

(defn match-content
  [value]
  (.. cy (get "textarea") (first)
      (should "have.value" value)))
