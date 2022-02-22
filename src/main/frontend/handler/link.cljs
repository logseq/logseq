(ns frontend.handler.link
  (:require [frontend.util :as util]))

(def plain-link-re-string
  "(?:http://www\\.|https://www\\.|http://|https://){1}[a-z0-9]+(?:[\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(?:.*)*")
;; Based on https://orgmode.org/manual/Link-Format.html#Link-Format
(def org-link-re-1 (re-pattern (util/format "\\[\\[(%s)\\]\\[(.+)\\]\\]" plain-link-re-string)))
(def org-link-re-2 (re-pattern (util/format "\\[\\[(%s)\\]\\]" plain-link-re-string)))
(def markdown-link-re (re-pattern (util/format "^\\[(.+)\\]\\((%s)\\)" plain-link-re-string)))

(defn- org-link
  [link]
  (when-let [matches (or (re-matches org-link-re-1 link)
                         (re-matches org-link-re-2 link))]
    {:type "org-link"
     :url (second matches)
     :label (nth matches 2 nil)}))

(defn- markdown-link
  [link]
  (when-let [matches (re-matches markdown-link-re link)]
    {:type "markdown-link"
     :url (nth matches 2)
     :label (second matches)}))

(defn- plain-link
  [link]
  (when (util/url? link)
    {:type "plain-link"
     :url link}))

(defn link
  "If the given string is an org, markdown or plain url, return a map indicating
  the url type, url itself and the optional label."
  [link]
  (or (plain-link link)
      (org-link link)
      (markdown-link link)))
