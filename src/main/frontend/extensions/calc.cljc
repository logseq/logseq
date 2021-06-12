(ns frontend.extensions.calc
  (:refer-clojure :exclude [eval])
  (:require #?(:clj [clojure.java.io :as io])
            #?(:cljs [shadow.resource :as rc])
            #?(:cljs [rum.core :as rum])
            [clojure.string :as str]
            [clojure.edn :as edn]
            [clojure.test :as test :refer [deftest testing is are]]
            [frontend.util :as util]
            #?(:clj [instaparse.core :as insta]
               :cljs [instaparse.core :as insta :refer-macros [defparser]])))

;; ======================================================================
;; Interpreter

#?(:clj (def parse (insta/parser (io/resource "grammar/calc.bnf")))
   :cljs (defparser parse (rc/inline "grammar/calc.bnf")))

(defn new-env [] (atom {}))

(defn eval
  ([ast] (eval (new-env) ast))
  ([env ast]
   (doall
    (insta/transform
     {:number     edn/read-string
      :expr       identity
      :add        +
      :sub        -
      :mul        *
      :div        /
      :pow        (fn [a b]
                    #?(:clj (java.lang.Math/pow a b) :cljs (js/Math.pow a b)))
      :log        (fn [a]
                    #?(:clj (java.lang.Math/log10 a) :cljs (js/Math.log10 a)))
      :ln         (fn [a]
                    #?(:clj (java.lang.Math/log a) :cljs (js/Math.log a)))
      :sin        (fn [a]
                    #?(:clj (java.lang.Math/sin a) :cljs (js/Math.sin a)))
      :cos        (fn [a]
                    #?(:clj (java.lang.Math/cos a) :cljs (js/Math.cos a)))
      :tan        (fn [a]
                    #?(:clj (java.lang.Math/tan a) :cljs (js/Math.tan a)))
      :atan       (fn [a]
                    #?(:clj (java.lang.Math/atan a) :cljs (js/Math.atan a)))
      :asin       (fn [a]
                    #?(:clj (java.lang.Math/asin a) :cljs (js/Math.asin a)))
      :acos       (fn [a]
                    #?(:clj (java.lang.Math/acos a) :cljs (js/Math.acos a)))
      :assignment (fn [var val]
                    (swap! env assoc var val)
                    val)
      :toassign   str/trim
      :variable   (fn [var]
                    (let [var (str/trim var)]
                      (or (get @env var)
                          (throw (ex-info (util/format "Can't find variable %s" var)
                                          {:var var})))))}
     ast))))

#?(:cljs
   (defn eval-lines [s]
     {:pre [(string? s)]}
     (let [env (new-env)]
       (->> (str/split-lines s)
            (mapv (fn [line]
                    (try
                      (first (eval env (parse line)))
                      (catch js/Error e
                        nil))))))))

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
           [:span (or line "?")]])])))
