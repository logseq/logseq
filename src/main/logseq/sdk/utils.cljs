(ns logseq.sdk.utils
  (:require [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [clojure.walk :as walk]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.db.frontend.content :as db-content]))

(defn- keep-json-keyword?
  [k]
  (some->> (namespace k)
           (contains? #{"block" "db" "file"})
           (not)))

(defn- entity->map
  "Convert a db Entity to a map"
  [e]
  (assert (de/entity? e))
  (assoc (into {} e) :db/id (:db/id e)))

(defn remove-hidden-properties
  [m]
  (->> (remove (fn [[k _v]]
                 (or (= "block.temp" (namespace k))
                     (contains? #{:logseq.property.embedding/hnsw-label-updated-at} k))) m)
       (into {})))

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
            (if (keep-json-keyword? a)
              (str a)
              (cond-> (name a)
                camel-case?
                (csk/->camelCase)))

            (de/entity? a) (:db/id a)
            (uuid? a) (str a)

            ;; @FIXME compatible layer for classic APIs
            (and (map? a) (:block/uuid a) (:block/title a))
            (-> a
                (assoc :block/content (:block/title a)
                       :block/full-title (or (when-let [e (db/entity [:block/uuid (:block/uuid a)])]
                                               (db-content/recur-replace-uuid-in-block-title e))
                                             (:block/title a)))
                remove-hidden-properties)

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
