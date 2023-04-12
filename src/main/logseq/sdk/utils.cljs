(ns logseq.sdk.utils
  (:require [clojure.walk :as walk]
            [camel-snake-kebab.core :as csk]
            [frontend.util :as util]))

(defn normalize-keyword-for-json
  ([input] (normalize-keyword-for-json input true))
  ([input camel-case?]
   (when input
     (walk/postwalk
       (fn [a]
         (cond
           (keyword? a)
           (cond-> (name a)
                   camel-case?
                   (csk/->camelCase))

           (uuid? a) (str a)
           :else a)) input))))

(defn uuid-or-throw-error
  [s]
  (cond
    (uuid? s)
    s

    (util/uuid-string? s)
    (uuid s)

    :else
    (throw (js/Error. (str s " is not a valid UUID string.")))))