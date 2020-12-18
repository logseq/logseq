(ns frontend.handler.utils
  (:require [frontend.state :as state]
            [cljs.reader :as reader]
            [frontend.config :as config]
            [frontend.db :as db]))

(defn get-config
  [repo-url]
  (db/get-file repo-url (str config/app-name "/" config/config-file)))

(defn reset-config!
  [repo-url content]
  (when-let [content (or content (get-config repo-url))]
    (let [config (try
                   (reader/read-string content)
                   (catch js/Error e
                     (println "Parsing config file failed: ")
                     (js/console.dir e)
                     {}))]
      (state/set-config! repo-url config)
      config)))