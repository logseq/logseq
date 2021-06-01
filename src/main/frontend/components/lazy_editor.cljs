(ns frontend.components.lazy-editor
  (:require [rum.core :as rum]
            [shadow.lazy :as lazy]
            [frontend.ui :as ui]
            [frontend.state :as state]))

(def lazy-editor (lazy/loadable frontend.extensions.code/editor))

(defonce loaded? (atom false))

(rum/defc editor < rum/reactive
  {:will-mount (fn [state]
                 (lazy/load lazy-editor
                            (fn []
                              (reset! loaded? true)))
                 state)}
  [config id attr code options]
  (let [loaded? (rum/react loaded?)
        theme (state/sub :ui/theme)]
    (if loaded?
      (@lazy-editor config id attr code theme options)
      (ui/loading "CodeMirror"))))
