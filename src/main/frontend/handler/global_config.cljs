(ns frontend.handler.global-config
  "This ns is a system component that encapsulates global config functionality.
  Unlike repo config, this also manages a directory for configuration. This
  component depends on a repo."
  (:require [frontend.fs :as fs]
            [frontend.handler.common.file :as file-common-handler]
            [frontend.handler.notification :as notification]
            [frontend.schema.handler.global-config :as global-config-schema]
            [frontend.state :as state]
            [promesa.core :as p]
            [shadow.resource :as rc]
            [malli.error :as me]
            [malli.core :as m]
            [goog.string :as gstring]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            ["path" :as path]))

;; Use defonce to avoid broken state on dev reload
;; Also known as home directory a.k.a. '~'
(defonce root-dir
  (atom nil))

(defn global-config-dir-exists?
  "This is used in contexts where we are unusure whether global-config has been
  started correctly e.g. an error handler"
  []
  (some? @root-dir))

(defn global-config-dir
  []
  (path/join @root-dir "config"))

(defn global-config-path
  []
  (path/join @root-dir "config" "config.edn"))

(defn- set-global-config-state!
  [content]
  (let [config (edn/read-string content)]
    (state/set-global-config! config)
    config))

(def default-content (rc/inline "global-config.edn"))

(defn- create-global-config-file-if-not-exists
  [repo-url]
  (let [config-dir (global-config-dir)
        config-path (global-config-path)]
    (p/let [_ (fs/mkdir-if-not-exists config-dir)
            file-exists? (fs/create-if-not-exists repo-url config-dir config-path default-content)]
           (when-not file-exists?
             (file-common-handler/reset-file! repo-url config-path default-content)
             (set-global-config-state! default-content)))))

(defn restore-global-config!
  "Sets global config state from config file"
  []
  (let [config-dir (global-config-dir)
        config-path (global-config-path)]
    (p/let [config-content (fs/read-file config-dir config-path)]
           (set-global-config-state! config-content))))

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
  [m path]
  (if-let [errors (->> m (m/explain global-config-schema/Config-edn) me/humanize)]
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
  [path file-body]
  (let [parsed-body (try
                      (edn/read-string file-body)
                      (catch :default _ ::failed-to-read))]
    (cond
      (nil? parsed-body)
      true

      (= ::failed-to-read parsed-body)
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
      (validate-config-map parsed-body path))))

(defn start
  "This component has four responsibilities on start:
- Fetch root-dir for later use with config paths
- Manage ui state of global config
- Create a global config dir and file if it doesn't exist
- Start a file watcher for global config dir if it's not already started.
  Watcher ensures client db is seeded with correct file data."
  [{:keys [repo]}]
  (-> (p/do!
       (p/let [root-dir' (ipc/ipc "getLogseqDotDirRoot")]
         (reset! root-dir root-dir'))
       (restore-global-config!)
       (create-global-config-file-if-not-exists repo)
       (fs/watch-dir! (global-config-dir) {:global-dir true}))
      (p/timeout 6000)
      (p/catch (fn [e]
                 (js/console.error "cannot start global-config" e)))))
