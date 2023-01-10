(ns frontend.components.handbooks
  (:require [shadow.lazy :as lazy]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.extensions.handbooks.core :as handbooks]))

#_:clj-kondo/ignore
;(def lazy-handbooks (lazy/loadable frontend.extensions.handbooks.core/content))
;
;(rum/defc loadable-handbooks
;  []
;  (let [[content set-content] (rum/use-state nil)]
;
;    (rum/use-effect!
;     (fn []
;       (lazy/load lazy-handbooks #(set-content %))) [])
;
;    [:div.cp__handbooks-content
;     content]))

(rum/defc handbooks
  []

  [:div.cp__handbooks-content-wrap
   (handbooks/content)])

(defn open-handbooks
  []
  (state/set-modal!
   #(handbooks)
   {:center? true}))