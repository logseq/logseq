(ns frontend.extensions.sci
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]))

(defn loaded? []
  js/window.sci)

(defonce *loading? (atom true))

(defn ->js
  [x]
  (when (loaded?)
    (js/window.sci.toJS x)))

(defn eval-string
  [code]
  (when (loaded?)
    (js/window.sci.evalString code)))

(defn call-fn
  [f & args]
  (-> (apply f (bean/->js args))
      (->js)
      (bean/->clj)))

(defn load!
  []
  (loader/load
   (config/asset-uri "/static/js/sci.min.js")
   (fn []
     (reset! *loading? false))))

(rum/defc eval-result < rum/reactive
  {:did-mount (fn [state]
                (if (loaded?)
                  (reset! *loading? false)
                  (do
                    (reset! *loading? true)
                    (load!)))
                state)}
  [code]
  (let [loading? (rum/react *loading?)]
    (if loading?
      (widgets/loading "loading @borkdude/sci")
      [:div
       [:code "Results:"]
       [:div.results.mt-1
        [:pre.code
         (try
           (let [result (eval-string code)]
             (str result))
           (catch js/Error e
             (str "Error: " (gobj/get e "message"))))]]])))
