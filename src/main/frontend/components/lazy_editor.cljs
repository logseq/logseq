(ns frontend.components.lazy-editor
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key]]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [promesa.core :as p]
            [rum.core :as rum]
            [shadow.lazy :as lazy]))

;; TODO: Why does shadow fail when code is required
#_:clj-kondo/ignore
(def lazy-editor (lazy/loadable frontend.extensions.code/editor))

(defonce loaded? (atom false))

(rum/defcs editor <
  rum/reactive
  {:will-mount
   (fn [state]
     (when-not @loaded?
       (lazy/load lazy-editor
                  (fn []
                    (if-not @loaded?
                      (p/finally
                        (p/all (when-let [enhancers (and config/lsp-enabled?
                                                         (seq (hook-extensions-enhancers-by-key :codemirror)))]
                                 (for [{f :enhancer} enhancers]
                                   (when (fn? f) (f (. js/window -CodeMirror))))))
                        (fn []
                          (reset! loaded? true)))
                      (reset! loaded? true)))))
     (let [*loading? (atom true)
           timeout (js/setTimeout #(reset! *loading? false) 0)]
       (assoc state
              ::loading? *loading?
              ::timeout timeout)))
   :will-unmount (fn [state]
                   (js/clearTimeout (::timeout state))
                   state)}
  [state config id attr code options]
  (let [*loading? (::loading? state)
        loaded?' (rum/react loaded?)
        theme   (state/sub :ui/theme)
        code    (or code "")
        code    (string/replace-first code #"\n$" "")]      ;; See-also: #3410
    (if (or (not loaded?') (rum/react *loading?))
      (ui/loading "CodeMirror")
      (@lazy-editor config id attr code theme options))))
