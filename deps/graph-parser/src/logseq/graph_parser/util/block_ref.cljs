(ns logseq.graph-parser.util.block-ref
  "Core vars and util fns for block-refs"
  (:require [clojure.string :as string]))

(def left-parens "Opening characters for block-ref" "((")
(def right-parens "Closing characters for block-ref" "))")
(def left-and-right-parens "Opening and closing characters for block-ref"
  (str left-parens right-parens))
(def block-ref-re #"\(\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\)\)")

(defn get-all-block-ref-ids
  [content]
  (map second (re-seq block-ref-re content)))

(defn get-block-ref-id
  "Extracts block id from block-ref using regex"
  [s]
  (second (re-matches block-ref-re s)))

(defn get-string-block-ref-id
  "Extracts block id from block-ref by stripping parens e.g. ((123)) -> 123.
  This is a less strict version of get-block-ref-id"
  [s]
  (subs s 2 (- (count s) 2)))

(defn block-ref?
  "Determines if string is block ref using regex"
  [s]
  (boolean (get-block-ref-id s)))

(defn string-block-ref?
  "Determines if string is block ref by checking parens. This is less strict version
of block-ref?"
  [s]
  (and (string/starts-with? s left-parens)
       (string/ends-with? s right-parens)))

(defn ->block-ref
  "Creates block ref string given id"
  [block-id]
  (str left-parens block-id right-parens))
