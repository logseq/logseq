(ns logseq.sdk.utils
  (:require [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [clojure.walk :as walk]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.frontend.content :as db-content]))

(defn- keep-json-keyword?
  [k]
  (some->> (namespace k)
           (contains? #{"block" "db" "file"})
           (not)))

(def remove-hidden-properties cli-common-mcp-tools/remove-hidden-properties)

(def ^:private kw-tag "___kw___") ; unlikely in normal strings; change if you prefer

(defn- encode-kw [v]
  (if (keyword? v)
    ;; __kw__ns/name or __kw__name
    (str kw-tag (if-let [ns (namespace v)]
                  (str ns "/" (name v))
                  (name v)))
    v))

(defn normalize-keyword-for-json
  ([input] (normalize-keyword-for-json input true))
  ([input camel-case?]
   (when input
     (let [pid (some-> (gobj/get js/window "$$callerPluginID"))
           plugin (and pid (plugin-handler/get-plugin-inst pid))
           runtime (some-> plugin
                           (gobj/get "sdk")
                           (gobj/get "runtime"))
           cljs? (= "cljs" runtime)
           input (cond
                   (de/entity? input) (common-entity-util/entity->map input)
                   (sequential? input) (map #(if (de/entity? %)
                                               (common-entity-util/entity->map %)
                                               %) input)
                   :else input)]
       (walk/prewalk
        (fn [a]
          (cond
            (and cljs? (keyword? a))
            (encode-kw a)

            (keyword? a)
            (if (keep-json-keyword? a)
              (str a)
              (cond-> (name a)
                camel-case?
                (csk/->camelCase)))

            (de/entity? a) (:db/id a)
            (uuid? a) (str a)

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

(defn result->js
  [result]
  (-> result
      normalize-keyword-for-json
      bean/->js))

(def ^:export to-clj bean/->clj)
(def ^:export jsx-to-clj jsx->clj)
(def ^:export to-js bean/->js)
(def ^:export to-keyword keyword)
(def ^:export to-symbol symbol)
