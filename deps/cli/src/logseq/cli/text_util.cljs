(ns logseq.cli.text-util
  "Text utils"
  (:require [clojure.string :as string]))

(defn cut-by
  "Cut string by specified wrapping symbols, only match the first occurrence.
     value - string to cut
     before - cutting symbol (before)
     end - cutting symbol (end)"
  [value before end]
  (let [b-pos (string/index-of value before)
        b-len (count before)]
    (if b-pos
      (let [b-cut (subs value 0 b-pos)
            m-cut (subs value (+ b-pos b-len))
            e-len (count end)
            e-pos (string/index-of m-cut end)]
        (if e-pos
          (let [e-cut (subs m-cut (+ e-pos e-len))
                m-cut (subs m-cut 0 e-pos)]
            [b-cut m-cut e-cut])
          [b-cut m-cut nil]))
      [value nil nil])))