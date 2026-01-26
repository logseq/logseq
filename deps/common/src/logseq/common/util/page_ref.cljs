(ns logseq.common.util.page-ref
  "Core vars and util fns for page-ref. Currently this only handles a logseq
  page-ref e.g. [[page name]]"
  (:require [clojure.string :as string]
            ["path" :as node-path]))

(def left-brackets "Opening characters for page-ref" "[[")
(def right-brackets "Closing characters for page-ref" "]]")
(def left-and-right-brackets "Opening and closing characters for page-ref"
  (str left-brackets right-brackets))

;; common regular expressions
(def page-ref-re "Inner capture and doesn't match nested brackets" #"\[\[(.*?)\]\]")
(def page-ref-without-nested-re "Matches most inner nested brackets" #"\[\[([^\[\]]+)\]\]")
(def page-ref-any-re "Inner capture that matches anything between brackets" #"\[\[(.*)\]\]")
(def markdown-page-ref-re #"\[(.*)\]\(file:.*\)")

(defn get-file-basename
  "Returns the basename of a file path. e.g. /a/b/c.md -> c.md"
  [path]
  (when-not (string/blank? path)
    (.-base (node-path/parse (string/replace path "+" "/")))))

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
  "Extracts page names from md page-refs or logseq page-refs. Only call in
  contexts where md page-refs are used"
  [s]
  (and (string? s)
       (or (when-let [[_ label _path] (re-matches markdown-page-ref-re s)]
             (string/trim label))
           (-> (re-matches page-ref-any-re s)
               second))))

(defn get-page-name!
  "Extracts page-name from page-ref and fall back to arg. Useful for when user
  input may (not) be a page-ref"
  [s]
  (or (get-page-name s) s))

(defn page-ref-un-brackets!
  [s]
  (or (get-page-name s) s))
