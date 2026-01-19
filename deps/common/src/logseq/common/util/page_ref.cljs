(ns logseq.common.util.page-ref
  "Core vars and util fns for page-ref. Currently this only handles a logseq
  page-ref e.g. [[page name]]"
  (:require [clojure.string :as string]
            ["path" :as path]))

(def left-brackets "Opening characters for page-ref" "[[")
(def right-brackets "Closing characters for page-ref" "]]")
(def left-and-right-brackets "Opening and closing characters for page-ref"
  (str left-brackets right-brackets))

;; common regular expressions
(def page-ref-re "Inner capture and doesn't match nested brackets" #"\[\[(.*?)\]\]")
(def page-ref-without-nested-re "Matches most inner nested brackets" #"\[\[([^\[\]]+)\]\]")
(def page-ref-any-re "Inner capture that matches anything between brackets" #"\[\[(.*)\]\]")
(def org-page-ref-re #"\[\[(file:.*)\]\[.+?\]\]")
(def markdown-page-ref-re #"\[(.*)\]\(file:.*\)")

(defn get-file-basename
  "Returns the basename of a file path. e.g. /a/b/c.md -> c.md"
  [path]
  (when-not (string/blank? path)
    (.-base (path/parse (string/replace path "+" "/")))))

(defn get-file-rootname
  "Returns the rootname of a file path. e.g. /a/b/c.md -> c"
  [path]
  (when-not (string/blank? path)
    (.-name (path/parse (string/replace path "+" "/")))))

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
  "Extracts page names from format-specific page-refs e.g. org/md specific and
  logseq page-refs. Only call in contexts where format-specific page-refs are
  used. For logseq page-refs use page-ref/get-page-name"
  [s]
  (and (string? s)
       (or (when-let [[_ label _path] (re-matches markdown-page-ref-re s)]
             (string/trim label))
           (when-let [[_ path _label] (re-matches org-page-ref-re s)]
             (some-> (get-file-rootname path)
                     (string/replace "." "/")))
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
