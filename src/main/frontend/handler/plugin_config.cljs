(ns frontend.handler.plugin-config
  "This ns is a system component that encapsulate the global plugin.edn.
This component depends on TODO"
  (:require [frontend.handler.global-config :as global-config-handler]
            ["path" :as path]
            [promesa.core :as p]
            [borkdude.rewrite-edn :as rewrite]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [clojure.pprint :as pprint]))

(defn- plugins-path
  []
  (path/join (global-config-handler/global-config-dir) "plugins.edn"))

(defn add-or-update-plugin
  [plugin-name plugin-version]
  (p/let [content (fs/read-file "" (plugins-path))
          updated-content (-> content
                              rewrite/parse-string
                              (rewrite/assoc plugin-name {:version plugin-version})
                              str)]
         (fs/write-file! nil "" (plugins-path) updated-content {:skip-compare? true})))

(defn remove-plugin
  [plugin-name]
  (p/let [content (fs/read-file "" (plugins-path))
          updated-content (-> content rewrite/parse-string (rewrite/dissoc plugin-name) str)]
         (fs/write-file! nil "" (plugins-path) updated-content {:skip-compare? true})))

(defn- create-global-config-file-if-not-exists
  []
  (let [content (->> (:plugin/installed-plugins @state/state)
                     vals
                     (map (fn [{:keys [name version]}]
                            [name {:version version}]))
                     (into {})
                     pprint/pprint
                     with-out-str)]
    (fs/create-if-not-exists nil (global-config-handler/global-config-dir) (plugins-path) content)))

(defn start
  []
  (create-global-config-file-if-not-exists))
