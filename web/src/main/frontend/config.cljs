(ns frontend.config)

(defonce tasks-org "tasks.org")
(defonce hidden-file ".hidden")
(defonce dev? ^boolean goog.DEBUG)
(def website
  (if dev?
    "http://localhost:3000"
    "https://logseq.com"))

(def api
  (if dev?
    "http://localhost:3000/api/v1/"
    (str website "/api/v1/")))

(def asset-domain "https://asset.logseq.com")

(defn asset-uri
  [path]
  (if dev? path
      (str asset-domain path)))

(def auto-pull-secs 60)
(def auto-push-secs 10)
