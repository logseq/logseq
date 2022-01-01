(ns frontend.fs.macro
  #?(:cljs (:require-macros [frontend.fs.macro])))

(defmacro exception->
  "like `some->`, but pred is (instance? ExceptionInfo x)"
  [expr & forms]
  (let [g (gensym)
        steps (map (fn [step] `(if (instance? cljs.core/ExceptionInfo ~g) ~g (-> ~g ~step))) forms)]
    `(let [~g ~expr
           ~@(interleave (repeat g) (butlast steps))]
       ~(if (empty? steps)
          g
          (last steps)))))

(defmacro exception->>
  [expr & forms]
  (let [g (gensym)
        steps (map (fn [step] `(if (instance? cljs.core/ExceptionInfo ~g) ~g (->> ~g ~step))) forms)]
    `(let [~g ~expr
           ~@(interleave (repeat g) (butlast steps))]
       ~(if (empty? steps)
          g
          (last steps)))))
