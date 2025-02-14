(ns logseq.shui.base.core
  (:require [cljs-bean.core :as bean]
            [logseq.shui.icon.v2 :as tabler-icon]
            [logseq.shui.util :as util]))

(def button-base (util/lsui-wrap "Button" {:static? false}))
(def link (util/lsui-wrap "Link"))

;; Note: used for the shui popup trigger
(defn trigger-as
  ([as & props-or-children]
   (let [[props children] [(first props-or-children) (rest props-or-children)]
         props' (cond->
                 {:on-key-down #(case (.-key %)
                                  (" " "Enter")
                                  (do (some-> (.-target %) (.click))
                                      (.preventDefault %)
                                      (.stopPropagation %))
                                  :dune)}
                  (map? props)
                  (merge props))
         children (if (map? props) children (cons props children))]
     [as props' children])))

;; Note: fix the custom trigger content
;; for the {:as-child true} menu trigger
(defn trigger-child-wrap
  [& props-and-children]
  (let [props (first props-and-children)
        children (rest props-and-children)
        children (if (map? props) children (cons props children))
        children (when (seq children) (daiquiri.interpreter/interpret children))
        props (if (map? props) props {})]
    (apply js/React.createElement "div" (bean/->js props) children)))

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

(defn button-icon
  [variant icon-name {:keys [icon-props size] :as props} child]

  (button
   (merge (dissoc props :icon-props :size)
          {:variant variant
           :data-button :icon
           :style (when size {:width size :height size})})
   (tabler-icon/root (name icon-name) (merge {:size 20
                                              :key "icon"} icon-props))
   child))

(def button-ghost-icon (partial button-icon :ghost))
(def button-outline-icon (partial button-icon :outline))
(def button-secondary-icon (partial button-icon :secondary))
