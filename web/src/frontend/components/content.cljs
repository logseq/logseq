(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.format :as format]
            [frontend.format.org-mode :as org]
            [frontend.handler :as handler]
            [frontend.util :as util]))

(defn- highlight!
  []
  (doseq [block (-> (js/document.querySelectorAll "pre code")
                    (array-seq))]
    (js/hljs.highlightBlock block)))

(rum/defc html <
  {:did-mount (fn [state]
                (highlight!)

                (handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (highlight!)
                 state)}
  [content format]
  (case format
    (list :png :jpg :jpeg)
    content
    (util/raw-html (format/to-html content format
                                   org/config-with-line-break))))
