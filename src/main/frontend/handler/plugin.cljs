(ns frontend.handler.plugin
  "System-component-like ns that provides all high level plugin functionality"
  (:require [promesa.core :as p]
            [rum.core :as rum]
            [frontend.util :as util]
            [clojure.walk :as walk]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [frontend.handler.notification :as notification]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.storage :as storage]
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
            [frontend.config :as config]
            [frontend.format :as format]))

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
    (catch :default e (js/console.error e))))

(defn markdown-to-html
  [s]
  (try
    (if (string? s)
      (js/window.marked.parse s) s)
    (catch js/Error e
      (js/console.error e) s)))

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

(defn check-or-update-marketplace-plugin!
  [{:keys [id] :as pkg} error-handler]
  (when-not (and (:plugin/installing @state/state)
                 (not (plugin-common-handler/installed? id)))
    (state/set-state! :plugin/installing pkg)

    (-> (load-marketplace-plugins false)
        (p/then (fn [mfts]
                  (let [mft (some #(when (= (:id %) id) %) mfts)]
                    ;;TODO: (throw (js/Error. [:not-found-in-marketplace id]))
                    (ipc/ipc :updateMarketPlugin (merge (dissoc pkg :logger) mft)))
                  true))
        (p/catch (fn [^js e]
                   (state/reset-all-updates-state)
                   (error-handler e)
                   (state/set-state! :plugin/installing nil)
                   (js/console.error e))))))

(defn get-plugin-inst
  [pid]
  (try
    (js/LSPluginCore.ensurePlugin (name pid))
    (catch :default _e
      nil)))

(defn call-plugin-user-model!
  [pid key args]
  (when-let [^js pl (get-plugin-inst pid)]
    (let [^js caller (.-caller pl)]
      (.apply (.-callUserModelAsync caller) caller (bean/->js (list* (name key) args))))))

(defn call-plugin-user-command!
  [pid key args]
  (when-let [commands (and key (seq (get (:plugin/simple-commands @state/state) (keyword pid))))]
    (when-let [matched (medley/find-first #(= (:key (second %)) key) commands)]
      (let [[_ cmd action pid] matched]
        (state/pub-event!
          [:exec-plugin-cmd {:type type :key key :pid pid :cmd (assoc cmd :args args) :action action}])))))

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
  (when-let [plugins (seq (state/get-enabled?-installed-plugins false true true true))]
    (filter #(has-setting-schema? (:id %)) plugins)))

(defn setup-install-listener!
  []
  (let [channel  (name :lsp-updates)
        listener (fn [_ ^js e]
                   (when-let [{:keys [status payload only-check]} (bean/->clj e)]
                     (case (keyword status)

                       :completed
                       (let [{:keys [id dst name title theme]} payload
                             name (or title name "Untitled")]
                         (if only-check
                           (state/consume-updates-from-coming-plugin! payload false)
                           (if (plugin-common-handler/installed? id)
                             (when-let [^js pl (get-plugin-inst id)] ;; update
                               (p/then
                                 (.reload pl)
                                 #(do
                                    ;;(if theme (select-a-plugin-theme id))
                                    (notification/show!
                                      (t :plugin/update-plugin name (.-version (.-options pl))) :success)
                                    (state/consume-updates-from-coming-plugin! payload true))))

                             (do                            ;; register new
                               (p/then
                                 (js/LSPluginCore.register (bean/->js {:key id :url dst}))
                                 (fn [] (when theme (js/setTimeout #(select-a-plugin-theme id) 300))))
                               (notification/show!
                                 (t :plugin/installed-plugin name) :success)))))

                       :error
                       (let [error-code  (keyword (string/replace (:error-code payload) #"^[\s\:\[]+" ""))
                             fake-error? (contains? #{:no-new-version} error-code)
                             [msg type] (case error-code

                                          :no-new-version
                                          [(t :plugin/up-to-date ":)") :success]

                                          [error-code :error])
                             pending?    (seq (:plugin/updates-pending @state/state))]

                         (if (and only-check pending?)
                           (state/consume-updates-from-coming-plugin! payload false)

                           (do
                             ;; consume failed download updates
                             (when (and (not only-check) (not pending?))
                               (state/consume-updates-from-coming-plugin! payload true))

                             ;; notify human tips
                             (notification/show!
                               (str
                                 (if (= :error type) "[Error]" "")
                                 (str "<" (:id payload) "> ")
                                 msg) type)))

                         (when-not fake-error?
                           (js/console.error "Update Error:" (:error-code payload))))

                       :default))

                   ;; reset
                   (js/setTimeout #(state/set-state! :plugin/installing nil) 512)
                   true)]

    (js/window.apis.addListener channel listener)))

(defn register-plugin
  [plugin-metadata]
  (when-let [pid (keyword (:id plugin-metadata))]
    (swap! state/state update-in [:plugin/installed-plugins] assoc pid plugin-metadata)))

(defn host-mounted!
  []
  (and config/lsp-enabled? (js/LSPluginCore.hostMounted)))

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
  (let [id      (keyword (str "plugin." pid "/" key))
        binding (:binding keybinding)
        binding (some->> (if (string? binding) [binding] (seq binding))
                         (map util/normalize-user-keyname))
        binding (if util/mac?
                  (or (:mac keybinding) binding) binding)
        mode    (or (:mode keybinding) :global)
        mode    (get keybinding-mode-handler-map (keyword mode))]
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

(defn register-plugin-search-service
  [pid name opts]
  (when-let [pid (and name (keyword pid))]
    (state/install-plugin-service pid :search name opts)))

(defn unregister-plugin-search-services
  [pid]
  (when-let [pid (keyword pid)]
    (state/uninstall-plugin-service pid :search)))

(defn unregister-plugin-themes
  ([pid] (unregister-plugin-themes pid true))
  ([pid effect]
   (js/LSPluginCore.unregisterTheme (name pid) effect)))

(defn get-installed-hooks
  []
  (:plugin/installed-hooks @state/state))

(defn plugin-hook-installed?
  [pid hook]
  (when-let [hooks (and pid (get-installed-hooks))]
    (contains? (get hooks hook) (keyword pid))))

(defn db-block-hook-installed?
  [uuid]
  (when-let [hook (and uuid (str "hook:db:block_" (string/replace (str uuid) "-" "_")))]
    (boolean (seq (get (get-installed-hooks) hook)))))

(defonce *fenced-code-providers (atom #{}))

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
    (->> @*fenced-code-providers
         (map #(state/get-plugin-resource % :fenced-code-renderers key))
         (remove nil?)
         (first))))

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
    (catch :default e
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
                        (notification/show! "No README content." :warn))))
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
  (when config/lsp-enabled?
    (try
      (js-invoke js/LSPluginCore
                 (str "hook" (string/capitalize (name tag)))
                 (name type)
                 (if (coll? payload)
                   (bean/->js (normalize-keyword-for-json payload))
                   payload)
                 (if (keyword? plugin-id) (name plugin-id) plugin-id))
      (catch :default e
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
  (let [tx-data' (group-by first tx-data)
        blocks'  (filter #(when-let [uuid (:block/uuid %)]
                            (db-block-hook-installed? uuid)) blocks)]
    (doseq [b blocks']
      (let [type (str "block:" (:block/uuid b))]
        (hook-plugin-db type {:block b :tx-data (get tx-data' (:db/id b)) :tx-meta tx-meta})))))

(defn hook-plugin-block-slot
  [block payload]
  (when-let [type (and block (str "slot:" (:block/uuid block)))]
    (hook-plugin-editor type (merge payload block) nil)))

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
              _      (fs/create-if-not-exists repo nil path (or default "{}"))
              json   (fs/read-file nil path)]
        [path (js/JSON.parse json)]))))

(defn make-fn-to-save-dotdir-json
  [dirname]
  (fn [key content]
    (when-let [key (and key (name key))]
      (p/let [repo ""
              path (get-ls-dotdir-root)
              path (util/node-path.join path dirname (str key ".json"))]
        (fs/write-file! repo nil path content {:skip-compare? true})))))

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

(defn goto-plugins-settings!
  []
  (when-let [pl (first (seq (get-enabled-plugins-if-setting-schema)))]
    (state/pub-event! [:go/plugins-settings (:id pl)])))

(defn- get-user-default-plugins
  []
  (p/catch
    (p/let [files ^js (ipc/ipc "getUserDefaultPlugins")
            files (js->clj files)]
      (map #(hash-map :url %) files))
    (fn [e]
      (js/console.error e))))

(defn set-auto-checking!
  [v]
  (let [v (boolean v)]
    (println "Updates: " (if v "start" "finish") " auto-checking...")
    (state/set-state! :plugin/updates-auto-checking? v)))

(defn get-auto-checking?
  []
  (:plugin/updates-auto-checking? @state/state))

(defn get-user-checking?
  []
  (boolean (seq (:plugin/updates-pending @state/state))))

(defn get-updates-downloading?
  []
  (boolean (:plugin/updates-downloading? @state/state)))

(defn cancel-user-checking!
  []
  (when (and (get-user-checking?)
             (not (get-auto-checking?)))
    (state/set-state! :plugin/updates-pending {})))

(defn user-check-enabled-for-updates!
  [theme?]
  (let [user-checking? (get-user-checking?)
        auto-checking? (get-auto-checking?)]
    (when auto-checking?
      (set-auto-checking! false))
    (when (or auto-checking? (not user-checking?))
      ;; TODO: too many requests may be limited by Github api
      (when-let [plugins (seq (take 32 (state/get-enabled?-installed-plugins theme?)))]
        (->> plugins
             (map (fn [v] [(keyword (:id v)) v]))
             (into {})
             (state/set-state! :plugin/updates-pending))
        (state/pub-event! [:plugin/consume-updates])))))

(defn auto-check-enabled-for-updates!
  []
  (when (and (not (get-updates-downloading?))
             (not (get-auto-checking?))
             (not (get-user-checking?)))
    ;; TODO: take some plugins used recently
    (when-let [plugins (seq (take 16 (shuffle (state/get-enabled?-installed-plugins nil))))]
      (->> plugins
           (map (fn [v] [(keyword (:id v)) v]))
           (into {})
           (state/set-state! :plugin/updates-pending))
      (state/pub-event! [:plugin/consume-updates])
      (set-auto-checking! true))))

(defn get-enabled-auto-check-for-updates?
  []
  (not (false? (storage/get :lsp-last-auto-updates))))

(defn set-enabled-auto-check-for-updates
  [v?]
  (storage/set :lsp-last-auto-updates (boolean v?)))

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
        [:small.scale-250.opacity-70.mb-10.animate-pulse (svg/logo)]
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
                                (unregister-plugin-resources pid)
                                (unregister-plugin-search-services pid))

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
                                                          (state/set-state! :plugin/selected-theme url)
                                                          (hook-plugin-app :theme-changed theme))))

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
  (if (not config/lsp-enabled?)
    (callback)
    (init-plugins! callback)))


(comment
  {:pending        (count (:plugin/updates-pending @state/state))
   :auto-checking? (boolean (:plugin/updates-auto-checking? @state/state))
   :coming         (count (:plugin/updates-coming @state/state))
   :installing     (:plugin/installing @state/state)
   :downloading?   (boolean (:plugin/updates-downloading? @state/state))})