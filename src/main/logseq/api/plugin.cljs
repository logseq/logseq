(ns logseq.api.plugin
  "Plugin related apis"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.common.idb :as idb]
            [frontend.modules.layout.core]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.core :as st]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
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

(defn- storage-dir
  [root-dir sub-root]
  (util/node-path.normalize (util/node-path.join root-dir sub-root)))

(defn- sub-path?
  [root-dir path]
  (let [relative (.relative util/node-path root-dir path)
        parent-dir-segment? (or (= relative "..")
                                (string/starts-with? relative (str ".." (.-sep util/node-path))))]
    (or (string/blank? relative)
        (and (not parent-dir-segment?)
             (not (.isAbsolute util/node-path relative))))))

(defn- assert-storage-path!
  [root-dir path action]
  (when-not (sub-path? root-dir path)
    (log/info :debug path)
    (throw (js/Error. (str action " file denied")))))

(defn- storage-file-path
  [root-dir file action]
  (let [path (util/node-path.normalize (util/node-path.join root-dir file))]
    (assert-storage-path! root-dir path action)
    path))

(defn- plugin-storage-root
  [assets?]
  (if (true? assets?)
    (config/get-current-repo-assets-root)
    (plugin-handler/get-ls-dotdir-root)))

(defn- plugin-storage-sub-root
  [plugin-id]
  (util/node-path.join "storages" (util/node-path.basename plugin-id)))

(defn- binary-content?
  "Detect payload shapes that can't be transit-serialized through ipc/ipc.
   Mirrors assets-handler/->uint8 — anything it accepts as binary, we route
   through writeFileBytes instead of write-plain-text-file!."
  [content]
  (or (instance? js/ArrayBuffer content)
      (instance? js/Uint8Array content)
      (and (exists? js/ArrayBuffer) (.isView js/ArrayBuffer content))
      (and (object? content)
           (= "Buffer" (aget content "type"))
           (array? (aget content "data")))))

(defn- write_rootdir_file
  [file content sub-root root-dir]
  (p/let [repo           ""
          path           (storage-dir root-dir sub-root)
          exist?         (fs/file-exists? path "")
          _              (when-not exist? (fs/mkdir-recur! path))
          user-path      (storage-file-path path file "write")
          user-path-root (util/node-path.dirname user-path)
          exist?         (fs/file-exists? user-path-root "")
          _              (when-not exist? (fs/mkdir-recur! user-path-root))
          ;; Binary content (ArrayBuffer/Uint8Array/...) can't survive
          ;; transit serialization through ipc/ipc inside write-plain-text-file!,
          ;; so on Electron we bypass to window.apis.writeFileBytes — same path
          ;; the native fs/write-asset-file! uses for the same reason.
          _              (if (and (binary-content? content) (util/electron?))
                           (js/window.apis.writeFileBytes user-path (assets-handler/->uint8 content))
                           (fs/write-plain-text-file! repo nil user-path content {:skip-compare? true}))]
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
  (p/let [path      (storage-dir root-dir sub-root)
          user-path (storage-file-path path file "read")
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
          path      (storage-dir root-dir sub-root)
          user-path (storage-file-path path file "access")
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

(defn- clear_rootdir_files!
  [sub-root root-dir]
  (let [path (storage-dir root-dir sub-root)]
    (if (util/electron?)
      (p/let [exist? (fs/file-exists? path)
              ^js files (when exist? (ipc/ipc :listdir path))
              files (when (js-iterable? files) (bean/->clj files))
              _ (p/all
                 (map (fn [file-path]
                        (let [file-path (util/node-path.normalize file-path)]
                          (assert-storage-path! path file-path "access")
                          (fs/unlink! "" file-path {})))
                      files))]
        nil)
      (fs/rmdir! path))))

(def write_user_tmp_file
  (fn [file content]
    (write_dotdir_file file content "tmp")))

(def write_plugin_storage_file
  (fn [plugin-id file content assets?]
    (let [sub-root (plugin-storage-sub-root plugin-id)]
      (if (true? assets?)
        (write_assetsdir_file file content sub-root)
        (write_dotdir_file file content sub-root)))))

(def read_plugin_storage_file
  (fn [plugin-id file assets?]
    (let [sub-root (plugin-storage-sub-root plugin-id)]
      (if (true? assets?)
        (read_assetsdir_file file sub-root)
        (read_dotdir_file file sub-root)))))

(def unlink_plugin_storage_file
  (fn [plugin-id file assets?]
    (let [sub-root (plugin-storage-sub-root plugin-id)]
      (if (true? assets?)
        (unlink_assetsdir_file! file sub-root)
        (unlink_dotdir_file! file sub-root)))))

(def exist_plugin_storage_file
  (fn [plugin-id file assets?]
    (p/let [root      (plugin-storage-root assets?)
            sub-root  (plugin-storage-sub-root plugin-id)
            exist?    (when root
                        (let [path      (storage-dir root sub-root)
                              user-path (storage-file-path path file "access")]
                          (fs/file-exists? "" user-path)))]
      (boolean exist?))))

(def clear_plugin_storage_files
  (fn [plugin-id assets?]
    (p/let [root     (plugin-storage-root assets?)
            sub-root (plugin-storage-sub-root plugin-id)]
      (when root
        (clear_rootdir_files! sub-root root)))))

(def list_plugin_storage_files
  (fn [plugin-id assets?]
    (p/let [root       (plugin-storage-root assets?)
            sub-root   (plugin-storage-sub-root plugin-id)
            files-path (when root (storage-dir root sub-root))
            ^js files  (when files-path (ipc/ipc :listdir files-path))]
      (when (and files-path (js-iterable? files))
        (bean/->js
         (map #(.relative util/node-path files-path %) files))))))

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

(defn unregister_plugin_slash_command
  ([pid]
   (plugin-handler/unregister-plugin-slash-command pid))
  ([pid cmd]
   (plugin-handler/unregister-plugin-slash-command pid cmd)))

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

(defn- plugin-command-id
  [pid-name key]
  (keyword (str "plugin." pid-name "/" key)))

(defn- unregister-plugin-command-entry!
  [id]
  (palette-handler/unregister id)
  (when-let [cmd (get @shortcut-config/*shortcut-cmds id)]
    (when (seq (:shortcut cmd))
      (println :shortcut/unregister-shortcut cmd)
      (st/unregister-shortcut! (:handler-id cmd) (:id cmd)))))

(defn unregister_plugin_simple_command
  ([pid]
   (let [pid-key (keyword pid)
         pid-name (name pid-key)
         command-ids (->> (get-in @state/state [:plugin/simple-commands pid-key])
                          (keep (fn [[_type {:keys [key]} _action _pid]]
                                  (when key
                                    (plugin-command-id pid-name key))))
                          distinct)]
     ;; remove simple commands
     (plugin-handler/unregister-plugin-simple-command pid-key)

     ;; remove palette and keybinding commands
     (doseq [id command-ids]
       (unregister-plugin-command-entry! id))))
  ([pid key]
   (let [pid-key (keyword pid)
         pid-name (name pid-key)
         key (-> key str string/trim (string/replace ":" "-") (string/replace #"^([0-9])" "_$1"))]
     ;; remove simple command
     (plugin-handler/unregister-plugin-simple-command pid-key key)

     ;; remove palette and keybinding command
     (unregister-plugin-command-entry! (plugin-command-id pid-name key)))))

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
