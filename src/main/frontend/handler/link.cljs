(ns frontend.handler.link
  (:require [frontend.util :as util]))

(def plain-link "(\bhttps?://)?[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]")
(def org-link-re-1 (re-pattern (util/format "\\[\\[(%s)\\]\\[(.+)\\]\\]" plain-link)))
(def org-link-re-2 (re-pattern (util/format "\\[\\[(%s)\\]\\]" plain-link)))
(def markdown-link-re (re-pattern (util/format "^\\[(.+)\\]\\((%s)\\)" plain-link)))

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
  (or (util/url? link)
      (org-link? link)
      (markdown-link? link)))
