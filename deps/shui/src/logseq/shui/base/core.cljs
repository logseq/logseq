(ns logseq.shui.base.core
  (:require [logseq.shui.util :as util]
            [rum.core :as rum]))

(def button-base (util/lsui-wrap "Button" {:static? false}))
(def link (util/lsui-wrap "Link"))

;; Note: don't define component with rum/defc
;; to be compatible for the radix as-child option
(defn button
  [& props-and-children]
  (let [props (first props-and-children)
        children (rest props-and-children)
        on-key-up' (:on-key-up props)
        children (if (map? props) children (cons props children))
        props (assoc (if (map? props) props {})
                :on-key-up (fn [^js e]
                             ;; TODO: return value
                             (when (fn? on-key-up') (on-key-up' e))
                             (when (= "Enter" (.-key e))
                               (some-> (.-target e) (.click)))))]
    (apply button-base props children)))
