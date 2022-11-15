(ns logseq.publish.util
  "Utility fns."
  #?(:cljs (:require-macros [logseq.publish.util]))
  #?(:cljs (:require [goog.string :as gstring]
                     [cljs-time.coerce :as tc]
                     [cljs-time.core :as t]))
  (:require [clojure.walk :as walk]))

(defn time-ms
  []
  #?(:cljs (tc/to-long (t/now))))

#?(:clj
   (defmacro profile
     [k & body]
     `(let [st# (logseq.publish.util/time-ms)
            res# (do ~@body)
            se# (logseq.publish.util/time-ms)]
        (println (str "[" ~k "] spent time: " (- se# st#)))
        res#)))

#?(:clj
   (defmacro profile-with-time
     [& body]
     `(let [st# (logseq.publish.util/time-ms)
            res# (do ~@body)
            se# (logseq.publish.util/time-ms)
            time# (- se# st#)]
        {:result res#
         :time time#})))

(defn- sort-by-left
  [blocks parent]
  (let [left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
    (loop [block parent
           result []]
      (if-let [next (get left->blocks (:db/id block))]
        (recur next (conj result next))
        (vec result)))))

(defn- blocks->vec-tree-aux
  [blocks root]
  (let [id-map (fn [m] {:db/id (:db/id m)})
        root (id-map root)
        parent-blocks (group-by :block/parent blocks)
        sort-fn (fn [parent]
                  (sort-by-left (get parent-blocks parent) parent))
        block-children (fn block-children [parent level]
                         (map (fn [m]
                                (let [parent (id-map m)
                                      children (-> (block-children parent (inc level))
                                                   (sort-by-left parent))]
                                  (assoc m
                                         :block/level level
                                         :block/children children)))
                           (sort-fn parent)))]
    (block-children root 1)))

(defn blocks->vec-tree
  "`blocks` need to be in the same page."
  [blocks root-id]
  (let [root (first (filter #(= (:block/uuid %) root-id) blocks))
        blocks (remove #(= (:block/uuid %) root-id) blocks)
        result (blocks->vec-tree-aux blocks root)]
    (let [root-block (assoc root :block/children result)]
      [root-block])))

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

#?(:cljs
   (defn format
     [fmt & args]
     (apply gstring/format fmt args)))

(defn safe-re-find
  [pattern s]
  (when (string? s)
    (re-find pattern s)))

#?(:cljs
   (defn url-encode
     [string]
     (some-> string str (js/encodeURIComponent) (.replace "+" "%20"))))

(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "(?i)^" uuid-pattern "$")))
(defn uuid-string?
  [s]
  (safe-re-find exactly-uuid-pattern s))

(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map."
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (into {} (remove (comp nil? second)) el)
       el))
   nm))

(defn distinct-by
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f %)) acc)
       acc
       (vec (conj acc x))))
   []
   col))

;; from medley
(defn indexed
  "Returns an ordered, lazy sequence of vectors `[index item]`, where item is a
  value in coll, and index its position starting from zero. Returns a transducer
  when no collection is provided."
  ([]
   (fn [rf]
     (let [i (volatile! -1)]
       (fn
         ([] (rf))
         ([result] (rf result))
         ([result x]
          (rf result [(vswap! i inc) x]))))))
  ([coll]
   (map-indexed vector coll)))
