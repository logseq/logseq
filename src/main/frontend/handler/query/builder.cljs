(ns frontend.handler.query.builder
  "DSL query builder handler"
  (:require [clojure.walk :as walk]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [lambdaisland.glogi :as log]
            [frontend.db.query-dsl :as query-dsl]))

;; TODO: make it extensible for Datalog/SPARQL etc.

(def operators [:and :or :not])
(def operators-set (set operators))
(def page-filters ["all page tags"
                   "namespace"
                   "tags"
                   "property"
                   "sample"])
(def block-filters ["page reference"
                    "property"
                    "task"
                    "priority"
                    "page"
                    "full text search"
                    "between"
                    "sample"])

(defn- vec-dissoc-item
  [vec idx]
  (into (subvec vec 0 idx) (subvec vec (inc idx))))

(defn- vec-assoc-item
  [vec idx item]
  (into (conj (subvec vec 0 idx) item)
        (subvec vec idx)))

(defn- vec-replace-item
  [v idx item]
  (into (if (and (coll? item)
                 (not (operators-set (first item))))
          (vec (concat (subvec v 0 idx) item))
          (conj (subvec v 0 idx) item))
        (subvec v (inc idx))))

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

(defn replace-element
  [q loc x]
  {:pre [(vector? loc) (seq loc) (some? x)]}
  (if (= 1 (count loc))
    (vec-replace-item q (first loc) x)
    (update-in q (vec (butlast loc))
               (fn [v]
                 (vec-replace-item v (last loc) x)))))

(defn- fallback-to-default [result default-value failed-data]
  (if (empty? result)
    (do
      (log/error :query-builder/wrap-unwrap-operator-failed failed-data)
      default-value)
    result))

(defn wrap-operator
  [q loc operator]
  {:pre [(seq q) (operators-set operator)]}
  (let [result (if (or (= loc [0]) (empty? loc))
                 [operator q]
                 (when-let [x (get-in q loc)]
                   (let [x' [operator x]]
                     (replace-element q loc x'))))]
    (fallback-to-default result q {:op "wrap-operator"
                                   :q q
                                   :loc loc
                                   :operator operator})))

(defn unwrap-operator
  [q loc]
  {:pre [(seq q) (seq loc)]}
  (let [result (if (and (= loc [0]) (operators-set (first q)))
                 (second q)
                 (when-let [x (get-in q loc)]
                   (when (and (operators-set (first x))
                              (seq (rest x)))
                     (let [x' (rest x)]
                       (replace-element q loc x')))))]
    (fallback-to-default result q {:op "unwrap-operator"
                                   :q q
                                   :loc loc})))

(defn ->page-ref
  [x]
  (if (string? x)
    (symbol (page-ref/->page-ref x))
    (->page-ref (second x))))

(defn- ->dsl*
  [f]
  (cond
    (and (vector? f) (= :priority (keyword (first f))))
    (vec (cons (symbol :priority) (map symbol (rest f))))

    (and (vector? f) (= :task (keyword (first f))))
    (vec (cons (symbol :task) (map symbol (rest f))))

    (and (vector? f) (= :page-ref (keyword (first f))))
    (->page-ref (second f))

    (and (vector? f) (= :page-tags (keyword (first f))))
    [(symbol :page-tags) (->page-ref (second f))]

    (and (vector? f) (= :between (keyword (first f))))
    (into [(symbol :between)] (map ->page-ref (rest f)))

    ;; property key value
    (and (vector? f) (= 3 (count f)) (contains? #{:page-property :property} (keyword (first f))))
    (let [l (if (page-ref/page-ref? (str (last f)))
              (symbol (last f))
              (last f))]
      (into [(symbol (first f))] [(second f) l]))

    (and (vector? f) (contains? #{:page :namespace :tags} (keyword (first f))))
    (into [(symbol (first f))] (map ->page-ref (rest f)))

    :else f))

(defn ->dsl
  [col]
  (->
   (walk/prewalk
    (fn [f]
      (let [f' (->dsl* f)]
        (cond
          (and (vector? f') (keyword (first f')))
          (cons (symbol (first f')) (rest f'))

          :else f')))
    col)
   (query-dsl/simplify-query)))

(defn from-dsl
  [dsl-form]
  (walk/prewalk
   (fn [f]
     (cond
       (and (vector? f) (vector? (first f)))
       [:page-ref (page-ref/get-page-name (str f))]

       (and (string? f) (page-ref/get-page-name f))
       [:page-ref (page-ref/get-page-name f)]

       (and (list? f)
            (symbol? (first f))
            (operators-set (keyword (first f)))) ; operator
       (into [(keyword (first f))] (rest f))

       (list? f)
       (vec f)

       :else f))
   dsl-form))
