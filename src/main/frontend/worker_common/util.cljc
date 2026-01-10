(ns frontend.worker-common.util
  "Worker utils"
  #?(:cljs (:require-macros [frontend.worker-common.util]))
  #?(:cljs (:refer-clojure :exclude [format]))
  #?(:cljs (:require [clojure.string :as string]
                     [goog.crypt :as crypt]
                     [goog.crypt.Hmac]
                     [goog.crypt.Sha256]
                     [logseq.db.common.sqlite :as common-sqlite]
                     [logseq.db :as ldb])))

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
   (def dev? js/goog.DEBUG))

#?(:cljs
   (do
     (defn post-message
       [type data & {:keys [port]}]
       (when-let [worker (or port js/self)]
         (.postMessage worker (ldb/write-transit-str [type data]))))

     (defn get-pool-name
       [graph-name]
       (str "logseq-pool-" (common-sqlite/sanitize-db-name graph-name)))

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
