(ns logseq.cli.log
  "CLI logging helpers for verbose debug output."
  (:require [lambdaisland.glogi :as log]))

(def ^:private default-preview-limit 400)

(defonce ^:private handler-installed? (atom false))

(defn truncate-preview
  "Returns a preview map with `:preview`, `:length`, and `:truncated?` for `value`.

  Example:

  ```clojure
  (truncate-preview {:a 1} 10)
  ```"
  ([value]
   (truncate-preview value default-preview-limit))
  ([value max-len]
   (let [text (if (string? value) value (pr-str value))
         length (count text)
         limit (max 0 (or max-len 0))
         truncated? (> length limit)
         preview (if truncated?
                   (subs text 0 limit)
                   text)]
     {:preview preview
      :length length
      :truncated? truncated?})))

(defn- format-record
  [{:keys [level logger-name message exception time]}]
  (cond-> {:time time
           :level level
           :logger logger-name
           :message message}
    exception (assoc :exception (str exception))))

(defn- stderr-handler
  [record]
  (.write (.-stderr js/process)
          (str (pr-str (format-record record)) "\n")))

(defn install-stderr-handler!
  []
  (when-not @handler-installed?
    (log/add-handler stderr-handler)
    (reset! handler-installed? true)))

(defn set-verbose!
  [verbose?]
  (install-stderr-handler!)
  (log/set-levels {:glogi/root (if verbose? :debug :info)}))
