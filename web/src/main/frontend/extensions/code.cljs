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
  (let [[id attr] (:rum/args state)
        done? (get state ::done?)]
    (when (:data-lang attr)
      (when-let [element (js/document.getElementById id)]
        (js/hljs.highlightBlock element)))
    (reset! done? true)))

(rum/defcs highlight < rum/reactive
  (rum/local false ::done?)
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
  [state id attr code]
  (let [loading? (rum/react *loading?)
        done? @(get state ::done?)]
    [:pre.code
     [:code (assoc attr
                   :id id
                   :style {:opacity (if done? 1 0)})
      code]]))

(defn html-export
  [attr code]
  [:pre
   [:code attr
    code]])
