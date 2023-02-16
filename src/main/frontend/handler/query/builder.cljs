(ns frontend.handler.query.builder
  "DSL query builder handler"
  (:require [clojure.walk :as walk]
            [frontend.util :as util]))

;; TODO: make it extensible for Datalog/SPARQL etc.

(def operators [:and :or :not])
(def operators-set (set operators))
(def page-filters [:all-tags :namespace :tags :property :sample])
(def page-filters-set (set page-filters))
(def block-filters [:page-ref :property :task :priority :page :full-text-search :between :sample])
(def block-filters-set (set block-filters))

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

(defn append-element
  [q loc x]
  {:pre [(vector? loc) (some? x)]}
  (let [idx (count (get-in q (vec (butlast loc))))
        loc' (vec-replace-item loc (dec (count loc)) idx)]
    (add-element q loc' x)))

(defn remove-element
  [q loc]
  (if (seq loc)
    (let [idx (last loc)
          ks (vec (butlast loc))
          f #(vec-dissoc-item % idx)]
      (if (seq ks)
        (let [result (update-in q ks f)]
          (if (seq (get-in result ks))
            result
            ;; remove the wrapped empty vector
            (remove-element result ks)))
        (f q)))
    ;; default to AND operator
    [:and]))

(defn- replace-element
  [q loc x]
  {:pre [(vector? loc) (seq loc) (some? x)]}
  (if (= 1 (count loc))
    (vec-replace-item q (first loc) x)
    (update-in q (vec (butlast loc))
               (fn [v]
                 (vec-replace-item v (last loc) x)))))

(defn wrap-operator
  [q loc operator]
  {:pre [(seq q) (seq loc) (operators-set operator)]}
  (if (= loc [0])
    [operator q]
    (when-let [x (get-in q loc)]
      (let [x' [operator x]]
        (replace-element q loc x')))))

(defn unwrap-operator
  [q loc]
  {:pre [(seq q) (seq loc)]}
  (if (and (= loc [0]) (operators-set (first q)))
    (second q)
    (when-let [x (get-in q loc)]
      (when (and (operators-set (first x))
                 (= 1 (count (rest x))))
        (let [x' (second x)]
          (replace-element q loc x'))))))

(defn ->dsl
  [col]
  (->>
   (walk/prewalk
    (fn [f]
      (cond
        (and (vector? f) (= :page-ref (first f)))
        (symbol (util/format "[[%s]]" (second f)))

        (and (vector? f) (contains? #{:task :priority :page :between :namespace :tags} (first f)))
        (into [(first f)] (map #(symbol (util/format "[[%s]]" %)) (rest f)))

        :else f))
    col)
   (walk/prewalk
    (fn [f]
      (cond
        (vector? f)
        (cons (symbol (first f)) (rest f))

        :else f)))))

(defn from-dsl
  [dsl-form]
  (walk/prewalk
   (fn [f]
     (cond
       (and (list? f)
            (symbol? (first f))
            (operators-set (keyword (first f)))) ; operator
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
