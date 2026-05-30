(ns frontend.components.handbooks
  (:require ;[shadow.lazy :as lazy]
   [frontend.extensions.handbooks.core :as handbooks]
   [frontend.modules.layout.core :as layout]
   [frontend.state :as state]
   [logseq.shui.hooks :as hooks]
   [io.factorhouse.hsx.core :as hsx]))

;(def lazy-handbooks (lazy/loadable frontend.extensions.handbooks.core/content))

(hsx/defc handbooks-popup
  []
  (let [popup-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (when-let [^js popup-el (hooks/deref popup-ref)]
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
