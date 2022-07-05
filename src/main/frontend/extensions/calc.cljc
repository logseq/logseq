(ns frontend.extensions.calc
  (:refer-clojure :exclude [eval])
  (:require [clojure.edn :as edn]
            [clojure.string :as str]
            [frontend.util :as util]

            [bignumber.js :as bn]

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

;; TODO: Set DECIMAL_PLACES https://mikemcl.github.io/bignumber.js/#decimal-places

(defn eval* [env ast]
  (insta/transform
   {:number     (comp bn/BigNumber #(str/replace % "," ""))
    :percent    (fn percent [a] (-> a (.dividedBy 100.00)))
    :scientific (comp bn/BigNumber edn/read-string)
    :negterm    (fn neg [a] (-> a (.negated)))
    :expr       identity
    :add        (fn add [a b] (-> a (.plus b)))
    :sub        (fn sub [a b] (-> a (.minus b)))
    :mul        (fn mul [a b] (-> a (.multipliedBy b)))
    :div        (fn div [a b] (-> a (.dividedBy b)))
    :pow        (fn pow [a b]
                  #?(:clj (java.lang.Math/pow a b) :cljs (bn/BigNumber (js/Math.pow a b))))
    :log        (fn log [a]
                  #?(:clj (java.lang.Math/log10 a) :cljs (bn/BigNumber (js/Math.log10 a))))
    :ln         (fn ln [a]
                  #?(:clj (java.lang.Math/log a) :cljs (bn/BigNumber (js/Math.log a))))
    :exp        (fn ln [a]
                  #?(:clj (java.lang.Math/exp a) :cljs (bn/BigNumber (js/Math.exp a))))
    :sqrt       (fn sqrt [a]
                  #?(:clj (java.lang.Math/sqrt a) :cljs (bn/BigNumber (js/Math.sqrt a))))
    :abs        (fn abs [a]
                  #?(:clj (java.lang.Math/abs a) :cljs (bn/BigNumber (js/Math.abs a))))
    :sin        (fn sin [a]
                  #?(:clj (java.lang.Math/sin a) :cljs (bn/BigNumber(js/Math.sin a))))
    :cos        (fn cos [a]
                  #?(:clj (java.lang.Math/cos a) :cljs (bn/BigNumber(js/Math.cos a))))
    :tan        (fn tan [a]
                  #?(:clj (java.lang.Math/tan a) :cljs (bn/BigNumber(js/Math.tan a))))
    :atan       (fn atan [a]
                  #?(:clj (java.lang.Math/atan a) :cljs (bn/BigNumber(js/Math.atan a))))
    :asin       (fn asin [a]
                  #?(:clj (java.lang.Math/asin a) :cljs (bn/BigNumber(js/Math.asin a))))
    :acos       (fn acos [a]
                  #?(:clj (java.lang.Math/acos a) :cljs (bn/BigNumber(js/Math.acos a))))
    :assignment (fn assign! [var val]
                  (swap! env assoc var val)
                  val)
    :toassign   str/trim
    :comment    (constantly nil)
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

(defn assign-last-value [env val]
  (when-not (nil? val)
    (swap! env assoc "last" val))
  val)

(defn eval-lines [s]
  {:pre [(string? s)]}
  (let [env (new-env)]
    (mapv (fn [line]
            (when-not (str/blank? line)
              (assign-last-value env (eval env (parse line)))))
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
       [:div.extensions__code-calc.pr-2 {:on-mouse-down (fn [e]
                                                          (.stopPropagation e))}
        ;; TODO: add react keys
        (for [[i line] (map-indexed vector output-lines)]
          [:div.extensions__code-calc-output-line.CodeMirror-line {:key i}
           [:span (cond
                    (nil? line)           ""
                    (failure? line) "?"
                    :else                 (str line))]])])))
