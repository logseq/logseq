(ns frontend.hooks
  "React custom hooks."
  (:refer-clojure :exclude [ref deref])
  (:require [datascript.impl.entity :refer [Entity]]
            [rum.core :as rum]))

(defn- safe-dep
  "js/React use `js/Object.is` to compare dep-value and its previous value.
  Some cljs built-in types(keyword, symbol, uuid) would not be identical, even they are value-equal"
  [dep]
  (if (contains? #{"string" "number" "boolean" "null"} (goog/typeOf dep))
    dep
    (cond
      (or (keyword? dep)
          (symbol? dep)
          (uuid? dep))
      (str dep)

      (instance? Entity dep)
      ;; NOTE: only :db/id is considered, without taking the entity-db into account
      ;; so, same entity-id but different db will be "equal" here
      (:db/id dep)

      :else
      (throw (ex-info (str "Not supported dep type:" (type dep)) {:dep dep})))))

(defn use-memo
  ([f] (rum/use-memo f))
  ([f deps] (rum/use-memo f (map safe-dep deps))))

(defn use-effect!
  ([setup-fn] (rum/use-effect! setup-fn))
  ([setup-fn deps] (rum/use-effect! setup-fn (map safe-dep deps))))

(defn use-layout-effect!
  ([setup-fn] (rum/use-layout-effect! setup-fn))
  ([setup-fn deps] (rum/use-layout-effect! setup-fn (map safe-dep deps))))

(defn use-callback
  ([callback] (rum/use-callback callback))
  ([callback deps] (rum/use-callback callback (map safe-dep deps))))

;;; unchanged hooks, link to rum/use-xxx directly
(def use-ref rum/use-ref)
(def create-ref rum/create-ref)
(def deref rum/deref)
(def set-ref! rum/set-ref!)

(def use-state rum/use-state)
(def use-reducer rum/use-reducer)
