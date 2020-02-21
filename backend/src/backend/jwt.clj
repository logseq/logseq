(ns backend.jwt
  (:require [buddy.sign.jwt :as jwt]
            [clj-time.core :as time]
            [backend.config :refer [config]]))

(defonce secret (:jwt-secret config))

(defn sign
  "Serialize and sign a token with defined claims"
  ([m]
   (sign m (* 60 60 12)))
  ([m expire-secs]
   (let [claims (assoc m
                       :exp (time/plus (time/now) (time/seconds expire-secs)))]
     (jwt/sign claims secret))))

(defn unsign
  [token]
  (jwt/unsign token secret))

(defn unsign-skip-validation
  [token]
  (jwt/unsign token secret {:skip-validation true}))
