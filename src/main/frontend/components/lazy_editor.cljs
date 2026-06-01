(ns frontend.components.lazy-editor
  (:require [clojure.string :as string]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]
            [shadow.lazy :as lazy]))

;; TODO: Why does shadow fail when code is required
#_:clj-kondo/ignore
(def lazy-editor (lazy/loadable frontend.extensions.code.editor/editor))

(defonce loaded? (atom false))

(rum/defc editor-aux
  [config id attr code theme options codemirror-loaded?]
  (let [^js state (ui/useInView #js {:rootMargin "0px"})
        in-view? (.-inView state)
        placeholder [:div
                     {:style {:height (min
                                       (* 23.2 (count (string/split-lines code)))
                                       600)}}]]
    [:div {:ref (.-ref state)}
     (if (and codemirror-loaded? in-view?)
       (@lazy-editor config id attr code theme options)
       placeholder)]))

(rum/defc editor <
  rum/reactive
  {:will-mount
   (fn [state]
     (when-not @loaded?
       (lazy/load lazy-editor
                  (fn []
                    (reset! loaded? true))))
     state)}
  [config id attr code options]
  (let [loaded?' (rum/react loaded?)
        theme   (state/sub :ui/theme)
        code    (or code "")
        code    (string/replace-first code #"\n$" "")]      ;; See-also: #3410
    (editor-aux config id attr code theme options loaded?')))
