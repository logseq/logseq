(ns logseq.api.plugin
  "Plugin related apis"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.idb :as idb]
            [frontend.modules.layout.core]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.core :as st]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [promesa.core :as p]))

(defn get-caller-plugin-id
  [] (gobj/get js/window "$$callerPluginID"))

;; helpers
(defn install-plugin-hook
  [pid hook ^js opts]
  (state/install-plugin-hook pid hook (bean/->clj opts)))

(defn uninstall-plugin-hook
  [pid hook-or-all]
  (state/uninstall-plugin-hook pid hook-or-all))

(defn should-exec-plugin-hook
  [pid hook]
  (plugin-handler/plugin-hook-installed? pid hook))

(def load_plugin_config
  (fn [path]
    (if (util/electron?)
      (fs/read-file nil (util/node-path.join path "package.json"))
      (js/console.log "TODO: load plugin package.json from web plugin."))))

(def load_plugin_readme
  (fn [path]
    (fs/read-file nil (util/node-path.join path "readme.md"))))

(def save_plugin_package_json
  (fn [path ^js data]
    (let [repo ""
          path (util/node-path.join path "package.json")]
      (fs/write-plain-text-file! repo nil path (js/JSON.stringify data nil 2) {:skip-compare? true}))))

(defn- write_rootdir_file
  [file content sub-root root-dir]
  (p/let [repo           ""
          path           (util/node-path.join root-dir sub-root)
          exist?         (fs/file-exists? path "")
          _              (when-not exist? (fs/mkdir-recur! path))
          user-path      (util/node-path.join path file)
          sub-dir?       (string/starts-with? user-path path)
          _              (when-not sub-dir?
                           (log/info :debug user-path)
                           (throw (js/Error. "write file denied")))
          user-path-root (util/node-path.dirname user-path)
          exist?         (fs/file-exists? user-path-root "")
          _              (when-not exist? (fs/mkdir-recur! user-path-root))
          _              (fs/write-plain-text-file! repo nil user-path content {:skip-compare? true})]
    user-path))

(defn write_dotdir_file
  [file content sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(write_rootdir_file file content sub-root %))))

(defn write_assetsdir_file
  [file content sub-root]
  (if-let [assets-dir (config/get-current-repo-assets-root)]
    (write_rootdir_file file content sub-root assets-dir)
    false))

(defn- read_rootdir_file
  [file sub-root root-dir]
  (p/let [path      (util/node-path.join root-dir sub-root)
          user-path (util/node-path.join path file)
          sub-dir?  (string/starts-with? user-path path)
          _         (when-not sub-dir? (log/info :debug user-path) (throw (js/Error. "read file denied")))
          exist?    (fs/file-exists? "" user-path)
          _         (when-not exist? (log/info :debug user-path) (throw (js/Error. "file not existed")))
          content   (fs/read-file "" user-path)]
    content))

(defn- read_dotdir_file
  [file sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(read_rootdir_file file sub-root %))))

(defn- read_assetsdir_file
  [file sub-root]
  (when-let [root-dir (config/get-current-repo-assets-root)]
    (read_rootdir_file file sub-root root-dir)))

(defn- unlink_rootdir_file!
  [file sub-root root-dir]
  (p/let [repo      ""
          path      (util/node-path.join root-dir sub-root)
          user-path (util/node-path.join path file)
          sub-dir?  (string/starts-with? user-path path)
          _         (when-not sub-dir? (log/info :debug user-path) (throw (js/Error. "access file denied")))
          exist?    (fs/file-exists? "" user-path)
          _         (when-not exist? (log/info :debug user-path) (throw (js/Error. "file not existed")))
          _         (fs/unlink! repo user-path {})]))

(defn- unlink_dotdir_file!
  [file sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(unlink_rootdir_file! file sub-root %))))

(defn- unlink_assetsdir_file!
  [file sub-root]
  (when-let [root-dir (config/get-current-repo-assets-root)]
    (unlink_rootdir_file! file sub-root root-dir)))

(def write_user_tmp_file
  (fn [file content]
    (write_dotdir_file file content "tmp")))

(def write_plugin_storage_file
  (fn [plugin-id file content assets?]
    (let [plugin-id (util/node-path.basename plugin-id)
          sub-root  (util/node-path.join "storages" plugin-id)]
      (if (true? assets?)
        (write_assetsdir_file file content sub-root)
        (write_dotdir_file file content sub-root)))))

(def read_plugin_storage_file
  (fn [plugin-id file assets?]
    (let [plugin-id (util/node-path.basename plugin-id)
          sub-root  (util/node-path.join "storages" plugin-id)]
      (if (true? assets?)
        (read_assetsdir_file file sub-root)
        (read_dotdir_file file sub-root)))))

(def unlink_plugin_storage_file
  (fn [plugin-id file assets?]
    (let [plugin-id (util/node-path.basename plugin-id)
          sub-root  (util/node-path.join "storages" plugin-id)]
      (if (true? assets?)
        (unlink_assetsdir_file! file sub-root)
        (unlink_dotdir_file! file sub-root)))))

(def exist_plugin_storage_file
  (fn [plugin-id file assets?]
    (p/let [root      (if (true? assets?)
                        (config/get-current-repo-assets-root)
                        (plugin-handler/get-ls-dotdir-root))
            plugin-id (util/node-path.basename plugin-id)
            exist?    (fs/file-exists?
                       (util/node-path.join root "storages" plugin-id)
                       file)]
      exist?)))

(def clear_plugin_storage_files
  (fn [plugin-id assets?]
    (p/let [root      (if (true? assets?)
                        (config/get-current-repo-assets-root)
                        (plugin-handler/get-ls-dotdir-root))
            plugin-id (util/node-path.basename plugin-id)]
      (fs/rmdir! (util/node-path.join root "storages" plugin-id)))))

(def list_plugin_storage_files
  (fn [plugin-id assets?]
    (p/let [root       (if (true? assets?)
                         (config/get-current-repo-assets-root)
                         (plugin-handler/get-ls-dotdir-root))
            plugin-id  (util/node-path.basename plugin-id)
            files-path (util/node-path.join root "storages" plugin-id)
            ^js files  (ipc/ipc :listdir files-path)]
      (when (js-iterable? files)
        (bean/->js
         (map #(some-> (string/replace-first % files-path "")
                       (string/replace #"^/+" "")) files))))))

(def load_user_preferences
  (fn []
    (let [repo ""
          path (plugin-handler/get-ls-dotdir-root)
          path (util/node-path.join path "preferences.json")]
      (if (util/electron?)
        (p/let [_ (fs/create-if-not-exists repo nil path)
                json (fs/read-file nil path)
                json (if (string/blank? json) "{}" json)]
          (js/JSON.parse json))
        (p/let [json (idb/get-item path)]
          (or json #js {}))))))

(def save_user_preferences
  (fn [^js data]
    (when data
      (let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "preferences.json")]
        (if (util/electron?)
          (fs/write-plain-text-file! repo nil path (js/JSON.stringify data nil 2) {:skip-compare? true})
          (idb/set-item! path data))))))

(def load_plugin_user_settings
  ;; results [path data]
  (plugin-handler/make-fn-to-load-dotdir-json "settings" #js {}))

(def save_plugin_user_settings
  (fn [key ^js data]
    ((plugin-handler/make-fn-to-save-dotdir-json "settings")
     key data)))

(defn load_installed_web_plugins
  []
  (let [getter (plugin-handler/make-fn-to-load-dotdir-json "installed-plugins-for-web" #js {})]
    (some-> (getter :all) (p/then second))))

(defn save_installed_web_plugin
  ([^js plugin] (save_installed_web_plugin plugin false))
  ([^js plugin remove?]
   (when-let [id (some-> plugin (.-key) (name))]
     (let [setter (plugin-handler/make-fn-to-save-dotdir-json "installed-plugins-for-web")
           plugin (js/JSON.parse (js/JSON.stringify plugin))]
       (p/let [^js plugins (or (load_installed_web_plugins) #js {})]
         (if (true? remove?)
           (when (aget plugins id)
             (js-delete plugins id))
           (gobj/set plugins id plugin))
         (setter :all plugins))))))

(defn unlink_installed_web_plugin
  [key]
  (save_installed_web_plugin #js {:key key} true))

(def unlink_plugin_user_settings
  (plugin-handler/make-fn-to-unlink-dotdir-json "settings"))

(def register_plugin_slash_command
  (fn [pid ^js cmd-actions]
    (when-let [[cmd actions] (bean/->clj cmd-actions)]
      (plugin-handler/register-plugin-slash-command
       pid [cmd (mapv #(into [(keyword (first %))]
                             (rest %)) actions)]))))

(def register_plugin_simple_command
  (fn [pid ^js cmd-action palette?]
    (when-let [[cmd action] (bean/->clj cmd-action)]
      (let [action      (assoc action 0 (keyword (first action)))
            cmd         (assoc cmd :key (-> (:key cmd) (string/trim) (string/replace ":" "-") (string/replace #"^([0-9])" "_$1")))
            key         (:key cmd)
            keybinding  (:keybinding cmd)
            palette-cmd (plugin-handler/simple-cmd->palette-cmd pid cmd action)
            action'     #(state/pub-event! [:exec-plugin-cmd {:type type :key key :pid pid :cmd cmd :action action}])]

        ;; handle simple commands
        (plugin-handler/register-plugin-simple-command pid cmd action)

        ;; handle palette commands
        (when palette?
          (palette-handler/register palette-cmd))

        ;; handle keybinding commands
        (when-let [shortcut-args (and keybinding (plugin-handler/simple-cmd-keybinding->shortcut-args pid key keybinding))]
          (let [dispatch-cmd (fn [_e]
                               (if palette?
                                 (palette-handler/invoke-command palette-cmd)
                                 (action')))
                [mode-id id shortcut-map] (update shortcut-args 2 merge cmd {:fn dispatch-cmd :cmd palette-cmd})]

            (cond
              ;; FIX ME: move to register logic
              (= mode-id :shortcut.handler/block-editing-only)
              (shortcut-config/add-shortcut! mode-id id shortcut-map)

              :else
              (do
                (println :shortcut/register-shortcut [mode-id id shortcut-map])
                (st/register-shortcut! mode-id id shortcut-map)))))))))

(defn unregister_plugin_simple_command
  [pid]
  ;; remove simple commands
  (plugin-handler/unregister-plugin-simple-command pid)

  ;; remove palette commands
  (let [cmds-matched (->> (vals @shortcut-config/*shortcut-cmds)
                          (filter #(string/includes? (str (:id %)) (str "plugin." pid))))]
    (when (seq cmds-matched)
      (doseq [cmd cmds-matched]
        (palette-handler/unregister (:id cmd))
        ;; remove keybinding commands
        (when (seq (:shortcut cmd))
          (println :shortcut/unregister-shortcut cmd)
          (st/unregister-shortcut! (:handler-id cmd) (:id cmd)))))))

(defn register_search_service
  [pid name ^js opts]
  (plugin-handler/register-plugin-search-service pid name (bean/->clj opts)))

(defn unregister_search_services
  [pid]
  (plugin-handler/unregister-plugin-search-services pid))

(def register_plugin_ui_item
  (fn [pid type ^js opts]
    (when-let [opts (bean/->clj opts)]
      (plugin-handler/register-plugin-ui-item
       pid (assoc opts :type type)))))

(defn get_external_plugin
  [pid]
  (when-let [^js pl (plugin-handler/get-plugin-inst pid)]
    (.toJSON pl)))

(defn invoke_external_plugin_cmd
  [pid cmd-group cmd-key cmd-args]
  (case (keyword cmd-group)
    :models
    (plugin-handler/call-plugin-user-model! pid cmd-key cmd-args)

    :commands
    (plugin-handler/call-plugin-user-command! pid cmd-key cmd-args)))

(defn validate_external_plugins [urls]
  (ipc/ipc :validateUserExternalPlugins urls))

(def __install_plugin
  (fn [^js manifest]
    (when-let [{:keys [repo id] :as manifest} (bean/->clj manifest)]
      (if-not (and repo id)
        (throw (js/Error. "[required] :repo :id"))
        (plugin-common-handler/install-marketplace-plugin! manifest)))))
