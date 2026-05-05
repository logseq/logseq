(ns frontend.worker-common.util
  "Worker utils"
  #?(:cljs (:require-macros [frontend.worker-common.util]))
  #?(:cljs (:refer-clojure :exclude [format]))
  #?(:cljs (:require [clojure.string :as string]
                     [goog.crypt.base64 :as base64]
                     [goog.crypt.Hmac]
                     [goog.crypt.Sha256]
                     [logseq.common.graph-dir :as common-graph-dir]
                     [logseq.db :as ldb]
                     [logseq.db.sqlite.util :as sqlite-util])))

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
     (goog-define NODETEST false)
     (def dev? js/goog.DEBUG)
     (def node-test? NODETEST)
     (def dev-or-test? (or dev? node-test?))))

#?(:cljs
   (do
     (defn uint8array-to-base64string
       [payload]
       (when payload
         (try
           (let [binary (apply str (map #(char %) payload))]
             (base64/encodeString binary false))
           (catch :default e
             (js/console.error "Error converting Uint8Array to base64:" e)
             nil))))

     (defn base64string-to-unit8array
       [base64-string]
       (when base64-string
         (try
           (let [binary (base64/decodeString base64-string true)
                 len (.-length binary)
                 arr (new js/Uint8Array len)]
             (doseq [i (range len)]
               (aset arr i (.charCodeAt binary i)))
             arr)
           (catch :default e
             (js/console.error "Error converting base64 to Uint8Array:" e)
             nil))))

     (defn post-message
       [type data & {:keys [port]}]
       (when-let [worker (or port (when (exists? js/self) js/self))]
         (.postMessage worker (ldb/write-transit-str [type data]))))

     (defn encode-graph-dir-name
       [graph-name]
       (common-graph-dir/encode-graph-dir-name graph-name))

     (defn decode-graph-dir-name
       [dir-name]
       (common-graph-dir/decode-graph-dir-name dir-name))

     (defn get-pool-name
       [graph-name]
       (str "logseq-pool-"
            (-> graph-name
                (string/replace sqlite-util/db-version-prefix "")
                (string/replace "/" "_")
                (string/replace "\\" "_")
                (string/replace ":" "_"))))

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
               (#(base64/decodeString % true))
               js/JSON.parse
               (js->clj :keywordize-keys true)
               (update :cognito:username decode-username)))))
