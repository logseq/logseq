(ns frontend.mobile.secure-storage
  "Wrapper around the Capacitor secure storage plugin."
  (:require ["@aparajita/capacitor-secure-storage" :refer [SecureStorage]]
            [frontend.mobile.util :as mobile-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defonce ^:private *initialized? (atom false))
(def ^:private key-prefix "logseq.e2ee.")

(defn- <ensure-initialized!
  []
  (cond
    (not (mobile-util/native-platform?))
    (p/resolved false)

    @*initialized?
    (p/resolved true)

    :else
    (-> (p/let [_ (.setKeyPrefix SecureStorage key-prefix)]
          (reset! *initialized? true))
        (p/catch (fn [e]
                   (log/error ::init {:error e})
                   (throw e)))))) ;; propagate so callers can fallback if needed

(defn <set-item!
  [key value]
  (if (mobile-util/native-platform?)
    (-> (p/let [_ (<ensure-initialized!)
                _ (.setItem SecureStorage key value)]
          true)
        (p/catch (fn [e]
                   (log/error ::set-item {:error e})
                   (throw e))))
    (p/resolved false)))

(defn <get-item
  [key]
  (if (mobile-util/native-platform?)
    (-> (p/let [_ (<ensure-initialized!)]
          (.getItem SecureStorage key))
        (p/catch (fn [e]
                   (log/error ::get-item {:error e})
                   (throw e))))
    (p/resolved nil)))

(defn <remove-item!
  [key]
  (if (mobile-util/native-platform?)
    (-> (p/let [_ (<ensure-initialized!)
                _ (.removeItem SecureStorage key)]
          true)
        (p/catch (fn [e]
                   (log/error ::remove-item {:error e})
                   (throw e))))
    (p/resolved false)))
