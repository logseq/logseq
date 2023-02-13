(ns frontend.handler.query.builder
  "DSL query builder handler"
  (:require [clojure.walk :as walk]
            [frontend.util :as util]))

;; TODO: make it extensible for Datalog/SPARQL etc.

(def operators [:and :or :not])
(def page-filters [:all-tags :namespace :tags :property :sample])
(def block-filters [:page-ref :property :task :priority :page :full-text-search :between :sample])

(defn- vec-dissoc-item
  [vec idx]
  (into (subvec vec 0 idx) (subvec vec (inc idx))))

(defn- vec-assoc-item
  [vec idx item]
  (into (conj (subvec vec 0 idx) item)
        (subvec vec idx)))

(defn- vec-replace-item
  [vec idx item]
  (into (conj (subvec vec 0 idx) item)
        (subvec vec (inc idx))))

(defn add-element
  [q loc x]
  {:pre [(vector? loc) (some? x)]}
  (cond
    (and (seq loc) (= 1 (count loc)))
    (vec-assoc-item q (first loc) x)

    (seq loc)
    (update-in q (vec (butlast loc))
               (fn [v]
                 (vec-assoc-item v (last loc) x)))

    (seq q)
    (conj q x)

    :else
    [x]))

(defn remove-element
  [q loc]
  {:pre [(vector? loc) (seq loc)]}
  (let [idx (last loc)
        ks (vec (butlast loc))
        f #(vec-dissoc-item % idx)]
    (if (seq ks)
      (update-in q ks f)
      (f q))))

(defn replace-element
  [q loc x]
  {:pre [(vector? loc) (seq loc) (some? x)]}
  (if (= 1 (count loc))
    (vec-replace-item q (first loc) x)
    (update-in q (vec (butlast loc))
               (fn [v]
                 (vec-replace-item v (last loc) x)))))

(defn wrap-operator
  [q loc operator]
  {:pre [(seq q) (seq loc) ((set operators) operator)]}
  (when-let [x (get-in q loc)]
    (let [x' [operator x]]
      (replace-element q loc x'))))

(defn unwrap-operator
  [q loc]
  {:pre [(seq q) (seq loc)]}
  (when-let [x (get-in q loc)]
    (when (and ((set operators) (first x))
               (= 1 (count (rest x))))
      (let [x' (second x)]
        (replace-element q loc x')))))

(defn ->dsl
  [col]
  (walk/prewalk
   (fn [f]
     (cond
       (and (vector? f) (= :page-ref (first f)))
       (symbol (util/format "[[%s]]" (second f)))

       (vector? f)
       (apply list f)

       (and (keyword f) ((set operators) f))
       (symbol f)

       :else f))
   col))

(defn from-dsl
  [dsl-form]
  (walk/prewalk
   (fn [f]
     (cond
       (and (list? f)
            (symbol? (first f))
            ((set operators) (keyword (first f)))) ; operator
       (into [(keyword (first f))] (rest f))

       (list? f)
       (vec f)

       :else f))
   dsl-form))

(comment
  (def q [])

  (-> (add-element q [0] :and)             ; [:and]
      (add-element [1] [:page-ref "foo"])  ; [:and [:page-ref "foo"]]
      (add-element [2] [:page-ref "bar"])  ; [:and [:page-ref "foo"] [:page-ref "bar"]]
      (wrap-operator [1] :or)
      (unwrap-operator [1])
      )

  (->dsl [:and [:page-ref "foo"] [:page-ref "bar"]])
  ;; (and [[foo]] [[bar]])

  (->dsl [:and [:page-ref "foo"] [:or [:page-ref "bar"] [:property :key :value]]])
  ;; (and [[foo]] (or [[bar]] (:property :key :value)))

  )
