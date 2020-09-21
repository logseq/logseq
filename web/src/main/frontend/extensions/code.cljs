(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.config :as config]))

(defn highlight!
  [state]
  (let [[id attr] (:rum/args state)]
    (when (:data-lang attr)
      (when-let [element (js/document.getElementById id)]
        (js/hljs.highlightBlock element)))))

(rum/defcs highlight < rum/reactive
  {:did-mount (fn [state]
                (highlight! state)
                state)}
  [state id attr code]
  [:pre.code.pre-wrap-white-space
   [:code (assoc attr :id id)
    code]])

(defn html-export
  [attr code]
  [:pre.pre-wrap-white-space
   [:code attr
    code]])
