(ns frontend.worker.util
  "Worker utils"
  #?(:cljs (:require-macros [frontend.worker.util]))
  #?(:cljs (:refer-clojure :exclude [format]))
  #?(:cljs (:require [clojure.string :as string]
                     [goog.crypt :as crypt]
                     [goog.crypt.Hmac]
                     [goog.crypt.Sha256]
                     [logseq.db.sqlite.common-db :as sqlite-common-db]
                     [frontend.common.file.util :as wfu])))

;; Copied from https://github.com/tonsky/datascript-todo
#?(:clj
   (defmacro profile
     [k & body]
     `(if goog.DEBUG
        (let [k# ~k]
          (.time js/console k#)
          (let [res# (do ~@body)]
            (.timeEnd js/console k#)
            res#))
        (do ~@body))))

#?(:cljs
   (do
     (def post-message wfu/post-message)

     (defn get-pool-name
       [graph-name]
       (str "logseq-pool-" (sqlite-common-db/sanitize-db-name graph-name)))

     (defn- decode-username
       [username]
       (let [arr (new js/Uint8Array (count username))]
         (doseq [i (range (count username))]
           (aset arr i (.charCodeAt username i)))
         (.decode (new js/TextDecoder "utf-8") arr)))

     (defn parse-jwt [jwt]
       (some-> jwt
               (string/split ".")
               second
               (#(.decodeString ^js crypt/base64 % true))
               js/JSON.parse
               (js->clj :keywordize-keys true)
               (update :cognito:username decode-username)))))
