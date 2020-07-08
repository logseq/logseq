(ns frontend.extensions.latex
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [goog.dom :as gdom]))

;; TODO: extracted to a rum mixin
(defn loaded? []
  js/window.katex)

(defonce *loading? (atom true))

(defn render!
  [state]
  (let [[id s display?] (:rum/args state)]
    (js/katex.render s (gdom/getElement id)
                     #js {:displayMode display?
                          :throwOnError false})))

(rum/defc latex < rum/reactive
  {:did-mount (fn [state]
                (if (loaded?)
                  (do
                    (reset! *loading? false)
                    (render! state))
                  (do
                    (reset! *loading? true)
                    (loader/load
                     (config/asset-uri "/static/js/katex.min.js")
                     (fn []
                       (reset! *loading? false)
                       (render! state)))))
                state)}
  [id s block? display?]
  (let [loading? (rum/react *loading?)]
    (when loading?
      (widgets/loading "Loading"))
    (let [element (if block?
                    :div.latex
                    :span.latex-inline)]
      [element {:id id
                :class (if loading? "hidden" "initial")}
       s])))
