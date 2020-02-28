(ns frontend.config)

(defonce dir "/gitnotes")

(defonce tasks-org "tasks.org")
(defonce links-org "links.org")
(defonce hidden-file ".hidden")
(defonce dev? ^boolean goog.DEBUG)
(def website
  (if dev?
    "http://localhost:8080"
    "https://gitnotes.com"))
(def api (str website "/api/v1/"))
