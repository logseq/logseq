(ns frontend.github
  (:require [frontend.util :as util]
            [cljs-bean.core :as bean]
            [goog.crypt.base64 :as b64]))

;; https://developer.github.com/v3/repos/contents/
;; GET /repos/:owner/:repo/contents/:path?ref=oid
;; header 'authorization: Basic PASSWORD'
(defn get-content
  [token owner repo-name path ref]
  (let [token (str "Basic "(b64/encodeString (str token ":x-oauth-basic")))
        url (util/format "https://api.github.com/repos/%s/%s/contents/%s?ref=%s"
                         owner
                         repo-name
                         path
                         ref)]
    (util/fetch url
                (bean/->js {:method "get"
                            :headers {:Accept "application/json"
                                      :Content-Type "application/json"
                                      :Authorization token}})
                (fn [result]
                  (prn (b64/decodeString (:content result))))
                (fn [error]
                  (prn "Github get content error: ")
                  (js/console.dir error)))))

(comment
  (get-content (frontend.handler/get-github-token)
               "tiensonqin"
               "notes"
               "journals/2020_04.org"
               "5c6472331d82dcac3baf49a9b9cdd526d42ad92f")
  )
