(ns frontend.extensions.calc
  (:refer-clojure :exclude [eval])
  (:require [clojure.edn :as edn]
            [clojure.string :as str]
            [frontend.util :as util]
            #?(:clj [clojure.java.io :as io])
            #?(:cljs [shadow.resource :as rc])
            #?(:cljs [rum.core :as rum])
            #?(:clj [instaparse.core :as insta]
               :cljs [instaparse.core :as insta :refer-macros [defparser]])))

;; ======================================================================
;; Interpreter

#?(:clj (def parse (insta/parser (io/resource "grammar/calc.bnf")))
   :cljs (defparser parse (rc/inline "grammar/calc.bnf")))

(defn exception? [e]
  #?(:clj (instance? Exception e)
     :cljs (instance? js/Error e)))

(defn failure? [v]
  (or (insta/failure? v) (exception? v)))

(defn new-env [] (atom {}))

(defn eval* [env ast]
  (insta/transform
   {:number     (comp edn/read-string #(str/replace % "," ""))
    :percent    (fn percent [a] (/ a 100.00))
    :scientific edn/read-string
    :negterm    (fn neg [a] (- a))
    :expr       identity
    :add        +
    :sub        -
    :mul        *
    :div        /
    :pow        (fn pow [a b]
                  #?(:clj (java.lang.Math/pow a b) :cljs (js/Math.pow a b)))
    :log        (fn log [a]
                  #?(:clj (java.lang.Math/log10 a) :cljs (js/Math.log10 a)))
    :ln         (fn ln [a]
                  #?(:clj (java.lang.Math/log a) :cljs (js/Math.log a)))
    :sin        (fn sin [a]
                  #?(:clj (java.lang.Math/sin a) :cljs (js/Math.sin a)))
    :cos        (fn cos [a]
                  #?(:clj (java.lang.Math/cos a) :cljs (js/Math.cos a)))
    :tan        (fn tan [a]
                  #?(:clj (java.lang.Math/tan a) :cljs (js/Math.tan a)))
    :atan       (fn atan [a]
                  #?(:clj (java.lang.Math/atan a) :cljs (js/Math.atan a)))
    :asin       (fn asin [a]
                  #?(:clj (java.lang.Math/asin a) :cljs (js/Math.asin a)))
    :acos       (fn acos [a]
                  #?(:clj (java.lang.Math/acos a) :cljs (js/Math.acos a)))
    :assignment (fn assign! [var val]
                  (swap! env assoc var val)
                  val)
    :toassign   str/trim
    :variable   (fn resolve [var]
                  (let [var (str/trim var)]
                    (or (get @env var)
                        (throw
                         (ex-info (util/format "Can't find variable %s" var)
                                  {:var var})))))}
   ast))

(defn eval
  ([ast] (eval (new-env) ast))
  ([env ast]
   (try
     (if (failure? ast)
       ast
       (first (eval* env ast)))
     (catch #?(:clj Exception :cljs js/Error) e
       e))))

(defn eval-lines [s]
  {:pre [(string? s)]}
  (let [env (new-env)]
    (mapv (fn [line]
            (when-not (str/blank? line)
              (eval env (parse line))))
          (str/split-lines s))))

;; ======================================================================
;; UI

#?(:cljs
   (rum/defc results < rum/reactive
     [calc-atom]
     (when-let [output-lines (rum/react calc-atom)]
       ;; the editor's parent will go into edit mode if any elements are clicked
       ;; if we stop click propagation on this element, we allow the user to
       ;; copy and paste the calc results
       [:div.extensions__code-calc {:on-mouse-down (fn [e]
                                                     (.stopPropagation e))}
        ;; TODO: add react keys
        (for [[i line] (map-indexed vector output-lines)]
          [:div.extensions__code-calc-output-line {:key i}
           [:span (cond
                    (nil? line)           ""
                    (or  (failure? line)) "?"
                    :else                 line)]])])))
