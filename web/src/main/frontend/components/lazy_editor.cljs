(ns frontend.components.lazy-editor
  (:require [rum.core :as rum]
            [shadow.lazy :as lazy]
            [frontend.ui :as ui]))

(def lazy-editor (lazy/loadable frontend.extensions.code/editor))

(defonce loaded? (atom false))

(rum/defc editor < rum/reactive
  {:will-mount (fn [state]
                 (lazy/load lazy-editor
                            (fn []
                              (reset! loaded? true)))
                 state)}
  [config id attr code pos_meta]
  (let [loaded? (rum/react loaded?)]
    (if loaded?
      (@lazy-editor config id attr code pos_meta)
      (ui/loading "CodeMirror"))))
