(ns frontend.handler.common.plugin
  "Common plugin related fns for handlers and api"
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [electron.ipc :as ipc]))

(defn get-web-plugin-checker-url!
  ([repo] (get-web-plugin-checker-url! repo ""))
  ([repo version]
   (util/node-path.join "https://plugins.logseq.io/r2"
     repo (if (not (string? version)) "" version))))

(defn fetch-web-plugin-entry-info
  [repo version]
  (p/let [url (get-web-plugin-checker-url! repo version)
          ^js res (js/window.fetch url)]
    (if (and (.-ok res)
          (= (.-status res) 200))
      (-> (.json res)
        (p/then #(bean/->clj %)))
      (-> (.text res)
        (p/then
          (fn [error-text]
            (throw (js/Error. (str "web-plugin-entry-error:" error-text)))))))))

(defn installed?
  "For the given plugin id, returns boolean indicating if it is installed"
  [id]
  (and (contains? (:plugin/installed-plugins @state/state) (keyword id))
       (get-in @state/state [:plugin/installed-plugins (keyword id) :iir])))

(defn emit-lsp-updates!
  [payload]
  (js/console.log "debug:lsp-updates:" payload)
  (js/window.apis.emit (name :lsp-updates) (bean/->js payload)))

(defn async-install-or-update-for-web!
  [{:keys [version repo only-check _plugin-action] :as mft}]
  (js/console.log "debug:install-or-update" mft)
  (-> (fetch-web-plugin-entry-info repo version)
    (p/then (fn [{:keys [version]}]
              (emit-lsp-updates!
                {:status :completed
                 :only-check only-check
                 :payload (if only-check
                            (assoc mft :latest-version version :latest-notes "TODO: update notes")
                            (assoc mft :dst repo :installed-version version :web true))})))
    (p/catch (fn [^js e]
               (emit-lsp-updates!
                 {:status :error
                  :only-check only-check
                  :payload (assoc mft :error-code (.-message e))})))))

(defn install-marketplace-plugin!
  "Installs plugin given plugin map with id"
  [{:keys [id] :as mft}]
  (when-not (and (:plugin/installing @state/state)
                 (installed? id))
    (p/create
     (fn [resolve]
       (state/set-state! :plugin/installing mft)
       (if (util/electron?)
         (ipc/ipc :installMarketPlugin mft)
         (async-install-or-update-for-web! mft))
       (resolve id)))))

(defn unregister-plugin
  "Unregister and uninstall plugin given plugin id"
  [id]
  (js/LSPluginCore.unregister id))
