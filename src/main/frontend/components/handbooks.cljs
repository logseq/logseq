(ns frontend.components.handbooks
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.modules.layout.core :as layout]
            ;[shadow.lazy :as lazy]
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

(rum/defc handbooks-popup
  []
  (let [popup-ref (rum/use-ref nil)]
    (rum/use-effect!
     (fn []
       (when-let [^js popup-el (rum/deref popup-ref)]
         (comp
          (layout/setup-draggable-container! popup-el nil))))
     [])

    [:div.cp__handbooks-popup
     {:data-identity "logseq-handbooks"
      :ref popup-ref}
     [:div.cp__handbooks-content-wrap
      (handbooks/content)]]))

(defn toggle-handbooks
  []
  (state/toggle! :ui/handbooks-open?))
