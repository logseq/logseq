(ns frontend.components.lazy-editor
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key]]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]
            [shadow.lazy :as lazy]))

;; TODO: Why does shadow fail when code is required
#_:clj-kondo/ignore
(def lazy-editor (lazy/loadable frontend.extensions.code/editor))

(defonce loaded? (atom false))

(hsx/defc editor-aux
  [config id attr code options codemirror-loaded?]
  (let [^js state (ui/useInView #js {:rootMargin "0px"})
        in-view? (.-inView state)
        placeholder [:div
                     {:style {:height (min
                                       (* 23.2 (count (string/split-lines code)))
                     600)}}]]
    [:div {:ref (.-ref state)}
     (if (and codemirror-loaded? in-view?)
       (@lazy-editor config id attr code options)
       placeholder)]))

(hsx/defc editor
  [config id attr code options]
  (hooks/use-effect!
   (fn []
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
                      (reset! loaded? true))))))
   [])
  (let [[loaded?'] (hooks/use-atom loaded?)
        code    (or code "")
        code    (string/replace-first code #"\n$" "")]      ;; See-also: #3410
    (editor-aux config id attr code options loaded?')))
