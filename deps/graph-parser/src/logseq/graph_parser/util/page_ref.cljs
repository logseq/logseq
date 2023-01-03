(ns logseq.graph-parser.util.page-ref
  "Core vars and util fns for page-ref. Currently this only handles a logseq
  page-ref e.g. [[page name]]"
  (:require [clojure.string :as string]))

(def left-brackets "Opening characters for page-ref" "[[")
(def right-brackets "Closing characters for page-ref" "]]")
(def left-and-right-brackets "Opening and closing characters for page-ref"
  (str left-brackets right-brackets))

;; common regular expressions
(def page-ref-re "Inner capture and doesn't match nested brackets" #"\[\[(.*?)\]\]")
(def page-ref-without-nested-re "Matches most inner nested brackets" #"\[\[([^\[\]]+)\]\]")
(def page-ref-any-re "Inner capture that matches anything between brackets" #"\[\[(.*)\]\]")

(defn page-ref?
  "Determines if string is page-ref. Avoid using with format-specific page-refs e.g. org"
  [s]
  (and (string/starts-with? s left-brackets)
       (string/ends-with? s right-brackets)))

(defn ->page-ref
  "Create a page ref given a page name"
  [page-name]
  (str left-brackets page-name right-brackets))

(defn get-page-name
  "Extracts page-name from page-ref string"
  [s]
  (second (re-matches page-ref-any-re s)))

(defn get-page-name!
  "Extracts page-name from page-ref and fall back to arg. Useful for when user
  input may (not) be a page-ref"
  [s]
  (or (get-page-name s) s))
