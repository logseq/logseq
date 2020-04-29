(ns frontend.github
  (:require [frontend.util :as util]
            [cljs-bean.core :as bean]
            [goog.crypt.base64 :as b64]))

;; https://developer.github.com/v3/repos/contents/
;; GET /repos/:owner/:repo/contents/:path?ref=oid
;; header 'authorization: Basic PASSWORD'
(defn get-content
  [token repo-url path ref ok-handler error-handler]
  (let [[owner repo-name] (util/get-git-owner-and-repo repo-url)
        token (str "Basic "(b64/encodeString (str token ":x-oauth-basic")))
        url (util/format "https://api.github.com/repos/%s/%s/contents/%s?ref=%s"
                         owner
                         repo-name
                         path
                         ref)]
    (util/fetch-raw url
                    (bean/->js {:method "get"
                                :headers {:Accept "application/vnd.github.v3.raw"
                                          :Content-Type "application/json"
                                          :Authorization token}})
                    (fn [content]
                      (ok-handler
                       {:repo-url repo-url
                        :path path
                        :ref ref
                        :content content}))
                    (fn [error]
                      (error-handler error)))))
