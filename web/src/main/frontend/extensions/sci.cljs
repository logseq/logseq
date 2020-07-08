(ns frontend.extensions.sci
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [goog.object :as gobj]))

(defn loaded? []
  js/window.sci)

(defonce *loading? (atom true))

(defn eval-string
  [code]
  (when loaded?
    (js/window.sci.evalString code)))

(rum/defc eval-result < rum/reactive
  {:did-mount (fn [state]
                (if (loaded?)
                  (reset! *loading? false)
                  (do
                    (reset! *loading? true)
                    (loader/load
                     (config/asset-uri "/static/js/sci.min.js")
                     (fn []
                       (reset! *loading? false)))))
                state)}
  [code]
  (let [loading? (rum/react *loading?)]
    (if loading?
      (widgets/loading "loading @borkdude/sci")
      [:div
       [:code "Results:"]
       [:div.results.mt-1
        [:pre.pre-wrap-white-space.code
         (try
           (let [result (eval-string code)]
             (str result))
           (catch js/Error e
             (str "Error: " (gobj/get e "message"))))]]])))
