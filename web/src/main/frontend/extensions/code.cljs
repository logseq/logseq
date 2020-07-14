(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.config :as config]))

;; TODO: extracted to a rum mixin
(defn loaded? []
  js/window.katex)

(defonce *loading? (atom true))

(defn highlight!
  [state]
  (let [id (first (:rum/args state))]
    (when-let [element (js/document.getElementById id)]
      (js/hljs.highlightBlock element))))

(rum/defc highlight < rum/reactive
  {:did-mount (fn [state]
                (if (loaded?)
                  (do
                    (reset! *loading? false)
                    (highlight! state))
                  (do
                    (reset! *loading? true)
                    (loader/load
                     (config/asset-uri "/static/js/highlight.min.js")
                     (fn []
                       (reset! *loading? false)
                       (highlight! state)))))
                state)}
  [id attr code]
  (let [loading? (rum/react *loading?)]
    [:pre.pre-wrap-white-space.code
     [:code (assoc attr :id id)
      code]]))

(defn html-export
  [attr code]
  [:pre
   [:code attr
    code]])
