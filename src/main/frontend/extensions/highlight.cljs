(ns frontend.extensions.highlight
  (:require [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(defn- highlight!
  [id attr]
  (when (:data-lang attr)
    (when-let [element (js/document.getElementById id)]
      (js/hljs.highlightElement element))))

(hsx/defc highlight
  [id attr code]
  (hooks/use-effect!
   (fn []
     (highlight! id attr))
   [id attr])
  [:pre.code.pre-wrap-white-space
   [:code (assoc attr :id id)
    code]])

(defn html-export
  [attr code]
  [:pre.pre-wrap-white-space
   [:code attr
    code]])
