(ns frontend.components.lazy-editor
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [shadow.lazy :as lazy]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.handler.plugin :refer [hook-extensions-enhancer-by-type]]
            [promesa.core :as p]))

;; TODO: Why does shadow fail when code is required
#_:clj-kondo/ignore
(def lazy-editor (lazy/loadable frontend.extensions.code/editor))

(defonce loaded? (atom false))

(rum/defc editor <
  rum/reactive
  {:will-mount
   (fn [state]
     (lazy/load lazy-editor
                (fn []
                  (if-not @loaded?
                    (p/finally
                     (p/all (when-let [enhancers (and config/lsp-enabled?
                                                      (seq (hook-extensions-enhancer-by-type :codemirror)))]
                              (for [{f :enhancer} enhancers]
                                (when (fn? f) (f (. js/window -CodeMirror))))))
                     (fn []
                       (-> (p/delay 200)
                           (p/then #(reset! loaded? true)))))
                    (reset! loaded? true))))
     state)}
  [config id attr code options]
  (let [loaded? (rum/react loaded?)
        theme   (state/sub :ui/theme)
        code    (or code "")
        code    (string/replace-first code #"\n$" "")]      ;; See-also: #3410
    (if loaded?
      (@lazy-editor config id attr code theme options)
      (ui/loading "CodeMirror"))))
