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

(defn wrap-text
  "Wraps a string to a given width without breaking words. Returns a single string with newlines."
  [s width]
  (->> (loop [remaining (string/trim s)
              acc []]
         (if (empty? remaining)
           acc
           (if (<= (count remaining) width)
             (conj acc remaining)
             (let [substring (subs remaining 0 width)
                   split-idx (or (string/last-index-of substring \space)
                                 (string/last-index-of substring \tab)
                                 ;; fallback: hard split
                                 80)
                   line (subs remaining 0 split-idx)
                   rest' (subs remaining split-idx)]
               (recur (string/triml rest')
                      (conj acc line))))))
       (string/join "\n")))
