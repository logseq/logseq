(ns logseq.publish.latex
  (:require [rum.core :as rum]
            [logseq.publish.util :as util]
            [goog.dom :as gdom]))

;; (defn render!
;;   [state]
;;   (let [[id s display?] (:rum/args state)]
;;     (try
;;       (when-let [elem (gdom/getElement id)]
;;         (js/katex.render s elem
;;                          #js {:displayMode display?
;;                               :throwOnError false
;;                               :strict false}))

;;       (catch :default e
;;         (js/console.error e)))))


(rum/defc latex < rum/reactive
  [id s block? _display?]
  (let [element (if block?
                  :div.latex
                  :span.latex-inline)]
    [element {:id    id
              :class "initial"}
     [:span.opacity-0 s]]))

(defn html-export
  [s block? display?]
  (let [element (if block?
                  :div.latex
                  :span.latex-inline)]
    [element (if (or block? display?)
               (util/format "$$%s$$" s)
               ;; inline
               (util/format "$%s$" s))]))
