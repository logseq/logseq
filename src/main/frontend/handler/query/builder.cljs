(ns frontend.handler.query.builder
  "DSL query builder handler"
  (:require [clojure.walk :as walk]
            [frontend.util :as util]))

(def operators #{:and :or :not})
;; [:and (page-ref Foo) [:or (page-ref Bar) (page-ref Baz)]]

;; (def filters #{:page-ref :tags :property})

(defn- dissoc-item-in-vec
  [vec idx]
  (into (subvec vec 0 idx) (subvec vec (inc idx))))

(defn- assoc-item-in-vec
  [vec idx item]
  (into (conj (subvec vec 0 idx) item)
        (subvec vec idx)))

(defn- replace-item-in-vec
  [vec idx item]
  (into (conj (subvec vec 0 idx) item)
        (subvec vec (inc idx))))

(defn add-element
  [q loc x]
  {:pre [(vector? loc) (some? x)]}
  (cond
    (and (seq loc) (= 1 (count loc)))
    (assoc-item-in-vec q (first loc) x)

    (seq loc)
    (update-in q (vec (butlast loc))
               (fn [v]
                 (assoc-item-in-vec v (last loc) x)))

    (seq q)
    (conj q x)

    :else
    [x]))

(defn remove-element
  [q loc]
  {:pre [(vector? loc) (seq loc)]}
  (let [idx (last loc)
        ks (vec (butlast loc))
        f #(dissoc-item-in-vec % idx)]
    (if (seq ks)
      (update-in q ks f)
      (f q))))

(defn replace-element
  [q loc x]
  {:pre [(vector? loc) (seq loc) (some? x)]}
  (if (= 1 (count loc))
    (replace-item-in-vec q (first loc) x)
    (update-in q (vec (butlast loc))
               (fn [v]
                 (replace-item-in-vec v (last loc) x)))))

(defn wrap-operator
  [q loc operator]
  {:pre [(seq q) (seq loc) (operators operator)]}
  (when-let [x (get-in q loc)]
    (let [x' [operator x]]
      (replace-element q loc x'))))

(defn unwrap-operator
  [q loc]
  {:pre [(seq q) (seq loc)]}
  (when-let [x (get-in q loc)]
    (when (and (operators (first x))
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

       (and (keyword f) (operators f))
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
            (operators (keyword (first f)))) ; operator
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
