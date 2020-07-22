(ns frontend.extensions.latex
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.util :as util]
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
      (ui/loading "Loading"))
    (let [element (if block?
                    :div.latex
                    :span.latex-inline)]
      [element {:id id
                :class (if loading? "hidden" "initial")}
       s])))

(defn html-export
  [s block? display?]
  (let [element (if block?
                  :div.latex
                  :span.latex-inline)]
    [element (cond
               block?
               (util/format "$$%s$$" s)

               :display?
               (util/format "$$%s$$" s)

               :else
               ;; inline
               (util/format "$%s$" s))]))
