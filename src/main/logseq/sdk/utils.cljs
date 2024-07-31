(ns logseq.sdk.utils
  (:require [clojure.walk :as walk]
            [camel-snake-kebab.core :as csk]
            [frontend.util :as util]
            [datascript.impl.entity :as de]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]))

(defn- entity->map
  "Convert a db Entity to a map"
  [e]
  (assert (de/entity? e))
  (assoc (into {} e) :db/id (:db/id e)))

(defn normalize-keyword-for-json
  ([input] (normalize-keyword-for-json input true))
  ([input camel-case?]
   (when input
     (let [input (cond
                   (de/entity? input) (entity->map input)
                   (sequential? input) (map #(if (de/entity? %)
                                               (entity->map %)
                                               %) input)
                   :else input)]
       (walk/prewalk
        (fn [a]
          (cond
            (keyword? a)
            (cond-> (name a)
              camel-case?
              (csk/->camelCase))

            (uuid? a) (str a)

            ;; @FIXME compatible layer for classic APIs
            (and (map? a) (:block/uuid a))
            (some->> (:block/title a) (assoc a :block/content))

            :else a)) input)))))

(defn uuid-or-throw-error
  [s]
  (cond
    (uuid? s)
    s

    (util/uuid-string? s)
    (uuid s)

    :else
    (throw (js/Error. (str s " is not a valid UUID string.")))))

(defn jsx->clj
  [^js obj]
  (if (js/goog.isObject obj)
    (-> (fn [result k]
          (let [v (gobj/get obj k)
                k (keyword (csk/->kebab-case k))]
            (if (= "function" (goog/typeOf v))
              (assoc result k v)
              (assoc result k (jsx->clj v)))))
      (reduce {} (gobj/getKeys obj)))
    obj))

(def ^:export to-clj bean/->clj)
(def ^:export jsx-to-clj jsx->clj)
(def ^:export to-js bean/->js)
(def ^:export to-keyword keyword)
(def ^:export to-symbol symbol)
