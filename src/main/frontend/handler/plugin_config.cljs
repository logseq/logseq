(ns frontend.handler.plugin-config
  "This system component encapsulates the global plugin.edn and depends on the
  global-config component. This component is only enabled? if both the
  global-config and plugin components are enabled. plugin.edn is automatically updated
when a plugin is installed, updated or removed"
  (:require [frontend.handler.global-config :as global-config-handler]
            [logseq.common.path :as path]
            [promesa.core :as p]
            [borkdude.rewrite-edn :as rewrite]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.handler.notification :as notification]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [clojure.edn :as edn]
            [clojure.set :as set]
            [clojure.pprint :as pprint]
            [malli.core :as m]
            [malli.error :as me]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            [cljs-bean.core :as bean]
            [lambdaisland.glogi :as log]))

(defn plugin-config-path
  "Full path to plugins.edn"
  []
  (path/path-join (global-config-handler/global-config-dir) "plugins.edn"))

(def common-plugin-keys
  "Vec of plugin keys to store in plugins.edn and to compare with installed-plugins state"
  (->> plugin-config-schema/Plugin rest (mapv first)))

(defn add-or-update-plugin
  "Adds or updates a plugin from plugin.edn"
  [{:keys [id] :as plugin}]
  (p/let [content (fs/read-file nil (plugin-config-path))
          updated-content (-> content
                              rewrite/parse-string
                              (rewrite/assoc (keyword id) (select-keys plugin common-plugin-keys))
                              str)]
         ;; fs protocols require repo and dir when they aren't necessary. For this component,
         ;; neither is needed so these are blank and nil respectively
         (fs/write-file! "" nil (plugin-config-path) updated-content {:skip-compare? true})))

(defn remove-plugin
  "Removes a plugin from plugin.edn"
  [plugin-id]
  (p/let [content (fs/read-file "" (plugin-config-path))
          updated-content (-> content rewrite/parse-string (rewrite/dissoc (keyword plugin-id)) str)]
    (fs/write-file! "" nil (plugin-config-path) updated-content {:skip-compare? true})))

(defn- create-plugin-config-file-if-not-exists
  []
  (let [content (-> (:plugin/installed-plugins @state/state)
                    (update-vals #(select-keys % common-plugin-keys))
                    pprint/pprint
                    with-out-str)]
    (fs/create-if-not-exists "" nil (plugin-config-path) content)))

(defn- determine-plugins-to-change
  "Given installed plugins state and plugins from plugins.edn,
returns map of plugins to install and uninstall"
  [installed-plugins edn-plugins]
  (let [installed-plugins-set (->> installed-plugins
                                   vals
                                   (map #(-> (select-keys % common-plugin-keys)
                                             (assoc :id (keyword (:id %)))))
                                   set)
        edn-plugins-set (->> edn-plugins
                             (map (fn [[k v]] (assoc v :id k)))
                             set)]
    (if (= installed-plugins-set edn-plugins-set)
      {}
      {:install (mapv #(assoc % :plugin-action "install")
                      (set/difference edn-plugins-set installed-plugins-set))
       :uninstall (vec (set/difference installed-plugins-set edn-plugins-set))})))

(defn open-replace-plugins-modal
  []
  (p/catch
   (p/let [edn-plugins* (fs/read-file nil (plugin-config-path))
           edn-plugins (edn/read-string edn-plugins*)]
          (if-let [errors (->> edn-plugins (m/explain plugin-config-schema/Plugins-edn) me/humanize)]
            (do
              (notification/show! "Invalid plugins.edn provided. See javascript console for specific errors"
                                  :error)
              (log/error :plugin-edn-errors errors)
              (println "Invalid plugins.edn, errors: " errors))
            (let [plugins-to-change (determine-plugins-to-change
                                     (:plugin/installed-plugins @state/state)
                                     edn-plugins)]
              (state/pub-event! [:go/plugins-from-file plugins-to-change]))))
   (fn [e]
     (if (= :reader-exception (:type (ex-data e)))
       (notification/show! "Malformed plugins.edn provided. Please check the file has correct edn syntax."
                           :error)
       (log/error :unexpected-error e)))))

(defn replace-plugins
  "Replaces current plugins given plugins to install and uninstall"
  [plugins]
  (log/info :uninstall-plugins (:uninstall plugins))
  (doseq [plugin (:uninstall plugins)]
    (plugin-common-handler/unregister-plugin (name (:id plugin))))
  (log/info :install-plugins (:install plugins))
  (doseq [plugin (:install plugins)]
    (plugin-common-handler/install-marketplace-plugin
     ;; Add :name so that install notifications are readable
     (assoc plugin :name (name (:id plugin))))))

(defn setup-install-listener!
  "Sets up a listener for the lsp-installed event to update plugins.edn"
  []
  (let [listener (fn listener [_ e]
                   (when-let [{:keys [status payload only-check]} (bean/->clj e)]
                     (when (and (= status "completed") (not only-check))
                       (let [{:keys [theme effect]} payload]
                         (add-or-update-plugin
                          (assoc payload
                                 :version (:installed-version payload)
                                 :effect (boolean effect)
                                 ;; Manual installation doesn't have theme field but
                                 ;; plugin.edn requires this field
                                 :theme (boolean theme)))))))]
    (js/window.apis.addListener (name :lsp-updates) listener)))

(defn start
  "This component has just one responsibility on start, to create a plugins.edn
  if none exists"
  []
  (create-plugin-config-file-if-not-exists))
