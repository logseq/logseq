(ns electron.keychain
  "Helper functions for storing E2EE secrets inside the OS keychain."
  (:require ["crypto" :as crypto]
            ["electron" :refer [app]]
            ["keytar" :as keytar]
            [clojure.string :as string]
            [electron.logger :as logger]
            [promesa.core :as p]))

(defonce ^:private service-name
  (delay
    (let [app-name (try (.getName app)
                        (catch :default _ nil))]
      (if (string/blank? app-name)
        "Logseq"
        app-name))))

(defn- keychain-service
  []
  (str (force service-name) " E2EE"))

(defn- normalize-account
  [refresh-token]
  (when (and (string? refresh-token)
             (not (string/blank? refresh-token)))
    (try
      (let [hash (.createHash crypto "sha256")]
        (.update hash refresh-token)
        (.digest hash "hex"))
      (catch :default e
        (logger/error ::normalize-account {:error e})
        nil))))

(defn supported?
  []
  (boolean keytar))

(defn <set-password!
  "Persist `encrypted-text` for the `refresh-token` entry."
  [refresh-token encrypted-text]
  (if-let [account (and (supported?) (normalize-account refresh-token))]
    (-> (p/let [_ (.setPassword keytar (keychain-service) account encrypted-text)]
          true)
        (p/catch (fn [e]
                   (logger/error ::set-password {:error e})
                   (throw e))))
    (p/resolved false)))

(defn <get-password
  "Fetch encrypted text stored for `refresh-token`."
  [refresh-token]
  (if-let [account (and (supported?) (normalize-account refresh-token))]
    (-> (p/let [password (.getPassword keytar (keychain-service) account)]
          password)
        (p/catch (fn [e]
                   (logger/error ::get-password {:error e})
                   (throw e))))
    (p/resolved nil)))

(defn <delete-password!
  [refresh-token]
  (if-let [account (and (supported?) (normalize-account refresh-token))]
    (-> (p/let [_ (.deletePassword keytar (keychain-service) account)]
          true)
        (p/catch (fn [e]
                   (logger/error ::delete-password {:error e})
                   (throw e))))
    (p/resolved false)))
