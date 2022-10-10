(ns frontend.handler.plugin-config
  "This ns is a system component that encapsulate the global plugin.edn.
This component depends on TODO"
  (:require [frontend.handler.global-config :as global-config-handler]
            ["path" :as path]
            [promesa.core :as p]
            [borkdude.rewrite-edn :as rewrite]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [electron.ipc :as ipc]
            [clojure.edn :as edn]
            [clojure.set :as set]
            [clojure.pprint :as pprint]))

(defn- plugin-config-path
  []
  (path/join @global-config-handler/root-dir "plugins.edn"))

(defn add-or-update-plugin
  [{:keys [id] :as plugin}]
  (p/let [content (fs/read-file "" (plugin-config-path))
          updated-content (-> content
                              rewrite/parse-string
                              (rewrite/assoc (keyword id) (dissoc plugin :id))
                              str)]
         ;; fs protocols require repo and dir when they aren't necessary. For this component,
         ;; neither is needed so these are nil and blank respectively
         (fs/write-file! nil "" (plugin-config-path) updated-content {:skip-compare? true})))

(defn remove-plugin
  [plugin-id]
  (p/let [content (fs/read-file "" (plugin-config-path))
          updated-content (-> content rewrite/parse-string (rewrite/dissoc (keyword plugin-id)) str)]
         (fs/write-file! nil "" (plugin-config-path) updated-content {:skip-compare? true})))

(defn- create-plugin-config-file-if-not-exists
  []
  (let [content (-> (:plugin/installed-plugins @state/state)
                    (update-vals #(select-keys % [:name :version :repo]))
                     pprint/pprint
                     with-out-str)]
    (fs/create-if-not-exists nil @global-config-handler/root-dir (plugin-config-path) content)))

(defn- determine-plugins-to-change
  "Given installed plugins state and plugins from plugins.edn,
returns map of plugins to install and uninstall"
  [installed-plugins edn-plugins]
  (let [installed-plugins-set (->> installed-plugins
                                   vals
                                   (map #(assoc (select-keys % [:name :version :repo])
                                                :id (keyword (:id %))))
                                   set)
        edn-plugins-set (->> edn-plugins
                             (map (fn [[k v]] (assoc v :id k)))
                             set)]
    (if (= installed-plugins-set edn-plugins-set)
      {}
      {:install (mapv #(assoc % :plugin-action "install")
                      (set/difference edn-plugins-set installed-plugins-set))
       :uninstall (set/difference installed-plugins-set edn-plugins-set)})))

(defn open-sync-modal
  []
  (state/pub-event! [:go/plugins])
  (p/let [edn-plugins (fs/read-file "" (plugin-config-path))
          plugins-to-change (determine-plugins-to-change
                             (:plugin/installed-plugins @state/state)
                             (edn/read-string edn-plugins))]
         (state/pub-event! [:go/plugins-from-file plugins-to-change])))

;; TODO: Extract from handler.plugin
(defn installed?
  [id]
  (and (contains? (:plugin/installed-plugins @state/state) (keyword id))
       (get-in @state/state [:plugin/installed-plugins (keyword id) :iir])))

(defn install-marketplace-plugin
  [{:keys [id] :as mft}]
  ; (prn :IN {:k1 (:plugin/installing @state/state)
  ;           :k2 (installed? id)})
  ;; TODO:
  (when-not (and (:plugin/installing @state/state)
                 (installed? id))
    (p/create
     (fn [resolve]
       (state/set-state! :plugin/installing mft)
       (ipc/ipc :installMarketPlugin mft)
       (resolve id)))))

(defn update-plugins
  [plugins]
  (doseq [plugin (:uninstall plugins)]
    (js/LSPluginCore.unregister (name (:id plugin))))
  (doseq [plugin (:install plugins)]
    (install-marketplace-plugin plugin)))

(defn start
  []
  (create-plugin-config-file-if-not-exists))
