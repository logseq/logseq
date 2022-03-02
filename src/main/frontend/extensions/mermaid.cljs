(ns frontend.extensions.mermaid
  (:require ["mermaid" :as mermaid]
            [rum.core :as rum]))

(mermaid/initialize (clj->js {:startOnLoad true
                              :securityLevel "loose"}))

(rum/defc mermaid-renderer
  [id code on-double-click]
  (rum/use-effect!
   (fn [] (mermaid/contentLoaded))
   [id code])
  [:div.mermaid-container.mermaid
   {:on-mouse-down (fn [e] (.stopPropagation e))
    :on-double-click on-double-click}
   code])
