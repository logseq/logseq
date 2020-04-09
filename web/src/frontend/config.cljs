(ns frontend.config)

(defonce tasks-org "tasks.org")
(defonce hidden-file ".hidden")
(defonce dev? ^boolean goog.DEBUG)
(def website
  (if dev?
    "http://localhost:8080"
    "https://logseq.now.sh"))

(def api
  (if dev?
    "http://localhost:3000/api/v1/"
    (str website "/api/v1/")))
