(ns frontend.github
  (:require [frontend.util :as util]
            [goog.crypt.base64 :as b64]))

(defonce API "https://api.github.com/")

;; https://developer.github.com/v3/repos/contents/
;; GET /repos/:owner/:repo/contents/:path?ref=oid
;; header 'authorization: Basic PASSWORD'
(defn get-content
  [token repo-url path ref ok-handler error-handler]
  (let [[owner repo-name] (util/get-git-owner-and-repo repo-url)
        token (str "Basic " (b64/encodeString (str owner ":" token)))
        url (util/format (str API "repos/%s/%s/contents/%s?ref=%s")
                         owner
                         repo-name
                         path
                         ref)]
    (util/fetch-raw url
                    {:method "get"
                     :headers {:Accept "application/vnd.github.v3.raw"
                               :Content-Type "application/json"
                               :Authorization token}}
                    (fn [content]
                      (ok-handler
                       {:repo-url repo-url
                        :path path
                        :ref ref
                        :content content}))
                    (fn [error]
                      (error-handler error)))))
