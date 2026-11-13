(ns electron.server-auth
  "Authentication boundary for the local HTTP API."
  (:require [clojure.string :as string]))

(defn validate-auth-token
  [authorization valid-tokens]
  (let [token (when (string? authorization)
                (second (re-matches #"(?i)Bearer[ \t]+(\S+)" authorization)))]
    (when-not (and (not (string/blank? token))
                   (some #(or (= % token)
                              (= (:value %) token)) valid-tokens))
      (throw (js/Error. "Access Denied!")))))
