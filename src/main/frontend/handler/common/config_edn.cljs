(ns frontend.handler.common.config-edn
  "Common fns related to config.edn - global and repo"
  (:require [clojure.edn :as edn]
            [clojure.string :as string :refer [includes?]]
            [frontend.handler.notification :as notification]
            [goog.string :as gstring]
            [malli.core :as m]
            [malli.error :as me]))

(defn- humanize-more
  "Make error maps from me/humanize more readable for users. Doesn't try to handle
nested keys or positional errors e.g. tuples"
  [errors]
  (map
   (fn [[k v]]
     (if (map? v)
       [k (str "Has errors in the following keys - " (string/join ", " (keys v)))]
       ;; Only show first error since we don't have a use case yet for multiple yet
       [k (->> v flatten (remove nil?) first)]))
   errors))

(defn- validate-config-map
  [m schema path]
  (if-let [errors (->> m (m/explain schema) me/humanize)]
    (do
      (notification/show! (gstring/format "The file '%s' has the following errors:\n%s"
                                          path
                                          (->> errors
                                               humanize-more
                                               (map (fn [[k v]]
                                                      (str k " - " v)))
                                               (string/join "\n")))
                          :error)
      false)
    true))

(defn validate-config-edn
  "Validates a global config.edn file for correctness and pops up an error
  notification if invalid. Returns a boolean indicating if file is invalid.
  Error messages are written with consideration that this validation is called
  regardless of whether a file is written outside or inside Logseq."
  [path file-body schema]
  (let [parsed-body (try
                      (edn/read-string file-body)
                      (catch :default x [::failed-to-read (ex-message x)]))
        failed? (and (vector? parsed-body) (= ::failed-to-read (first parsed-body)))]
    (cond
      (nil? parsed-body)
      true
      (and failed? (includes? (second parsed-body) "duplicate key"))
      (do
        (notification/show! (gstring/format "The file '%s' has duplicate keys. The key '%s' is assigned multiple times."
                                            path, (subs (second parsed-body) 36))
                            :error)
        false)

      failed?
      (do

        (notification/show! (gstring/format "Failed to read file '%s'. Make sure your config is wrapped
in {}. Also make sure that the characters '( { [' have their corresponding closing character ') } ]'."
                                            path)
                            :error)
        false)
      ;; Custom error message is better than malli's "invalid type" error
      (not (map? parsed-body))
      (do
        (notification/show! (gstring/format "The file '%s' is not valid. Make sure the config is wrapped in {}."
                                            path)
                            :error)
        false)
      :else
      (validate-config-map parsed-body schema path))))
