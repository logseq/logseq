(ns frontend.fs.macro
  #?(:cljs (:require-macros [frontend.fs.macro])))

(defn err? [m] (some? (:err m)))

(defmacro err->
  "like `some->`, but pred is (`err?` x)"
  [expr & forms]
  (let [g (gensym)
        steps (map (fn [step] `(if (err? ~g) ~g (-> ~g ~step))) forms)]
    `(let [~g ~expr
           ~@(interleave (repeat g) (butlast steps))]
       ~(if (empty? steps)
          g
          (last steps)))))
