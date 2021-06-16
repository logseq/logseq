(ns app.window
  (:require-macros [latte.core :refer [describe beforeEach before it]])
  (:require [latte.chai :refer (expect)])
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


(describe "Window"
  (beforeEach []
              (.clearIndexedDB cy))
  (before []
          (.visit cy "http://localhost:3001"))

  (it "Search" []
    (.. cy
        (get "#search-field")
        (click)
        (type "welcome to Logseq"))
    (.. cy (get "#ui__ac-inner")
        (should (fn [result]
                  (expect result :to.have.length 1))))
    (back-to-home)

    ;; create new page
    (.. cy
        (get "#search-field")
        (click)
        (type "new page"))

    (.wait cy 1000)

    (.. cy
        (get "#search-field")
        (type "{enter}"))

    ;; edit bullet
    (edit-block "this is my first bullet {enter}")
    (edit-block "this is my second bullet {enter}")))
