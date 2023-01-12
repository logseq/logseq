(ns frontend.handler.common.plugin
  "Common plugin related fns for handlers and api"
  (:require [frontend.state :as state]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

(defn installed?
  "For the given plugin id, returns boolean indicating if it is installed"
  [id]
  (and (contains? (:plugin/installed-plugins @state/state) (keyword id))
       (get-in @state/state [:plugin/installed-plugins (keyword id) :iir])))

(defn install-marketplace-plugin
  "Installs plugin given plugin map with id"
  [{:keys [id] :as mft}]
  (when-not (and (:plugin/installing @state/state)
                 (installed? id))
    (p/create
     (fn [resolve]
       (state/set-state! :plugin/installing mft)
       (ipc/ipc :installMarketPlugin mft)
       (resolve id)))))

(defn unregister-plugin
  "Unregister and uninstall plugin given plugin id"
  [id]
  (js/LSPluginCore.unregister id))
