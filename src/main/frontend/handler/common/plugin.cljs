(ns frontend.handler.common.plugin
  "Common plugin related fns for handlers and api"
  (:require [cljs-bean.core :as bean]
            [electron.ipc :as ipc]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

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
  (contains? (:plugin/installed-plugins @state/state) (keyword id)))

(defn emit-lsp-updates!
  [payload]
  (js/console.log "debug:lsp-updates:" payload)
  (js/window.apis.emit (name :lsp-updates) (bean/->js payload)))

(defn async-install-or-update-for-web!
  [{:keys [version repo only-check] :as manifest}]
  (js/console.log "debug:plugin:" (if only-check "Checking" "Installing") " #" repo)
  (let [version (if (not only-check) (:latest-version manifest) version)]
    (-> (fetch-web-plugin-entry-info repo (if only-check "" version))
      (p/then (fn [web-pkg]
                (let [web-pkg (merge web-pkg (dissoc manifest :stat :version :only-check))
                      latest-version (:version web-pkg)
                      valid-latest-version (when only-check
                                             (let [coerced-current-version (.coerce util/sem-ver version)
                                                   coerced-latest-version (.coerce util/sem-ver latest-version)]
                                               (if (and coerced-current-version
                                                     coerced-latest-version
                                                     (util/sem-ver.lt coerced-current-version coerced-latest-version))
                                                 latest-version
                                                 (throw (js/Error. :no-new-version)))))]
                  (emit-lsp-updates!
                    {:status :completed
                     :only-check only-check
                     :payload (if only-check
                                (assoc manifest :latest-version valid-latest-version :latest-notes (some-> web-pkg :_objectExtra :releaseNotes))
                                (assoc manifest :dst repo :version latest-version :web-pkg web-pkg))}))))
      (p/catch (fn [^js e]
                 (emit-lsp-updates!
                   {:status :error
                    :only-check only-check
                    :payload (assoc manifest :error-code (.-message e))}))))))

(defn install-marketplace-plugin!
  "Installs plugin given plugin map with id"
  [{:keys [id] :as manifest}]
  (when-not (and (:plugin/installing @state/state)
                 (installed? id))
    (p/create
     (fn [resolve]
       (state/set-state! :plugin/installing manifest)
       (if (util/electron?)
         (ipc/ipc :installMarketPlugin manifest)
         (async-install-or-update-for-web! manifest))
       (resolve id)))))

(defn unregister-plugin
  "Unregister and uninstall plugin given plugin id"
  [id]
  (js/LSPluginCore.unregister id))
