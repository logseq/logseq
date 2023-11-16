(ns logseq.shui.rum
  (:require [clojure.string :as str]
            [daiquiri.normalize :as normalize]
            [daiquiri.util :as util]
            [cljsjs.react]
            [goog.object :as gobj]))

(defn ^js/React.Element create-element
  "Create a React element. Returns a JavaScript object when running
  under ClojureScript, and a om.dom.Element record in Clojure."
  [type attrs children]
  (.apply (.-createElement js/React) nil (.concat #js [type attrs] children)))

(defn component-attributes [attrs]
  (let [x (util/camel-case-keys* attrs)]
    (let [m (js-obj)]
      (doseq [[k v] x]
        (gobj/set m (name k) v))
      m)))

(defn element-attributes [attrs]
  (when-let [^js js-attrs (clj->js (util/html-to-dom-attrs attrs))]
    (let [class (.-className js-attrs)
          class (if (array? class) (str/join " " class) class)]
      (when (.-onChange js-attrs)
        ;; Wrapping on-change handler to work around async rendering queue
        ;; that causes jumping caret and lost characters in input fields
        (set! (.-onChange js-attrs) (js/rum.core.mark_sync_update (.-onChange js-attrs))))
      (if (str/blank? class)
        (js-delete js-attrs "className")
        (set! (.-className js-attrs) class))
      js-attrs)))

(declare interpret)

(defn- ^array interpret-seq
  "Eagerly interpret the seq `x` as HTML elements."
  [x]
  (reduce
    (fn [ret x]
      (conj ret (interpret x)))
    [] x))

(defn element
  "Render an element vector as a HTML element."
  [element]
  (let [[type attrs content] (normalize/element element)]
    (create-element type
      (element-attributes attrs)
      (interpret-seq content))))

(defn fragment [[_ attrs & children]]
  (let [[attrs children] (if (map? attrs)
                           [(component-attributes attrs) (interpret-seq children)]
                           [nil (interpret-seq (into [attrs] children))])]
    (create-element js/React.Fragment attrs children)))

(defn interop [[_ component attrs & children]]
  (let [[attrs children] (if (map? attrs)
                           [(component-attributes attrs) (interpret-seq children)]
                           [nil (interpret-seq (into [attrs] children))])]
    (create-element component attrs children)))

(defn- interpret-vec
  "Interpret the vector `x` as an HTML element or a the children of an
  element."
  [x]
  (cond
    (util/fragment? x) (fragment x)
    (keyword-identical? :> (nth x 0 nil)) (interop x)
    (util/element? x) (element x)
    :else (interpret-seq x)))

(defn interpret [v]
  (cond
    (vector? v) (interpret-vec v)
    (seq? v) (interpret-seq v)
    :else v))

