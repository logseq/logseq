(ns app.basic
  "Basic operations"
  (:require-macros [latte.core :refer [describe beforeEach before it]])
  (:require [latte.chai :refer (expect)]
            [app.util :as util])
  (:refer-clojure :exclude [first get]))

(def cy js/cy)

(describe "basic"
  (beforeEach []
              (.clearIndexedDB cy))
  (before []
          (.visit cy "http://localhost:3001"))

  (it "Search" []
    (.. cy
        (get "#search-button")
        (click)
        (type "welcome to Logseq"))
    (.. cy (get "#ui__ac-inner")
        (should (fn [result]
                  (expect result :to.have.length 1))))
    (util/back-to-home)

    ;; create new page
    (.. cy
        (get "#search-button")
        (click)
        (type "new page"))

    (.wait cy 1000)

    (.. cy
        (get "#search-button")
        (type "{enter}"))

    ;; edit bullet
    (util/edit-block "this is my first bullet {enter}")
    (util/edit-block "this is my second bullet {enter}")
    (util/edit-block "this is my third bullet")
    (util/tab)
    (util/edit-block ", continue editing")
    (util/shift+tab)
    (util/edit-block ", continue {enter}")

    ;; Backspace to delete a block
    (util/edit-block "test")

    ;; delete the previous block
    (dorun (repeatedly 5 util/backspace))

    (.. cy (get ".ls-block")
        (should (fn [result]
                  (expect result :to.have.length 3))))

    (util/edit-block "{enter}")

    ;; Del
    (util/edit-block "test")
    (util/edit-block "{leftarrow}{leftarrow}")
    (util/delete)
    (util/delete)

    ;; FIXME: not working
    ;; (match-content "te")

    (util/edit-block "{enter}")

    ;; Selection
    (dorun (repeatedly 3 util/shift+up))))
