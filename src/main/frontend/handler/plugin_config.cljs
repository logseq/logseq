(ns frontend.handler.plugin-config
  "This ns is a system component that encapsulate the global plugin.edn.
This component depends on TODO"
  (:require [frontend.handler.global-config :as global-config-handler]
            ["path" :as path]
            [promesa.core :as p]
            [borkdude.rewrite-edn :as rewrite]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.handler.notification :as notification]
            [electron.ipc :as ipc]
            [clojure.edn :as edn]
            [clojure.set :as set]
            [clojure.pprint :as pprint]
            [malli.core :as m]
            [malli.error :as me]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            [lambdaisland.glogi :as log]))

(defn- plugin-config-path
  []
  (path/join @global-config-handler/root-dir "plugins.edn"))

(def common-plugin-keys
  "Vec of plugin keys to store in plugins.edn and to compare with installed-plugins state"
  (->> plugin-config-schema/Plugin rest (mapv first)))

(defn add-or-update-plugin
  [{:keys [id] :as plugin}]
  (p/let [content (fs/read-file "" (plugin-config-path))
          updated-content (-> content
                              rewrite/parse-string
                              (rewrite/assoc (keyword id) (select-keys plugin common-plugin-keys))
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
                    (update-vals #(select-keys % common-plugin-keys))
                    pprint/pprint
                    with-out-str)]
    (fs/create-if-not-exists nil @global-config-handler/root-dir (plugin-config-path) content)))

(defn- determine-plugins-to-change
  "Given installed plugins state and plugins from plugins.edn,
returns map of plugins to install and uninstall"
  [installed-plugins edn-plugins]
  (let [installed-plugins-set (->> installed-plugins
                                   vals
                                   (map #(assoc (select-keys % common-plugin-keys)
                                                :id (keyword (:id %))))
                                   set)
        edn-plugins-set (->> edn-plugins
                             (map (fn [[k v]] (assoc v :id k)))
                             set)]
    (if (= installed-plugins-set edn-plugins-set)
      {}
      {:install (mapv #(assoc % :plugin-action "install")
                      (set/difference edn-plugins-set installed-plugins-set))
       :uninstall (vec (set/difference installed-plugins-set edn-plugins-set))})))

(defn open-sync-modal
  []
  (state/pub-event! [:go/plugins])
  (p/catch
   (p/let [edn-plugins* (fs/read-file "" (plugin-config-path))
           edn-plugins (edn/read-string edn-plugins*)]
          (if-let [errors (->> edn-plugins (m/explain plugin-config-schema/Plugins-edn) me/humanize)]
            (do
              (notification/show! "Invalid plugins.edn provided. See javascript console for specific errors"
                                  :error)
              (log/error :plugin-edn-errors errors))
            (let [plugins-to-change (determine-plugins-to-change
                                     (:plugin/installed-plugins @state/state)
                                     edn-plugins)]
              (state/pub-event! [:go/plugins-from-file plugins-to-change]))))
   (fn [e]
     (if (= :reader-exception (:type (ex-data e)))
       (notification/show! "Malformed plugins.edn provided. Please check the file has correct edn syntax."
                           :error)
       (log/error :unexpected-error e)))))

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
  (log/info :uninstall-plugins (:uninstall plugins))
  (doseq [plugin (:uninstall plugins)]
    (js/LSPluginCore.unregister (name (:id plugin))))
  (log/info :install-plugins (:install plugins))
  (doseq [plugin (:install plugins)]
    (install-marketplace-plugin plugin)))

(defn start
  []
  (create-plugin-config-file-if-not-exists))
