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
    (try
      (js/katex.render s (gdom/getElement id)
                      #js {:displayMode display?
                           :throwOnError false
                           :strict false})
      (catch js/Error e
        (js/console.error e)))))

(defn- load-and-render!
  [state]
  (if (loaded?)
    (do
      (reset! *loading? false)
      (render! state))
    (do
      (reset! *loading? true)
      (loader/load
       (config/asset-uri "/static/js/katex.min.js")
       (fn []
         (loader/load
          (config/asset-uri "/static/js/mhchem.min.js")
          (fn []
            (reset! *loading? false)
            (render! state)))))))
  state)

(rum/defc latex < rum/reactive
  {:did-mount (fn [state]
                (js/setTimeout #(load-and-render! state) 0)
                state)
   :did-update load-and-render!}
  [id s block? _display?]
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
    [element (if (or block? display?)
               (util/format "$$%s$$" s)
               ;; inline
               (util/format "$%s$" s))]))
