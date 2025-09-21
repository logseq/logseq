(ns frontend.db.conn-state
  "Datascript db connections.")

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (assert (string? url) (str "url is not a string: " (type url)))
  url)

(defn get-conn
  [repo]
  (get @conns (get-repo-path repo)))
