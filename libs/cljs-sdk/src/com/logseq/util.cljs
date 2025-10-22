(ns com.logseq.util
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [clojure.walk :as walk]))

(def ^:private kw-tag "___kw___")

(defn- decode-kw [v]
  (if (and (string? v) (string/starts-with? v kw-tag))
    (let [s (subs v (count kw-tag))
          i (.indexOf s "/")]
      (if (neg? i)
        (keyword s)                                ; :name
        (keyword (subs s 0 i) (subs s (inc i)))))  ; :ns/name
    v))

(defn ->clj-tagged [js]
  (some->> js
           bean/->clj
           (walk/postwalk (fn [f]
                            (cond
                              (keyword? f)
                              (decode-kw (if-let [ns (namespace f)]
                                           (str ns "/" (name f))
                                           (name f)))

                              (string? f)
                              (decode-kw f)

                              :else
                              f)))))
