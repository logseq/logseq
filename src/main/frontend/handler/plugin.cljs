(ns frontend.handler.plugin
  (:require [promesa.core :as p]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.fs :as fs]
            [frontend.format.mldoc :refer [->MldocMode] :as mldoc]
            [frontend.handler.notification :as notifications]
            [frontend.storage :as storage]
            [camel-snake-kebab.core :as csk]
            [frontend.state :as state]
            [medley.core :as md]
            [electron.ipc :as ipc]
            [reitit.frontend.easy :as rfe]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [frontend.components.svg :as svg]
            [frontend.format :as format]))

(defonce lsp-enabled?
         (and (util/electron?)
              (= (storage/get "developer-mode") "true")))

(defn invoke-exported-api
  [type & args]
  (try
    (apply js-invoke (aget js/window.logseq "api") type args)
    (catch js/Error e (js/console.error e))))

;; state handlers
(defonce central-endpoint "https://raw.githubusercontent.com/logseq/marketplace/master/")
(defonce plugins-url (str central-endpoint "plugins.json"))
(defonce stats-url (str central-endpoint "stats.json"))
(declare select-a-plugin-theme)

(defn gh-repo-url [repo]
  (str "https://github.com/" repo))

(defn pkg-asset [id asset]
  (if (and asset (string/starts-with? asset "http"))
    asset (if-let [asset (and asset (string/replace asset #"^[./]+" ""))]
            (str central-endpoint "packages/" id "/" asset))))

(defn load-marketplace-plugins
  [refresh?]
  (if (or refresh? (nil? (:plugin/marketplace-pkgs @state/state)))
    (p/create
      (fn [resolve reject]
        (-> (util/fetch plugins-url
                        (fn [res]
                          (let [pkgs (:packages res)]
                            (state/set-state! :plugin/marketplace-pkgs pkgs)
                            (resolve pkgs)))
                        reject)
            (p/catch reject))))
    (p/resolved (:plugin/marketplace-pkgs @state/state))))

(defn load-marketplace-stats
  [refresh?]
  (if (or refresh? (nil? (:plugin/marketplace-stats @state/state)))
    (p/create
      (fn [resolve reject]
        (util/fetch stats-url
                    (fn [res]
                      (state/set-state! :plugin/marketplace-stats res)
                      (resolve nil))
                    reject)))
    (p/resolved nil)))

(defn installed?
  [id]
  (and (contains? (:plugin/installed-plugins @state/state) (keyword id))
       (get-in @state/state [:plugin/installed-plugins (keyword id) :iir])))

(defn install-marketplace-plugin
  [{:keys [repo id] :as mft}]
  (when-not (and (:plugin/installing @state/state)
                 (installed? id))
    (p/create
      (fn [resolve]
        (state/set-state! :plugin/installing mft)
        (ipc/ipc "installMarketPlugin" mft)
        (resolve id)))))

(defn update-marketplace-plugin
  [{:keys [id] :as pkg} error-handler]
  (when-not (and (:plugin/installing @state/state)
                 (not (installed? id)))
    (p/catch
      (p/then
        (do (state/set-state! :plugin/installing pkg)
            (load-marketplace-plugins false))
        (fn [mfts]
          (if-let [mft (some #(if (= (:id %) id) %) mfts)]
            (do
              (ipc/ipc "updateMarketPlugin" (merge (dissoc pkg :logger) mft)))
            (throw (js/Error. (str ":central-not-matched " id))))
          true))

      (fn [^js e]
        (error-handler "Update Error: remote error")
        (state/set-state! :plugin/installing nil)
        (js/console.error e)))))

(defn get-plugin-inst
  [id]
  (try
    (js/LSPluginCore.ensurePlugin id)
    (catch js/Error e
      nil)))

(defn setup-install-listener!
  [t]
  (let [channel (name :lsp-installed)
        listener (fn [^js _ ^js e]
                   (js/console.debug :lsp-installed e)

                   (when-let [{:keys [status payload]} (bean/->clj e)]
                     (case (keyword status)

                       :completed
                       (let [{:keys [id dst name title version theme]} payload
                             name (or title name "Untitled")]
                         (if (installed? id)
                           (when-let [^js pl (get-plugin-inst id)] ;; update
                             (p/then
                               (.reload pl)
                               #(do
                                  ;;(if theme (select-a-plugin-theme id))
                                  (notifications/show!
                                    (str (t :plugin/update) (t :plugins) ": " name " - " (.-version (.-options pl))) :success))))

                           (do                              ;; register new
                             (p/then
                               (js/LSPluginCore.register (bean/->js {:key id :url dst}))
                               (fn [] (if theme (js/setTimeout #(select-a-plugin-theme id) 300))))
                             (notifications/show!
                               (str (t :plugin/installed) (t :plugins) ": " name) :success))))

                       :error
                       (let [[msg type] (case (keyword (string/replace payload #"^[\s\:]+" ""))

                                          :no-new-version
                                          [(str (t :plugin/up-to-date) " :)") :success]

                                          [payload :error])]

                         (notifications/show!
                           (str
                             (if (= :error type) "[Install Error]" "")
                             msg) type)

                         (js/console.error payload))

                       :dunno))

                   ;; reset
                   (state/set-state! :plugin/installing nil)
                   true)]

    (js/window.apis.addListener channel listener)

    ;; clear
    (fn []
      (js/window.apis.removeAllListeners channel))))

(defn register-plugin
  [pl]
  (swap! state/state update-in [:plugin/installed-plugins] assoc (keyword (:id pl)) pl))

(defn unregister-plugin
  [id]
  (js/LSPluginCore.unregister id))

(defn host-mounted!
  []
  (and lsp-enabled? (js/LSPluginCore.hostMounted)))

(defn register-plugin-slash-command
  [pid [cmd actions]]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (do (swap! state/state update-in [:plugin/installed-commands pid]
                 (fnil merge {}) (hash-map cmd (mapv #(conj % {:pid pid}) actions)))
          true))))

(defn unregister-plugin-slash-command
  [pid]
  (swap! state/state md/dissoc-in [:plugin/installed-commands (keyword pid)]))

(defn register-plugin-simple-command
  ;; action => [:action-key :event-key]
  [pid {:keys [key label type] :as cmd} action]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (do (swap! state/state update-in [:plugin/simple-commands pid]
                 (fnil conj []) [type cmd action pid])
          true))))

(defn unregister-plugin-simple-command
  [pid]
  (swap! state/state md/dissoc-in [:plugin/simple-commands (keyword pid)]))

(defn register-plugin-ui-item
  [pid {:keys [key type template] :as opts}]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (do (swap! state/state update-in [:plugin/installed-ui-items pid]
                 (fnil conj []) [type opts pid])
          true))))

(defn unregister-plugin-ui-items
  [pid]
  (swap! state/state assoc-in [:plugin/installed-ui-items (keyword pid)] []))

(defn unregister-plugin-themes
  ([pid] (unregister-plugin-themes pid true))
  ([pid effect]
   (js/LSPluginCore.unregisterTheme (name pid) effect)))

(defn select-a-plugin-theme
  [pid]
  (when-let [themes (get (group-by :pid (:plugin/installed-themes @state/state)) pid)]
    (when-let [theme (first themes)]
      (let [theme-mode (:mode theme)]
        (and theme-mode (state/set-theme! (if (= theme-mode "light") "white" theme-mode)))
        (js/LSPluginCore.selectTheme (bean/->js theme))))))

(defn update-plugin-settings
  [id settings]
  (swap! state/state update-in [:plugin/installed-plugins id] assoc :settings settings))

(defn parse-user-md-content
  [content {:keys [url]}]
  (try
    (when-not (string/blank? content)
      (let [content (if-not (string/blank? url)
                      (string/replace
                        content #"!\[[^\]]*\]\((.*?)\s*(\"(?:.*[^\"])\")?\s*\)"
                        (fn [[matched link]]
                          (if (and link (not (string/starts-with? link "http")))
                            (string/replace matched link (util/node-path.join url link))
                            matched)))
                      content)]
        (format/to-html content :markdown (mldoc/default-config :markdown))))
    (catch js/Error e
      (log/error :parse-user-md-exception e)
      content)))

(defn open-readme!
  [url item display]
  (let [repo (:repo item)]
    (if (nil? repo)
      ;; local
      (-> (p/let [content (invoke-exported-api "load_plugin_readme" url)
                  content (parse-user-md-content content item)]
            (and (string/blank? (string/trim content)) (throw nil))
            (state/set-state! :plugin/active-readme [content item])
            (state/set-modal! (fn [_] (display))))
          (p/catch #(do (js/console.warn %)
                        (notifications/show! "No README content." :warn))))
      ;; market
      (state/set-modal! (fn [_] (display repo nil))))))

(defn load-unpacked-plugin
  []
  (when util/electron?
    (p/let [path (ipc/ipc "openDialogSync")]
      (when-not (:plugin/selected-unpacked-pkg @state/state)
        (state/set-state! :plugin/selected-unpacked-pkg path)))))

(defn reset-unpacked-state
  []
  (state/set-state! :plugin/selected-unpacked-pkg nil))

(defn hook-plugin
  [tag type payload plugin-id]
  (when lsp-enabled?
    (js-invoke js/LSPluginCore
               (str "hook" (string/capitalize (name tag)))
               (name type)
               (if (coll? payload)
                 (bean/->js (into {} (for [[k v] payload] [(csk/->camelCase k) (if (uuid? v) (str v) v)])))
                 payload)
               (if (keyword? plugin-id) (name plugin-id) plugin-id))))

(defn hook-plugin-app
  ([type payload] (hook-plugin-app type payload nil))
  ([type payload plugin-id] (hook-plugin :app type payload plugin-id)))

(defn hook-plugin-editor
  ([type payload] (hook-plugin-editor type payload nil))
  ([type payload plugin-id] (hook-plugin :editor type payload plugin-id)))

(defn get-ls-dotdir-root
  []
  (ipc/ipc "getLogseqDotDirRoot"))

(defn show-themes-modal!
  []
  (state/pub-event! [:modal/show-themes-modal]))

(defn goto-plugins-dashboard!
  []
  (rfe/push-state :plugins))

(defn- get-user-default-plugins
  []
  (p/catch
    (p/let [files ^js (ipc/ipc "getUserDefaultPlugins")
            files (js->clj files)]
      (map #(hash-map :url %) files))
    (fn [e]
      (js/console.error e))))

;; components
(rum/defc lsp-indicator < rum/reactive
  []
  (let [text (state/sub :plugin/indicator-text)]
    (if-not (= text "END")
      [:div.flex.align-items.justify-center.h-screen.w-full
       [:span.flex.items-center.justify-center.w-60.flex-col
        [:small.scale-250.opacity-70.mb-10.animate-pulse (svg/logo false)]
        [:small.block.text-sm.relative.opacity-50 {:style {:right "-8px"}} text]]])))

(defn init-plugins!
  [callback]

  (let [el (js/document.createElement "div")]
    (.appendChild js/document.body el)
    (rum/mount
      (lsp-indicator) el))

  (state/set-state! :plugin/indicator-text "LOADING")

  (p/then
    (p/let [root (get-ls-dotdir-root)
            _ (.setupPluginCore js/LSPlugin (bean/->js {:localUserConfigRoot root :dotConfigRoot root}))

            clear-commands! (fn [pid]
                              ;; commands
                              (unregister-plugin-slash-command pid)
                              (unregister-plugin-simple-command pid)
                              (unregister-plugin-ui-items pid))

            _ (doto js/LSPluginCore
                (.on "registered"
                     (fn [^js pl]
                       (register-plugin
                         (bean/->clj (.parse js/JSON (.stringify js/JSON pl))))))

                (.on "reloaded"
                     (fn [^js pl]
                       (register-plugin
                         (bean/->clj (.parse js/JSON (.stringify js/JSON pl))))))

                (.on "unregistered" (fn [pid]
                                      (let [pid (keyword pid)]
                                        ;; effects
                                        (unregister-plugin-themes pid)
                                        ;; plugins
                                        (swap! state/state md/dissoc-in [:plugin/installed-plugins pid])
                                        ;; commands
                                        (clear-commands!))))

                (.on "unlink-plugin" (fn [pid]
                                       (let [pid (keyword pid)]
                                         (ipc/ipc "uninstallMarketPlugin" (name pid)))))

                (.on "beforereload" (fn [^js pl]
                                      (let [pid (.-id pl)]
                                        (clear-commands! pid)
                                        (unregister-plugin-themes pid false))))

                (.on "disabled" (fn [pid]
                                  (clear-commands! pid)
                                  (unregister-plugin-themes pid)))

                (.on "theme-changed" (fn [^js themes]
                                       (swap! state/state assoc :plugin/installed-themes
                                              (vec (mapcat (fn [[pid vs]] (mapv #(assoc % :pid pid) (bean/->clj vs))) (bean/->clj themes))))))

                (.on "theme-selected" (fn [^js opts]
                                        (let [opts (bean/->clj opts)
                                              url (:url opts)
                                              mode (:mode opts)]
                                          (when mode (state/set-theme! mode))
                                          (state/set-state! :plugin/selected-theme url))))

                (.on "settings-changed" (fn [id ^js settings]
                                          (let [id (keyword id)]
                                            (when (and settings
                                                       (contains? (:plugin/installed-plugins @state/state) id))
                                              (update-plugin-settings id (bean/->clj settings)))))))

            default-plugins (get-user-default-plugins)

            _ (.register js/LSPluginCore (bean/->js (if (seq default-plugins) default-plugins [])) true)])
    #(do
       (state/set-state! :plugin/indicator-text "END")
       (callback))))

(defn setup!
  "setup plugin core handler"
  [callback]
  (if (not lsp-enabled?)
    (callback)
    (init-plugins! callback)))
