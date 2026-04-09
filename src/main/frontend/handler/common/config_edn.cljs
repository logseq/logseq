(ns frontend.handler.common.config-edn
  "Common fns related to config.edn - global and repo"
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [malli.core :as m]
            [malli.error :as me]
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

(defn- normalize-config-key
  [config-key]
  (let [ns-str (namespace config-key)
        clean-name (string/replace (name config-key) #"\?$" "")]
    (if ns-str
      (str ns-str "-" clean-name)
      clean-name)))

(defn- config-key->deprecation-i18n-key
  [config-key]
  (when config-key
    (if (= common-config/unused-in-db-graphs-deprecation
           (get common-config/file-only-config config-key))
      :graph.validation/config-unused-in-db-graphs-warning
      (keyword "graph.validation"
               (str "config-" (normalize-config-key config-key) "-warning")))))

(defn- config-deprecation-message
  [config-key]
  (some-> config-key
          config-key->deprecation-i18n-key
          t))

(defn- deprecated-config-key?
  [config-key]
  (or (contains? common-config/file-only-config config-key)
      (contains? #{:editor/command-trigger
                   :arweave/gateway}
                 config-key)))

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
   (config-notification-show! title body status false))
  ([title body status clear?]
   (notification/show!
    [:.mb-2
     [:.text-lg.mb-2 title]
     body] status clear?)))

(defn- validate-config-map
  [m schema path]
  (if-let [errors (->> m (m/explain schema) me/humanize)]
    (do
      (config-notification-show! (i18n/interpolate-rich-text-node
                                  (t :file.config/error-title)
                                  [(file-link path)])
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
        (notification/show! (t :file/config-duplicate-keys path (subs (second parsed-body) 36))
                            :error)
        false)

      failed?
      (do
        (config-notification-show! (i18n/interpolate-rich-text-node
                                    (t :file.config/read-failed-title)
                                    [(file-link path)])
                                   (t :file.config/read-failed-desc))
        false)
      ;; Custom error message is better than malli's "invalid type" error
      (not (map? parsed-body))
      (do
        (config-notification-show! (i18n/interpolate-rich-text-node
                                    (t :file.config/invalid-title)
                                    [(file-link path)])
                                   (t :file.config/invalid-desc))
        false)
      :else
      (validate-config-map parsed-body schema path))))

(defn detect-deprecations
  "Detects config keys that will or have been deprecated"
  [path content]
  (let [body (try (edn/read-string content)
                  (catch :default _ ::failed-to-detect))]
    (cond
      (= body ::failed-to-detect)
      (log/info :msg "Skip deprecation check since config is not valid edn")

      (not (map? body))
      (log/info :msg "Skip deprecation check since config is not a map")

      :else
      (when-let [deprecations (seq (keep (fn [config-key]
                                          (when (deprecated-config-key? config-key)
                                            [config-key (config-deprecation-message config-key)]))
                                        (keys body)))]
        (config-notification-show! (i18n/interpolate-rich-text-node
                                    (t :file.config/deprecation-title)
                                    [(file-link path)])
                                   (error-list deprecations "text-warning")
                                   :warning
                                   false)))))
