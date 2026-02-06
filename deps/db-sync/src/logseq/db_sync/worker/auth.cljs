(ns logseq.db-sync.worker.auth
  (:require [clojure.string :as string]
            [logseq.common.authorization :as authorization]))

(defonce ^:private auth-cache (js/Map.))
(defonce ^:private auth-cache-max-entries 512)
(def ^:private auth-exp-skew-seconds 5)

(defn- now-seconds []
  (js/Math.floor (/ (.now js/Date) 1000)))

(defn- evict-auth-cache! []
  (when (> (.-size auth-cache) auth-cache-max-entries)
    (let [keys-iter (.keys auth-cache)
          first-key (.next keys-iter)]
      (when-not (.-done first-key)
        (.delete auth-cache (.-value first-key))))))

(defn- cached-claims [token]
  (let [entry (.get auth-cache token)]
    (when entry
      (let [exp (aget entry "exp")
            now (now-seconds)]
        (if (and (number? exp) (<= exp (+ now auth-exp-skew-seconds)))
          (do
            (.delete auth-cache token)
            nil)
          (aget entry "claims"))))))

(defn- cache-claims! [token claims]
  (let [exp (aget claims "exp")]
    (when (and (string? token) (number? exp))
      (.set auth-cache token #js {"claims" claims "exp" exp})
      (evict-auth-cache!))))

(defn- bearer-token [auth-header]
  (when (and (string? auth-header) (string/starts-with? auth-header "Bearer "))
    (subs auth-header 7)))

(defn token-from-request [request]
  (or (bearer-token (.get (.-headers request) "authorization"))
      (let [url (js/URL. (.-url request))]
        (.get (.-searchParams url) "token"))))

(defn- decode-jwt-part [part]
  (let [pad (if (pos? (mod (count part) 4))
              (apply str (repeat (- 4 (mod (count part) 4)) "="))
              "")
        base64 (-> (str part pad)
                   (string/replace "-" "+")
                   (string/replace "_" "/"))
        raw (js/atob base64)]
    (js/JSON.parse raw)))

(defn unsafe-jwt-claims [token]
  (try
    (when (string? token)
      (let [parts (string/split token #"\.")]
        (when (= 3 (count parts))
          (decode-jwt-part (nth parts 1)))))
    (catch :default _
      nil)))

(defn auth-claims [request env]
  (let [token (token-from-request request)]
    (if (string? token)
      (if-let [claims (cached-claims token)]
        (js/Promise.resolve claims)
        (-> (authorization/verify-jwt token env)
            (.then (fn [claims]
                     (when claims
                       (cache-claims! token claims))
                     claims))
            (.catch (fn [_] nil))))
      (js/Promise.resolve nil))))
