(ns app.template
  "Template related operations"
  (:require-macros [latte.core :refer [describe beforeEach before it]])
  (:require [latte.chai :refer (expect)]
            [app.util :as util])
  (:refer-clojure :exclude [first get]))

(def cy js/cy)

(describe "template"
          (beforeEach []
                      (.clearIndexedDB cy)
                      (cy.wait 1000))
          (before []
                  (.visit cy "http://localhost:3001"))
          (it "template-basic" []
              (.. cy
                  (get "#search-button")
                  (click)
                  (type "template test page")
                  (wait 1000)
                  (type "{enter}"))
              (util/edit-block "template")
              (.. cy
                  (realPress #js ["Shift" "Enter"]))
              (util/edit-block "template:: template-name{enter}")
              (util/tab)
              (util/edit-block "line1{enter}")
              (util/edit-block "line2{enter}")
              (util/tab)
              (util/edit-block "line3")
              (.. cy
                  (get ".ls-block")
                  (should (fn [result]
                            (expect result :to.have.length 4))))
              (dorun (repeatedly 3 #(util/edit-block "{enter}")))

              (util/edit-block "/template{enter}")
              (util/edit-block "template-name{enter}")
              (cy.wait 1000)
              (.. cy
                  (get ".ls-block")
                  (should (fn [result]
                            (expect result :to.have.length 8))))))
