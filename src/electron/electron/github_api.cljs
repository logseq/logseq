(ns electron.github-api
  "Which GitHub API the plugin marketplace uses")

(defn proxy-usable?
  "Whether the GitHub API proxy can serve requests, given the status and the
  parsed JSON body of its /rate_limit response. The proxy answers 200 even
  when its own GitHub rate limit is used up, so the remaining count decides."
  [status body]
  (and (= 200 status)
       (let [remaining (some-> body (aget "resources") (aget "core") (aget "remaining"))]
         (or (not (number? remaining))
             (pos? remaining)))))
