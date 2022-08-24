(ns frontend.handler.plugin
  (:require [promesa.core :as p]
            [rum.core :as rum]
            [frontend.util :as util]
            [clojure.walk :as walk]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [frontend.handler.notification :as notifications]
            [camel-snake-kebab.core :as csk]
            [frontend.state :as state]
            [medley.core :as medley]
            [frontend.fs :as fs]
            [electron.ipc :as ipc]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.format :as format]))

(defonce lsp-enabled?
         (and (util/electron?)
              (state/lsp-enabled?-or-theme)))

(defn- normalize-keyword-for-json
  [input]
  (when input
    (walk/postwalk
      (fn [a]
        (cond
          (keyword? a) (csk/->camelCase (name a))
          (uuid? a) (str a)
          :else a)) input)))

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

(defn load-plugin-preferences
  []
  (-> (invoke-exported-api "load_user_preferences")
      (p/then #(bean/->clj %))
      (p/then #(state/set-state! :plugin/preferences %))
      (p/catch
       #(js/console.error %))))

(defn save-plugin-preferences!
  ([input] (save-plugin-preferences! input true))
  ([input reload-state?]
   (when-let [^js input (and (map? input) (bean/->js input))]
     (p/then
      (js/LSPluginCore.saveUserPreferences input)
      #(when reload-state?
         (load-plugin-preferences))))))

(defn gh-repo-url [repo]
  (str "https://github.com/" repo))

(defn pkg-asset [id asset]
  (if (and asset (string/starts-with? asset "http"))
    asset (when-let [asset (and asset (string/replace asset #"^[./]+" ""))]
            (str central-endpoint "packages/" id "/" asset))))

(defn load-marketplace-plugins
  [refresh?]
  (if (or refresh? (nil? (:plugin/marketplace-pkgs @state/state)))
    (p/create
      (fn [resolve reject]
        (let [on-ok (fn [res]
                      (if-let [res (and res (bean/->clj res))]
                        (let [pkgs (:packages res)]
                          (state/set-state! :plugin/marketplace-pkgs pkgs)
                          (resolve pkgs))
                        (reject nil)))]
          (if (state/http-proxy-enabled-or-val?)
            (-> (ipc/ipc :httpFetchJSON plugins-url)
                (p/then on-ok)
                (p/catch reject))
            (util/fetch plugins-url on-ok reject)))))
    (p/resolved (:plugin/marketplace-pkgs @state/state))))

(defn load-marketplace-stats
  [refresh?]
  (if (or refresh? (nil? (:plugin/marketplace-stats @state/state)))
    (p/create
      (fn [resolve reject]
        (let [on-ok (fn [^js res]
                      (if-let [res (and res (bean/->clj res))]
                        (do
                          (state/set-state!
                           :plugin/marketplace-stats
                           (into {} (map (fn [[k stat]]
                                           [k (assoc stat
                                                     :total_downloads
                                                     (reduce (fn [a b] (+ a (get b 2))) 0 (:releases stat)))])
                                         res)))
                          (resolve nil))
                        (reject nil)))]
          (if (state/http-proxy-enabled-or-val?)
            (-> (ipc/ipc :httpFetchJSON stats-url)
                (p/then on-ok)
                (p/catch reject))
            (util/fetch stats-url on-ok reject)))))
    (p/resolved nil)))

(defn installed?
  [id]
  (and (contains? (:plugin/installed-plugins @state/state) (keyword id))
       (get-in @state/state [:plugin/installed-plugins (keyword id) :iir])))

(defn install-marketplace-plugin
  [{:keys [id] :as mft}]
  (when-not (and (:plugin/installing @state/state)
                 (installed? id))
    (p/create
      (fn [resolve]
        (state/set-state! :plugin/installing mft)
        (ipc/ipc :installMarketPlugin mft)
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

          (let [mft (some #(when (= (:id %) id) %) mfts)]
            ;;TODO: (throw (js/Error. [:not-found-in-marketplace id]))
            (ipc/ipc :updateMarketPlugin (merge (dissoc pkg :logger) mft)))
          true))

      (fn [^js e]
        (error-handler e)
        (state/set-state! :plugin/installing nil)
        (js/console.error e)))))

(defn get-plugin-inst
  [id]
  (try
    (js/LSPluginCore.ensurePlugin (name id))
    (catch js/Error _e
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

(defn has-setting-schema?
  [id]
  (when-let [pl (and id (get-plugin-inst (name id)))]
    (boolean (.-settingsSchema pl))))

(defn get-enabled-plugins-if-setting-schema
  []
  (when-let [plugins (seq (state/get-enabled?-installed-plugins false nil true))]
    (filter #(has-setting-schema? (:id %)) plugins)))

(defn setup-install-listener!
  []
  (let [channel (name :lsp-installed)
        listener (fn [^js _ ^js e]
                   (js/console.debug :lsp-installed e)

                   (when-let [{:keys [status payload only-check]} (bean/->clj e)]
                     (case (keyword status)

                       :completed
                       (let [{:keys [id dst name title theme]} payload
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

                             (do                            ;; register new
                               (p/then
                                 (js/LSPluginCore.register (bean/->js {:key id :url dst}))
                                 (fn [] (when theme (js/setTimeout #(select-a-plugin-theme id) 300))))
                               (notifications/show!
                                 (str (t :plugin/installed) (t :plugins) ": " name) :success)))))

                       :error
                       (let [error-code (keyword (string/replace (:error-code payload) #"^[\s\:\[]+" ""))
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
                                 (if (= :error type) "[Error]" "")
                                 (str "<" (:id payload) "> ")
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
      (swap! state/state update-in [:plugin/installed-slash-commands pid]
             (fnil merge {}) (hash-map cmd (mapv #(conj % {:pid pid}) actions)))
      (state/pub-event! [:rebuild-slash-commands-list])
      true)))

(defn unregister-plugin-slash-command
  [pid]
  (swap! state/state medley/dissoc-in [:plugin/installed-slash-commands (keyword pid)])
  (state/pub-event! [:rebuild-slash-commands-list]))

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
  [pid {:keys [type] :as cmd} action]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (swap! state/state update-in [:plugin/simple-commands pid]
             (fnil conj []) [type cmd action pid])
      true)))

(defn unregister-plugin-simple-command
  [pid]
  (swap! state/state medley/dissoc-in [:plugin/simple-commands (keyword pid)]))

(defn register-plugin-ui-item
  [pid {:keys [key type] :as opts}]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (let [items (or (get-in @state/state [:plugin/installed-ui-items pid]) [])
            items (filter #(not= key (:key (second %))) items)]
        (swap! state/state assoc-in [:plugin/installed-ui-items pid]
               (conj items [type opts pid])))
      true)))

(defn unregister-plugin-ui-items
  [pid]
  (swap! state/state assoc-in [:plugin/installed-ui-items (keyword pid)] []))

(defn register-plugin-resources
  [pid type {:keys [key] :as opts}]
  (when-let [pid (keyword pid)]
    (when-let [type (and key (keyword type))]
      (let [path [:plugin/installed-resources pid type]]
        (when (contains? #{:error nil} (get-in @state/state (conj path key)))
          (swap! state/state update-in path
            (fnil assoc {}) key (merge opts {:pid pid}))
          true)))))

(defn unregister-plugin-resources
  [pid]
  (when-let [pid (keyword pid)]
    (swap! state/state medley/dissoc-in [:plugin/installed-resources pid])
    true))

(defn unregister-plugin-themes
  ([pid] (unregister-plugin-themes pid true))
  ([pid effect]
   (js/LSPluginCore.unregisterTheme (name pid) effect)))

(def *fenced-code-providers (atom #{}))

(defn register-fenced-code-renderer
  [pid type {:keys [before subs render edit] :as _opts}]
  (when-let [key (and type (keyword type))]
    (register-plugin-resources pid :fenced-code-renderers
      {:key key :edit edit :before before :subs subs :render render})
    (swap! *fenced-code-providers conj pid)
    #(swap! *fenced-code-providers disj pid)))

(defn hook-fenced-code-by-type
  [type]
  (when-let [key (and (seq @*fenced-code-providers) type (keyword type))]
    (first (map #(state/get-plugin-resource % :fenced-code-renderers key)
                @*fenced-code-providers))))

(def *extensions-enhancer-providers (atom #{}))

(defn register-extensions-enhancer
  [pid type {:keys [enhancer] :as _opts}]
  (when-let [key (and type (keyword type))]
    (register-plugin-resources pid :extensions-enhancers
       {:key key :enhancer enhancer})
    (swap! *extensions-enhancer-providers conj pid)
    #(swap! *extensions-enhancer-providers disj pid)))

(defn hook-extensions-enhancer-by-type
  [type]
  (when-let [key (and type (keyword type))]
    (map #(state/get-plugin-resource % :extensions-enhancers key)
         @*extensions-enhancer-providers)))

(defn select-a-plugin-theme
  [pid]
  (when-let [themes (get (group-by :pid (:plugin/installed-themes @state/state)) pid)]
    (when-let [theme (first themes)]
      (js/LSPluginCore.selectTheme (bean/->js theme)))))

(defn update-plugin-settings-state
  [id settings]
  (state/set-state! [:plugin/installed-plugins id :settings]
                    ;; TODO: force settings related ui reactive
                    ;; Sometimes toggle to `disable` not working
                    ;; But related-option data updated?
                    (assoc settings :disabled (boolean (:disabled settings)))))

(defn open-settings-file-in-default-app!
  [id-or-plugin]
  (when-let [plugin (if (coll? id-or-plugin)
                      id-or-plugin (state/get-plugin-by-id id-or-plugin))]
    (when-let [file-path (:usf plugin)]
      (js/apis.openPath file-path))))

(defn open-plugin-settings!
  ([id] (open-plugin-settings! id false))
  ([id nav?]
   (when-let [plugin (and id (state/get-plugin-by-id id))]
     (if (has-setting-schema? id)
       (state/pub-event! [:go/plugins-settings id nav? (or (:name plugin) (:title plugin))])
       (open-settings-file-in-default-app! plugin)))))

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
        (format/to-html content :markdown (gp-mldoc/default-config :markdown))))
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
    (try
      (js-invoke js/LSPluginCore
                 (str "hook" (string/capitalize (name tag)))
                 (name type)
                 (if (coll? payload)
                   (bean/->js (normalize-keyword-for-json payload))
                   payload)
                 (if (keyword? plugin-id) (name plugin-id) plugin-id))
      (catch js/Error e
        (js/console.error "[Hook Plugin Err]" e)))))

(defn hook-plugin-app
  ([type payload] (hook-plugin-app type payload nil))
  ([type payload plugin-id] (hook-plugin :app type payload plugin-id)))

(defn hook-plugin-editor
  ([type payload] (hook-plugin-editor type payload nil))
  ([type payload plugin-id] (hook-plugin :editor type payload plugin-id)))

(defn hook-plugin-db
  ([type payload] (hook-plugin-db type payload nil))
  ([type payload plugin-id] (hook-plugin :db type payload plugin-id)))

(defn hook-plugin-block-changes
  [{:keys [blocks tx-data tx-meta]}]

  (doseq [b blocks
          :let [tx-data' (group-by first tx-data)
                type     (str "block:" (:block/uuid b))]]
    (hook-plugin-db type {:block b :tx-data (get tx-data' (:db/id b)) :tx-meta tx-meta})))

(defn get-ls-dotdir-root
  []
  (ipc/ipc "getLogseqDotDirRoot"))

(defn make-fn-to-load-dotdir-json
  [dirname default]
  (fn [key]
    (when-let [key (and key (name key))]
      (p/let [repo   ""
              path   (get-ls-dotdir-root)
              exist? (fs/file-exists? path dirname)
              _      (when-not exist? (fs/mkdir! (util/node-path.join path dirname)))
              path   (util/node-path.join path dirname (str key ".json"))
              _      (fs/create-if-not-exists repo "" path (or default "{}"))
              json   (fs/read-file "" path)]
        [path (js/JSON.parse json)]))))

(defn make-fn-to-save-dotdir-json
  [dirname]
  (fn [key content]
    (when-let [key (and key (name key))]
      (p/let [repo ""
              path (get-ls-dotdir-root)
              path (util/node-path.join path dirname (str key ".json"))]
        (fs/write-file! repo "" path content {:skip-compare? true})))))

(defn make-fn-to-unlink-dotdir-json
  [dirname]
  (fn [key]
    (when-let [key (and key (name key))]
      (p/let [repo ""
              path (get-ls-dotdir-root)
              path (util/node-path.join path dirname (str key ".json"))]
        (fs/unlink! repo path nil)))))

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
                            (seq (take 32 (state/get-enabled?-installed-plugins theme?))))]
      (state/set-state! :plugin/updates-pending
                        (into {} (map (fn [v] [(keyword (:id v)) v]) plugins)))
      (state/pub-event! [:plugin/consume-updates]))))

(defn call-plugin
  [^js pl type payload]
  (when pl
    (.call (.-caller pl) (name type) (bean/->js payload))))

(defn request-callback
  [^js pl req-id payload]
  (call-plugin pl :#lsp#request#callback {:requestId req-id :payload payload}))

(defn op-pinned-toolbar-item!
  [key op]
  (let [pinned (state/sub [:plugin/preferences :pinnedToolbarItems])
        pinned (into #{} pinned)]
    (when-let [op-fn (case op
                       :add conj
                       :remove disj)]
      (save-plugin-preferences! {:pinnedToolbarItems (op-fn pinned (name key))}))))

;; components
(rum/defc lsp-indicator < rum/reactive
  []
  (let [text (state/sub :plugin/indicator-text)]
    (when-not (= text "END")
      [:div.flex.align-items.justify-center.h-screen.w-full.preboot-loading
       [:span.flex.items-center.justify-center.w-60.flex-col
        [:small.scale-250.opacity-70.mb-10.animate-pulse (svg/logo false)]
        [:small.block.text-sm.relative.opacity-50 {:style {:right "-8px"}} text]]])))

(defn ^:large-vars/cleanup-todo init-plugins!
  [callback]

  (let [el (js/document.createElement "div")]
    (.appendChild js/document.body el)
    (rum/mount
     (lsp-indicator) el))

  (state/set-state! :plugin/indicator-text "LOADING")

  (-> (p/let [root            (get-ls-dotdir-root)
              _               (.setupPluginCore js/LSPlugin (bean/->js {:localUserConfigRoot root :dotConfigRoot root}))

              clear-commands! (fn [pid]
                                ;; commands
                                (unregister-plugin-slash-command pid)
                                (invoke-exported-api "unregister_plugin_simple_command" pid)
                                (invoke-exported-api "uninstall_plugin_hook" pid)
                                (unregister-plugin-ui-items pid)
                                (unregister-plugin-resources pid))

              _               (doto js/LSPluginCore
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
                                                        (swap! state/state medley/dissoc-in [:plugin/installed-plugins pid])
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

                                (.on "themes-changed" (fn [^js themes]
                                                        (swap! state/state assoc :plugin/installed-themes
                                                               (vec (mapcat (fn [[pid vs]] (mapv #(assoc % :pid pid) (bean/->clj vs))) (bean/->clj themes))))))

                                (.on "theme-selected" (fn [^js theme]
                                                        (let [theme (bean/->clj theme)
                                                              url   (:url theme)
                                                              mode  (:mode theme)]
                                                          (when mode
                                                            (state/set-custom-theme! mode theme)
                                                            (state/set-theme-mode! mode))
                                                          (hook-plugin-app :theme-changed theme)
                                                          (state/set-state! :plugin/selected-theme url))))

                                (.on "reset-custom-theme" (fn [^js themes]
                                                            (let [themes       (bean/->clj themes)
                                                                  custom-theme (dissoc themes :mode)
                                                                  mode         (:mode themes)]
                                                              (state/set-custom-theme! {:light (if (nil? (:light custom-theme)) {:mode "light"} (:light custom-theme))
                                                                                        :dark  (if (nil? (:dark custom-theme)) {:mode "dark"} (:dark custom-theme))})
                                                              (state/set-theme-mode! mode))))

                                (.on "settings-changed" (fn [id ^js settings]
                                                          (let [id (keyword id)]
                                                            (when (and settings
                                                                       (contains? (:plugin/installed-plugins @state/state) id))
                                                              (update-plugin-settings-state id (bean/->clj settings))))))

                                (.on "ready" (fn [^js perf-table]
                                               (when-let [plugins (and perf-table (.entries perf-table))]
                                                 (->> plugins
                                                      (keep
                                                       (fn [[_k ^js v]]
                                                         (when-let [end (and (some-> v (.-o) (.-disabled) (not))
                                                                             (.-e v))]
                                                           (when (and (number? end)
                                                                      ;; valid end time
                                                                      (> end 0)
                                                                      ;; greater than 3s
                                                                      (> (- end (.-s v)) 3000))
                                                             v))))
                                                      ((fn [perfs]
                                                         (doseq [perf perfs]
                                                           (state/pub-event! [:plugin/loader-perf-tip (bean/->clj perf)])))))))))

              default-plugins (get-user-default-plugins)

              _               (.register js/LSPluginCore (bean/->js (if (seq default-plugins) default-plugins [])) true)])

      (p/then
       (fn []
         (state/set-state! :plugin/indicator-text "END")
         (callback)))
      (p/catch
       (fn [^js e]
         (log/error :setup-plugin-system-error e)
         (state/set-state! :plugin/indicator-text (str "Fatal: " e))))))

(defn setup!
  "setup plugin core handler"
  [callback]
  (if (not lsp-enabled?)
    (callback)
    (init-plugins! callback)))
