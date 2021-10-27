(ns frontend.handler.link)

(def plain-link-re (re-pattern "(^[-A-Za-z0-9]+://.+)"))
(def org-link-re-1 (re-pattern "^\\[\\[([-A-Za-z0-9]+://.+)\\]\\[(.+)\\]\\]"))
(def org-link-re-2 (re-pattern "^\\[\\[([-A-Za-z0-9]+://.+)\\]\\]"))
(def markdown-link-re (re-pattern "^\\[(.+)\\]\\(( [-A-Za-z0-9]+://.+)\\)"))

(defn- plain-link?
  [link]
  (let [matches (re-matches plain-link-re link)]
    (when matches
      {:type "plain-link"
       :url (first matches)})))

(defn- org-link?
  [link]
  (let [matches (or (re-matches org-link-re-1 link)
                    (re-matches org-link-re-2 link))]
    (when matches
      {:type "org-link"
       :url (second matches)
       :label (nth matches 2 nil)})))

(defn- markdown-link?
  [link]
  (let [matches (re-matches markdown-link-re link)]
    (when matches
      {:type "markdown-link"
       :url (nth matches 2)
       :label (second matches)})))

(defn link?
  [link]
  (or (plain-link? link)
      (org-link? link)
      (markdown-link? link)))

