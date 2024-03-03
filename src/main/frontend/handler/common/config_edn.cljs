(ns frontend.handler.common.config-edn
  "Common fns related to config.edn - global and repo"
  (:require [malli.error :as me]
            [malli.core :as m]
            [clojure.string :as string]
            [clojure.edn :as edn]
            [lambdaisland.glogi :as log]
            [frontend.handler.notification :as notification]
            [goog.string :as gstring]
            [reitit.frontend.easy :as rfe]))

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

(defn- file-link
  [path]
  [:a {:href (rfe/href :file {:path path})} path])

(defn- error-list
  [errors class]
  (map (fn [[k v]]
         [:dl.my-2.mb-0
          [:dt.m-0 [:strong (str k)]]
          [:dd {:class class} v]]) errors))

(defn config-notification-show!
  ([title body]
   (config-notification-show! title body :error))
  ([title body status]
   (config-notification-show! title body status true))
  ([title body status clear?]
   (notification/show!
    [:.mb-2
     [:.text-lg.mb-2 title]
     body] status clear?)))

(defn- validate-config-map
  [m schema path]
  (if-let [errors (->> m (m/explain schema) me/humanize)]
    (do
      (config-notification-show! [:<> "The file " (file-link path) " has the following errors:"]
                                 (error-list (humanize-more errors) "text-error"))
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
      (and failed? (string/includes? (second parsed-body) "duplicate key"))
      (do
        (notification/show! (gstring/format "The file '%s' has duplicate keys. The key '%s' is assigned multiple times."
                                            path, (subs (second parsed-body) 36))
                            :error)
        false)

      failed?
      (do
        (config-notification-show! [:<> "Failed to read file " (file-link path)]
                                   "Make sure your config is wrapped in {}. Also make sure that the characters '( { [' have their corresponding closing character ') } ]'.")
                false)
      ;; Custom error message is better than malli's "invalid type" error
      (not (map? parsed-body))
      (do
        (config-notification-show! [:<> "The file " (file-link path) " s not valid."]
                                   "Make sure the config is wrapped in {}.")
        false)
      :else
      (validate-config-map parsed-body schema path))))

(defn detect-deprecations
  "Detects config keys that will or have been deprecated"
  [path content]
  (let [body (try (edn/read-string content)
               (catch :default _ ::failed-to-detect))
        warnings {:editor/command-trigger
                  "is no longer supported. Please use '/' and report bugs on it."}]
    (cond
      (= body ::failed-to-detect)
      (log/info :msg "Skip deprecation check since config is not valid edn")

      (not (map? body))
      (log/info :msg "Skip deprecation check since config is not a map")

      :else
      (when-let [deprecations (seq (keep #(when (body (key %)) %) warnings))]
        (config-notification-show! [:<> "The file " (file-link path) " has the following deprecations:"]
                                   (error-list deprecations "text-warning")
                                   :warning
                                   false)))))
