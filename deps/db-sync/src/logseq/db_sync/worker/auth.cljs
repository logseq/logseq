(ns logseq.db-sync.worker.auth
  (:require [clojure.string :as string]
            [logseq.common.authorization :as authorization]
            [promesa.core :as p]))

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

(def ^:private recoverable-auth-errors
  #{"invalid" "iss not found" "aud not found" "exp" "kid"})

(defn- recoverable-auth-error?
  [error]
  (when error
    (let [message (or (ex-message error) (some-> error .-message))]
      (contains? recoverable-auth-errors message))))

(defn- expired-token?
  [token]
  (when-let [claims (unsafe-jwt-claims token)]
    (let [exp (aget claims "exp")
          now-s (js/Math.floor (/ (.now js/Date) 1000))]
      (and (number? exp)
           (<= exp now-s)))))

(defn auth-claims [request env]
  (let [token (token-from-request request)]
    (if (string? token)
      (if (expired-token? token)
        (p/resolved nil)
        (-> (authorization/verify-jwt token env)
            (p/catch (fn [error]
                       (if (recoverable-auth-error? error)
                         nil
                         (p/rejected error))))))
      (p/resolved nil))))
