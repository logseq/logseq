(ns frontend.config)

(defonce tasks-org "tasks.org")
(defonce hidden-file ".hidden")
(defonce dev? ^boolean goog.DEBUG)
(def website
  (if dev?
    "http://localhost:8080"
    "https://gitnotes.tiensonqin.now.sh']"))
(def api
  (if dev?
    "http://localhost:3001/"
    "https://github-oauth.tiensonqin.now.sh/"))
