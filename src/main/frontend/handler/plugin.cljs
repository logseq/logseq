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
              (state/lsp-enabled?-or-theme)))

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
                      (when res
                        (state/set-state!
                          :plugin/marketplace-stats
                          (into {} (map (fn [[k stat]]
                                          [k (assoc stat
                                               :total_downloads
                                               (reduce (fn [a b] (+ a (get b 2))) 0 (:releases stat)))])
                                        res)))
                        (resolve nil)))
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

(defn check-or-update-marketplace-plugin
  [{:keys [id] :as pkg} error-handler]
  (when-not (and (:plugin/installing @state/state)
                 (not (installed? id)))
    (p/catch
      (p/then
        (do (state/set-state! :plugin/installing pkg)
            (p/catch
              (load-marketplace-plugins false)
              (fn [^js e]
                (state/reset-all-updates-state)
                (throw e))))
        (fn [mfts]
          (if-let [mft (some #(if (= (:id %) id) %) mfts)]
            (do
              (ipc/ipc "updateMarketPlugin" (merge (dissoc pkg :logger) mft)))
            (throw (js/Error. (str ":not-found-in-marketplace" id))))
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

(defn open-updates-downloading
  []
  (when (and (not (:plugin/updates-downloading? @state/state))
             (seq (state/all-available-coming-updates)))
    (->> (:plugin/updates-coming @state/state)
         (map #(if (state/coming-update-new-version? (second %1))
                 (update % 1 dissoc :error-code) %1))
         (into {})
         (state/set-state! :plugin/updates-coming))
    (state/set-state! :plugin/updates-downloading? true)))

(defn close-updates-downloading
  []
  (when (:plugin/updates-downloading? @state/state)
    (state/set-state! :plugin/updates-downloading? false)))


(defn setup-install-listener!
  [t]
  (let [channel (name :lsp-installed)
        listener (fn [^js _ ^js e]
                   (js/console.debug :lsp-installed e)

                   (when-let [{:keys [status payload only-check]} (bean/->clj e)]
                     (case (keyword status)

                       :completed
                       (let [{:keys [id dst name title version theme]} payload
                             name (or title name "Untitled")]
                         (if only-check
                           (state/consume-updates-coming-plugin payload false)
                           (if (installed? id)
                             (when-let [^js pl (get-plugin-inst id)] ;; update
                               (p/then
                                 (.reload pl)
                                 #(do
                                    ;;(if theme (select-a-plugin-theme id))
                                    (notifications/show!
                                      (str (t :plugin/update) (t :plugins) ": " name " - " (.-version (.-options pl))) :success)
                                    (state/consume-updates-coming-plugin payload true))))

                             (do    ;; register new
                               (p/then
                                 (js/LSPluginCore.register (bean/->js {:key id :url dst}))
                                 (fn [] (if theme (js/setTimeout #(select-a-plugin-theme id) 300))))
                               (notifications/show!
                                 (str (t :plugin/installed) (t :plugins) ": " name) :success)))))

                       :error
                       (let [error-code (keyword (string/replace (:error-code payload) #"^[\s\:]+" ""))
                             [msg type] (case error-code

                                          :no-new-version
                                          [(str (t :plugin/up-to-date) " :)") :success]

                                          [error-code :error])
                             pending? (seq (:plugin/updates-pending @state/state))]

                         (if (and only-check pending?)
                           (state/consume-updates-coming-plugin payload false)

                           (do
                             ;; consume failed download updates
                             (when (and (not only-check) (not pending?))
                               (state/consume-updates-coming-plugin payload true))

                             ;; notify human tips
                             (notifications/show!
                               (str
                                 (if (= :error type) "[Install Error]" "")
                                 msg) type)))

                         (js/console.error payload))

                       :dunno))

                   ;; reset
                   (js/setTimeout #(state/set-state! :plugin/installing nil) 512)
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

(def keybinding-mode-handler-map
  {:global      :shortcut.handler/editor-global
   :non-editing :shortcut.handler/global-non-editing-only
   :editing     :shortcut.handler/block-editing-only})

(defn simple-cmd->palette-cmd
  [pid {:keys [key label type desc keybinding] :as cmd} action]
  (let [palette-cmd {:id         (keyword (str "plugin." pid "/" key))
                     :desc       (or desc label)
                     :shortcut   (when-let [shortcut (:binding keybinding)]
                                   (if util/mac?
                                     (or (:mac keybinding) shortcut)
                                     shortcut))
                     :handler-id (let [mode (or (:mode keybinding) :global)]
                                   (get keybinding-mode-handler-map (keyword mode)))
                     :action     (fn []
                                   (state/pub-event!
                                     [:exec-plugin-cmd {:type type :key key :pid pid :cmd cmd :action action}]))}]
    palette-cmd))

(defn simple-cmd-keybinding->shortcut-args
  [pid key keybinding]
  (let [id (keyword (str "plugin." pid "/" key))
        binding (:binding keybinding)
        binding (if util/mac?
                  (or (:mac keybinding) binding)
                  binding)
        mode (or (:mode keybinding) :global)
        mode (get keybinding-mode-handler-map (keyword mode))]
    [mode id {:binding binding}]))

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
                 (state/set-sub-modal! (fn [_] (display))))
          (p/catch #(do (js/console.warn %)
                        (notifications/show! "No README content." :warn))))
      ;; market
      (state/set-sub-modal! (fn [_] (display repo nil))))))

(defn load-unpacked-plugin
  []
  (when util/electron?
    (p/let [path (ipc/ipc "openDialog")]
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
  (state/pub-event! [:go/plugins]))

(defn- get-user-default-plugins
  []
  (p/catch
    (p/let [files ^js (ipc/ipc "getUserDefaultPlugins")
            files (js->clj files)]
           (map #(hash-map :url %) files))
    (fn [e]
      (js/console.error e))))

(defn check-enabled-for-updates
  [theme?]
  (let [pending? (seq (:plugin/updates-pending @state/state))]
    (when-let [plugins (and (not pending?)
                            ;; TODO: too many requests may be limited by Github api
                            (seq (take 32 (state/get-enabled-installed-plugins theme?))))]
      (state/set-state! :plugin/updates-pending
                        (into {} (map (fn [v] [(keyword (:id v)) v]) plugins)))
      (state/pub-event! [:plugin/consume-updates]))))

;; components
(rum/defc lsp-indicator < rum/reactive
  []
  (let [text (state/sub :plugin/indicator-text)]
    (if-not (= text "END")
      [:div.flex.align-items.justify-center.h-screen.w-full.preboot-loading
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
                              (invoke-exported-api "unregister_plugin_simple_command" pid)
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
                                        (clear-commands! pid))))

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
