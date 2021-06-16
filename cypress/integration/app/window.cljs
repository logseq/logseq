(ns app.window
  (:require-macros [latte.core :refer [describe beforeEach it]]))

(def cy js/cy)

(describe "Window"
  (beforeEach []
    (.visit cy "https://example.cypress.io/commands/window"))
  (it "cy.window() - get the global window object" []
    (.should (.window cy) "have.property" "top")))
