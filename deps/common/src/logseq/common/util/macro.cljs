(ns logseq.common.util.macro
  "Core vars and util fns for user macros e.g. {{foo}}"
  (:require [clojure.string :as string]))

(def left-braces "Opening characters for macro" "{{")
(def right-braces "Closing characters for macro" "}}")

(defn macro?
  [*s]
  (when-let [s (and (string? *s) (string/trim *s))]
    (and (string/starts-with? s left-braces) (string/ends-with? s right-braces))))

(defn macro-subs
  [macro-content arguments]
  (loop [s macro-content
         args arguments
         n 1]
    (if (seq args)
      (recur
       (string/replace s (str "$" n) (first args))
       (rest args)
       (inc n))
      s)))

(defn- macro-expand-value
  "Checks a string for a macro and expands it if there's a macro entry for it.
   This is a slimmer version of macro-else-cp"
  [val macros]
  (if-let [[_ macro args] (and (string? val)
                               (seq (re-matches #"\{\{(\S+)\s+(.*)\}\}" val)))]
    (if-let [content (get macros macro)]
      (macro-subs content (string/split args #"\s+"))
      val)
    val))

(defn expand-value-if-macro
  [s macros]
  (if (macro? s) (macro-expand-value s macros) s))