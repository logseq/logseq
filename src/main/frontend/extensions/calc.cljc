(ns frontend.extensions.calc
  (:refer-clojure :exclude [eval])
  (:require [clojure.string :as str]
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

(def constants {
  "PI" (bn/BigNumber "3.14159265358979323846")
  "E"  (bn/BigNumber "2.71828182845904523536")})

(defn exception? [e]
  #?(:clj (instance? Exception e)
     :cljs (instance? js/Error e)))

(defn failure? [v]
  (or (insta/failure? v) (exception? v)))

(defn new-env [] (atom {}))

;; TODO: Set DECIMAL_PLACES https://mikemcl.github.io/bignumber.js/#decimal-places

(defn factorial [n]
  (reduce
    (fn [a b] (.multipliedBy a b))
    (bn/BigNumber 1)
    (range 2 (inc n))))

(defn eval* [env ast]
  (insta/transform
   {:number     (comp bn/BigNumber #(str/replace % "," ""))
    :percent    (fn percent [a] (-> a (.dividedBy 100.00)))
    :scientific bn/BigNumber
    :mixed-number (fn [whole numerator denominator]
                    (.plus (.dividedBy (bn/BigNumber numerator) denominator) whole))
    :negterm    (fn neg [a] (-> a (.negated)))
    :expr       identity
    :add        (fn add [a b] (-> a (.plus b)))
    :sub        (fn sub [a b] (-> a (.minus b)))
    :mul        (fn mul [a b] (-> a (.multipliedBy b)))
    :div        (fn div [a b] (-> a (.dividedBy b)))
    :mod        (fn mod [a b] (-> a (.modulo b)))
    :pow        (fn pow [a b] (if (.isInteger b)
                                  (.exponentiatedBy a b)
                                  #?(:clj (java.lang.Math/pow a b)
                                     :cljs (bn/BigNumber (js/Math.pow a b)))))
    :factorial  (fn fact [a] (if (and (.isInteger a) (.isPositive a) (.isLessThan a 254))
                                 (factorial (.toNumber a))
                                 (bn/BigNumber 'NaN')))
    :abs        (fn abs [a] (.abs a))
    :sqrt       (fn sqrt [a] (.sqrt a))
    :log        (fn log [a]
                  #?(:clj (java.lang.Math/log10 a) :cljs (bn/BigNumber (js/Math.log10 a))))
    :ln         (fn ln [a]
                  #?(:clj (java.lang.Math/log a) :cljs (bn/BigNumber (js/Math.log a))))
    :exp        (fn exp [a]
                  #?(:clj (java.lang.Math/exp a) :cljs (bn/BigNumber (js/Math.exp a))))
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
                  (if (contains? constants var)
                    (throw
                      (ex-info (util/format "Can't redefine constant %s" var) {:var var}))
                    (swap! env assoc var val))
                  val)
    :toassign   str/trim
    :comment    (constantly nil)
    :digits     int
    :format-fix (fn format [places]
                  (swap! env assoc :mode "fix" :places places)
                  (get @env "last"))
    :format-sci (fn format [places]
                  (swap! env assoc :mode "sci" :places places)
                  (get @env "last"))
    :format-frac (fn format [max-denominator]
                  (swap! env dissoc :mode :improper)
                  (swap! env assoc :mode "frac" :max-denominator max-denominator)
                  (get @env "last"))
    :format-impf (fn format [max-denominator]
                  (swap! env assoc :mode "frac" :max-denominator max-denominator :improper true)
                  (get @env "last"))
    :format-norm (fn format [precision]
                  (swap! env dissoc :mode :places)
                  (swap! env assoc :precision precision)
                  (get @env "last"))
    :base       (fn base [b]
                  (swap! env assoc :base (str/lower-case b))
                  (get @env "last"))
    :variable   (fn resolve [var]
                  (let [var (str/trim var)]
                    (or (get constants var)
                        (get @env var)
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

(defn can-fix?
  "Check that number can render without loss of all significant digits,
   and that the absolute value is less than 1e21."
  [num places]
  (or (.isZero num )
    (let [mag (.abs num)
          lower-bound (-> (bn/BigNumber 0.5) (.shiftedBy (- places)))
          upper-bound (bn/BigNumber 1e21)]
      (and (-> mag (.isGreaterThanOrEqualTo lower-bound))
           (-> mag (.isLessThan upper-bound))))))

(defn can-fit?
  "Check that number can render normally within the given number of digits.
   Tolerance allows for leading zeros in a decimal fraction."
  [num digits tolerance]
  (and (< (.-e num) digits)
       (.isInteger (.shiftedBy num (+ tolerance digits)))))

(defn format-base [val base]
  (let [sign (.-s val)
       display-val (if (neg-int? sign) (.abs val) val)]
    (str
      (when (neg-int? sign) "-")
      (case base 2 "0b" 8 "0o" 16 "0x")
      (.toString display-val base))))

(defn format-fraction [numerator denominator improper]
  (let [whole (.dividedToIntegerBy numerator denominator)]
    (if (or improper (.isZero whole))
      (str numerator "/" denominator )
      (str whole " "
           (.abs (.modulo numerator denominator)) "/" denominator))))

(defn format-normal [env val]
  (let [precision (or (get @env :precision) 21)
        display-val (.precision val precision)]
    (if (can-fit? display-val precision 1)
      (.toFixed display-val)
      (.toExponential display-val))))

(defn format-val [env val]
  (if (instance? bn/BigNumber val)
    (let [mode (get @env :mode)
          base (get @env :base)
          places (get @env :places)]
      (cond
        (= base "hex")
          (format-base val 16)
        (= base "oct")
          (format-base val 8)
        (= base "bin")
          (format-base val 2)

        (= mode "fix")
          (if (can-fix? val places)
            (.toFixed val places)
            (.toExponential val places))
        (= mode "sci")
          (.toExponential val places)
        (= mode "frac")
          (let [max-denominator (or (get @env :max-denominator) 4095)
                improper  (get @env :improper)
                [numerator denominator] (.toFraction val max-denominator)
                delta (.minus (.dividedBy numerator denominator) val)]
            (if (or (.isZero delta) (< (.-e delta) -16))
              (if (> denominator 1)
                (format-fraction numerator denominator improper)
                (format-normal env numerator))
              (format-normal env val)))

        :else
          (format-normal env val)))
    val))

(defn eval-lines [s]
  {:pre [(string? s)]}
  (let [env (new-env)]
    (mapv (fn [line]
            (when-not (str/blank? line)
              (format-val env (assign-last-value env (eval env (parse line))))))
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
