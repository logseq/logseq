(ns frontend.handler.link
  (:require [frontend.util :as util]))

(def plain-link "(\bhttps?://)?[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]")
(def plain-link-re (re-pattern plain-link))
(def org-link-re-1 (re-pattern (util/format "\\[\\[(%s)\\]\\[(.+)\\]\\]" plain-link)))
(def org-link-re-2 (re-pattern (util/format "\\[\\[(%s)\\]\\]" plain-link)))
(def markdown-link-re (re-pattern (util/format "^\\[(.+)\\]\\((%s)\\)" plain-link)))

(defn- plain-link?
  [link]
  (when-let [matches (re-matches plain-link-re link)]
    {:type "plain-link"
     :url matches}))

(defn- org-link?
  [link]
  (when-let [matches (or (re-matches org-link-re-1 link)
                         (re-matches org-link-re-2 link))]
    {:type "org-link"
     :url (second matches)
     :label (nth matches 2 nil)}))

(defn- markdown-link?
  [link]
  (when-let [matches (re-matches markdown-link-re link)]
    {:type "markdown-link"
     :url (nth matches 2)
     :label (second matches)}))

(defn link?
  [link]
  (or (plain-link? link)
      (org-link? link)
      (markdown-link? link)))
