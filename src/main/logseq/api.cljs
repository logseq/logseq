(ns logseq.api
  "Logseq API for plugins usage"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.model :as db-model]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.query-react :as query-react]
            [frontend.db.utils :as db-utils]
            [frontend.fs :as fs]
            [frontend.handler.code :as code-handler]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.dnd :as editor-dnd-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.shell :as shell]
            [frontend.idb :as idb]
            [frontend.loader :as loader]
            [frontend.modules.layout.core]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.core :as st]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.version :as fv]
            [goog.date :as gdate]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.api.block :as api-block]
            [logseq.api.db :as db-api]
            [logseq.api.file :as file-api]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.outliner.core :as outliner-core]
            [logseq.sdk.assets :as sdk-assets]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.ui :as sdk-ui]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

;; Alert: this namespace shouldn't invoke any reactive queries

(defn- <get-block
  [id-or-name & opts]
  (when id-or-name
    (db-async/<get-block (state/get-current-repo) id-or-name opts)))

(defn- db-graph?
  []
  (some-> (state/get-current-repo)
          (config/db-based-graph?)))

(defn ^:export get-caller-plugin-id
  [] (gobj/get js/window "$$callerPluginID"))

;; helpers
(defn ^:export install-plugin-hook
  [pid hook ^js opts]
  (state/install-plugin-hook pid hook (bean/->clj opts)))

(defn ^:export uninstall-plugin-hook
  [pid hook-or-all]
  (state/uninstall-plugin-hook pid hook-or-all))

(defn ^:export should-exec-plugin-hook
  [pid hook]
  (plugin-handler/plugin-hook-installed? pid hook))

;; base
(defn ^:export get_state_from_store
  [^js path]
  (when-let [path (if (string? path) [path] (bean/->clj path))]
    (some->> path
             (map #(if (string/starts-with? % "@")
                     (subs % 1)
                     (keyword %)))
             (get-in @state/state)
             (#(if (util/atom? %) @% %))
             (sdk-utils/normalize-keyword-for-json)
             (bean/->js))))

(defn ^:export set_state_from_store
  [^js path ^js value]
  (when-let [path (if (string? path) [path] (bean/->clj path))]
    (some->> path
             (map #(if (string/starts-with? % "@")
                     (subs % 1)
                     (keyword %)))
             (into [])
             (#(state/set-state! % (bean/->clj value))))))

(defn ^:export get_app_info
  ;; get app base info
  []
  (-> (sdk-utils/normalize-keyword-for-json
       {:version fv/version
        :supportDb true})
      (bean/->js)))

(def ^:export get_user_configs
  (fn []
    (bean/->js
     (sdk-utils/normalize-keyword-for-json
      {:preferred-language      (:preferred-language @state/state)
       :preferred-theme-mode    (:ui/theme @state/state)
       :preferred-format        (state/get-preferred-format)
       :preferred-workflow      (state/get-preferred-workflow)
       :preferred-todo          (state/get-preferred-todo)
       :preferred-date-format   (state/get-date-formatter)
       :preferred-start-of-week (state/get-start-of-week)
       :current-graph           (state/get-current-repo)
       :show-brackets           (state/show-brackets?)
       :enabled-journals        (state/enable-journals?)
       :enabled-flashcards      (state/enable-flashcards?)
       :me                      (state/get-me)}))))

(def ^:export get_current_graph_configs
  (fn [& keys]
    (some-> (state/get-config)
            (#(if (seq keys) (get-in % (map keyword keys)) %))
            (bean/->js))))

(def ^:export set_current_graph_configs
  (fn [^js configs]
    (when-let [configs (bean/->clj configs)]
      (when (map? configs)
        (doseq [[k v] configs]
          (config-handler/set-config! k v))))))

(def ^:export get_current_graph_favorites
  (fn []
    (if (db-graph?)
      (db-api/get-favorites)
      (some->> (:favorites (state/get-config))
               (remove string/blank?)
               (filter string?)
               (bean/->js)))))

(def ^:export get_current_graph_recent
  (fn []
    (some->> (recent-handler/get-recent-pages)
             (map #(db-utils/entity (:db/id %)))
             (remove nil?)
             (sdk-utils/normalize-keyword-for-json)
             (bean/->js))))

(def ^:export get_current_graph
  (fn []
    (when-let [repo (state/get-current-repo)]
      (when-not (= config/demo-repo repo)
        (bean/->js {:url  repo
                    :name (util/node-path.basename repo)
                    :path (config/get-repo-dir repo)})))))

(def ^:export check_current_is_db_graph db-graph?)

(def ^:export show_themes
  (fn []
    (state/pub-event! [:modal/show-themes-modal])))

(def ^:export set_theme_mode
  (fn [mode]
    (state/set-theme-mode! mode)))

(def ^:export load_plugin_config
  (fn [path]
    (if (util/electron?)
      (fs/read-file nil (util/node-path.join path "package.json"))
      (js/console.log "TODO: load plugin package.json from web plugin."))))

(def ^:export load_plugin_readme
  (fn [path]
    (fs/read-file nil (util/node-path.join path "readme.md"))))

(def ^:export save_plugin_package_json
  (fn [path ^js data]
    (let [repo ""
          path (util/node-path.join path "package.json")]
      (fs/write-plain-text-file! repo nil path (js/JSON.stringify data nil 2) {:skip-compare? true}))))

(def ^:export save_focused_code_editor_content
  (fn []
    (code-handler/save-code-editor!)))

(defn ^:private write_rootdir_file
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

(defn ^:export write_dotdir_file
  [file content sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(write_rootdir_file file content sub-root %))))

(defn ^:export write_assetsdir_file
  [file content sub-root]
  (if-let [assets-dir (config/get-current-repo-assets-root)]
    (write_rootdir_file file content sub-root assets-dir)
    false))

(defn ^:private read_rootdir_file
  [file sub-root root-dir]
  (p/let [path      (util/node-path.join root-dir sub-root)
          user-path (util/node-path.join path file)
          sub-dir?  (string/starts-with? user-path path)
          _         (when-not sub-dir? (log/info :debug user-path) (throw (js/Error. "read file denied")))
          exist?    (fs/file-exists? "" user-path)
          _         (when-not exist? (log/info :debug user-path) (throw (js/Error. "file not existed")))
          content   (fs/read-file "" user-path)]
    content))

(defn ^:private read_dotdir_file
  [file sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(read_rootdir_file file sub-root %))))

(defn ^:private read_assetsdir_file
  [file sub-root]
  (when-let [root-dir (config/get-current-repo-assets-root)]
    (read_rootdir_file file sub-root root-dir)))

(defn ^:private unlink_rootdir_file!
  [file sub-root root-dir]
  (p/let [repo      ""
          path      (util/node-path.join root-dir sub-root)
          user-path (util/node-path.join path file)
          sub-dir?  (string/starts-with? user-path path)
          _         (when-not sub-dir? (log/info :debug user-path) (throw (js/Error. "access file denied")))
          exist?    (fs/file-exists? "" user-path)
          _         (when-not exist? (log/info :debug user-path) (throw (js/Error. "file not existed")))
          _         (fs/unlink! repo user-path {})]))

(defn ^:private unlink_dotdir_file!
  [file sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(unlink_rootdir_file! file sub-root %))))

(defn ^:private unlink_assetsdir_file!
  [file sub-root]
  (when-let [root-dir (config/get-current-repo-assets-root)]
    (unlink_rootdir_file! file sub-root root-dir)))

(def ^:export write_user_tmp_file
  (fn [file content]
    (write_dotdir_file file content "tmp")))

(def ^:export write_plugin_storage_file
  (fn [plugin-id file content assets?]
    (let [plugin-id (util/node-path.basename plugin-id)
          sub-root  (util/node-path.join "storages" plugin-id)]
      (if (true? assets?)
        (write_assetsdir_file file content sub-root)
        (write_dotdir_file file content sub-root)))))

(def ^:export read_plugin_storage_file
  (fn [plugin-id file assets?]
    (let [plugin-id (util/node-path.basename plugin-id)
          sub-root  (util/node-path.join "storages" plugin-id)]
      (if (true? assets?)
        (read_assetsdir_file file sub-root)
        (read_dotdir_file file sub-root)))))

(def ^:export unlink_plugin_storage_file
  (fn [plugin-id file assets?]
    (let [plugin-id (util/node-path.basename plugin-id)
          sub-root  (util/node-path.join "storages" plugin-id)]
      (if (true? assets?)
        (unlink_assetsdir_file! file sub-root)
        (unlink_dotdir_file! file sub-root)))))

(def ^:export exist_plugin_storage_file
  (fn [plugin-id file assets?]
    (p/let [root      (if (true? assets?)
                        (config/get-current-repo-assets-root)
                        (plugin-handler/get-ls-dotdir-root))
            plugin-id (util/node-path.basename plugin-id)
            exist?    (fs/file-exists?
                       (util/node-path.join root "storages" plugin-id)
                       file)]
      exist?)))

(def ^:export clear_plugin_storage_files
  (fn [plugin-id assets?]
    (p/let [root      (if (true? assets?)
                        (config/get-current-repo-assets-root)
                        (plugin-handler/get-ls-dotdir-root))
            plugin-id (util/node-path.basename plugin-id)]
      (fs/rmdir! (util/node-path.join root "storages" plugin-id)))))

(def ^:export list_plugin_storage_files
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

(def ^:export load_user_preferences
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

(def ^:export save_user_preferences
  (fn [^js data]
    (when data
      (let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "preferences.json")]
        (if (util/electron?)
          (fs/write-plain-text-file! repo nil path (js/JSON.stringify data nil 2) {:skip-compare? true})
          (idb/set-item! path data))))))

(def ^:export load_plugin_user_settings
  ;; results [path data]
  (plugin-handler/make-fn-to-load-dotdir-json "settings" #js {}))

(def ^:export save_plugin_user_settings
  (fn [key ^js data]
    ((plugin-handler/make-fn-to-save-dotdir-json "settings")
     key data)))

(defn ^:export load_installed_web_plugins
  []
  (let [getter (plugin-handler/make-fn-to-load-dotdir-json "installed-plugins-for-web" #js {})]
    (some-> (getter :all) (p/then second))))

(defn ^:export save_installed_web_plugin
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

(defn ^:export unlink_installed_web_plugin
  [key]
  (save_installed_web_plugin #js {:key key} true))

(def ^:export unlink_plugin_user_settings
  (plugin-handler/make-fn-to-unlink-dotdir-json "settings"))

(def ^:export register_plugin_slash_command
  (fn [pid ^js cmd-actions]
    (when-let [[cmd actions] (bean/->clj cmd-actions)]
      (plugin-handler/register-plugin-slash-command
       pid [cmd (mapv #(into [(keyword (first %))]
                             (rest %)) actions)]))))

(def ^:export register_plugin_simple_command
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

(defn ^:export unregister_plugin_simple_command
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

(defn ^:export register_search_service
  [pid name ^js opts]
  (plugin-handler/register-plugin-search-service pid name (bean/->clj opts)))

(defn ^:export unregister_search_services
  [pid]
  (plugin-handler/unregister-plugin-search-services pid))

(def ^:export register_plugin_ui_item
  (fn [pid type ^js opts]
    (when-let [opts (bean/->clj opts)]
      (plugin-handler/register-plugin-ui-item
       pid (assoc opts :type type)))))

;; app
(def ^:export relaunch
  (fn []
    (ipc/ipc "relaunchApp")))

(def ^:export quit
  (fn []
    (ipc/ipc "quitApp")))

(def ^:export open_external_link
  (fn [url]
    (when (re-find #"https?://" url)
      (js/apis.openExternal url))))

(def ^:export invoke_external_command
  (fn [type & args]
    (when-let [id (and (string/starts-with? type "logseq.")
                       (-> (string/replace type #"^logseq." "")
                           (util/safe-lower-case)
                           (keyword)))]
      (when-let [action (get-in (palette-handler/get-commands-unique) [id :action])]
        (apply plugin-handler/hook-lifecycle-fn! id action args)))))

;; flag - boolean | 'toggle'
(def ^:export set_left_sidebar_visible
  (fn [flag]
    (if (= flag "toggle")
      (state/toggle-left-sidebar!)
      (state/set-state! :ui/left-sidebar-open? (boolean flag)))
    nil))

;; flag - boolean | 'toggle'
(def ^:export set_right_sidebar_visible
  (fn [flag]
    (if (= flag "toggle")
      (state/toggle-sidebar-open?!)
      (state/set-state! :ui/sidebar-open? (boolean flag)))
    nil))

(def ^:export clear_right_sidebar_blocks
  (fn [^js opts]
    (state/clear-sidebar-blocks!)
    (when-let [opts (and opts (bean/->clj opts))]
      (and (:close opts) (state/hide-right-sidebar!)))
    nil))

(def ^:export push_state
  (fn [^js k ^js params ^js query]
    (let [k (keyword k)
          page? (= k :page)
          params (bean/->clj params)
          query (bean/->clj query)]
      (if page?
        (-> (:name params)
            (route-handler/redirect-to-page! {:anchor (:anchor query) :push true}))
        (rfe/push-state k params query)))))

(def ^:export replace_state
  (fn [^js k ^js params ^js query]
    (let [k (keyword k)
          page? (= k :page)
          params (bean/->clj params)
          query (bean/->clj query)]
      (if-let [page-name (and page? (:name params))]
        (route-handler/redirect-to-page! page-name {:anchor (:anchor query) :push false})
        (rfe/replace-state k params query)))))

(defn ^:export get_external_plugin
  [pid]
  (when-let [^js pl (plugin-handler/get-plugin-inst pid)]
    (.toJSON pl)))

(defn ^:export invoke_external_plugin_cmd
  [pid cmd-group cmd-key cmd-args]
  (case (keyword cmd-group)
    :models
    (plugin-handler/call-plugin-user-model! pid cmd-key cmd-args)

    :commands
    (plugin-handler/call-plugin-user-command! pid cmd-key cmd-args)))

;; editor
(def ^:export check_editing
  (fn []
    (if (state/get-edit-input-id)
      (str (:block/uuid (state/get-edit-block))) false)))

(def ^:export exit_editing_mode
  (fn [select?]
    (editor-handler/escape-editing {:select? select?})
    nil))

(def ^:export insert_at_editing_cursor
  (fn [content]
    (when-let [input-id (state/get-edit-input-id)]
      (commands/simple-insert! input-id content {})
      (when-let [input (gdom/getElement input-id)]
        (.focus input)))))

(def ^:export restore_editing_cursor
  (fn []
    (when-let [input-id (state/get-edit-input-id)]
      (when-let [input (gdom/getElement input-id)]
        (when (util/el-visible-in-viewport? input)
          (.focus input))))))

(def ^:export get_editing_cursor_position
  (fn []
    (when-let [input-id (state/get-edit-input-id)]
      (bean/->js (sdk-utils/normalize-keyword-for-json (cursor/get-caret-pos (gdom/getElement input-id)))))))

(def ^:export get_editing_block_content
  (fn []
    (state/get-edit-content)))

(def ^:export get_selected_blocks
  (fn []
    (when-let [blocks (state/selection?)]
      (let [blocks (->> blocks
                        (map (fn [^js el] (some->
                                           (.getAttribute el "blockid")
                                           (db-model/get-block-by-uuid)))))]
        (db-api/result->js blocks)))))

(def ^:export clear_selected_blocks
  (fn []
    (state/clear-selection!)))

(def ^:export get_current_page
  (fn []
    (when-let [page (state/get-current-page)]
      (p/let [page (<get-block page {:children? false})]
        (when page
          (db-api/result->js page))))))

(defn ^:export get_page
  [id-or-page-name]
  (p/let [page (<get-block id-or-page-name {:children? false})]
    (when page
      (db-api/result->js page))))

;; FIXME: this doesn't work because the ui doesn't have all pages
(defn ^:export get_all_pages
  []
  (let [db (conn/get-db (state/get-current-repo))]
    (some->
     (->>
      (d/datoms db :avet :block/name)
      (map #(db-utils/pull (:e %)))
      (remove ldb/hidden?)
      (remove (fn [page]
                (common-util/uuid-string? (:block/name page)))))
     (sdk-utils/normalize-keyword-for-json)
     (bean/->js))))

(defn ^:export create_page
  [name ^js properties ^js opts]
  (this-as
   this
   (let [properties (bean/->clj properties)
         db-based? (db-graph?)
         {:keys [redirect format journal schema]} (bean/->clj opts)]
     (p/let [page (<get-block name {:children? false})
             new-page (when-not page
                        (page-handler/<create!
                         name
                         (cond->
                          {:redirect? (if (boolean? redirect) redirect true)
                           :journal? journal
                           :format format}
                           (not db-based?)
                           (assoc :properties properties))))
             _ (when (and db-based? (seq properties))
                 (api-block/db-based-save-block-properties! new-page properties {:plugin this
                                                                                 :schema schema}))]
       (some-> (or page new-page)
               db-api/result->js)))))

(defn ^:export create_journal_page
  [^js date]
  (let [date (js/Date. date)]
    (when-let [datestr (and (not (js/isNaN (.getTime date)))
                            (-> (gdate/Date. date)
                                (date-time-util/format "yyyy-MM-dd")))]
      (create_page datestr nil #js {:journal true :redirect false}))))

(defn ^:export delete_page
  [name]
  (page-handler/<delete! name nil))

(def ^:export rename_page
  page-handler/rename!)

(defn ^:export open_in_right_sidebar
  [block-id-or-uuid]
  (editor-handler/open-block-in-sidebar!
   (if (number? block-id-or-uuid)
     block-id-or-uuid
     (sdk-utils/uuid-or-throw-error block-id-or-uuid))))

(defn ^:export new_block_uuid []
  (str (db/new-block-id)))

(def ^:export select_block
  (fn [block-uuid]
    (when-let [block (db-model/get-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (editor-handler/select-block! (:block/uuid block)) nil)))

(def ^:export edit_block
  (fn [block-uuid ^js opts]
    (when-let [block-uuid (and block-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (when-let [block (db-model/query-block-by-uuid block-uuid)]
        (let [{:keys [pos] :or {pos :max}} (bean/->clj opts)]
          (editor-handler/edit-block! block pos {:container-id :unknown-container}))))))

(defn- <ensure-page-loaded
  [block-uuid-or-page-name]
  (p/let [repo (state/get-current-repo)
          block (db-async/<get-block repo (str block-uuid-or-page-name)
                                     {:children? true
                                      :include-collapsed-children? true})
          _ (when-let [page-id (:db/id (:block/page block))]
              (when-let [page-uuid (:block/uuid (db/entity page-id))]
                (db-async/<get-block repo page-uuid)))]
    block))

(defn ^:export insert_block
  [block-uuid-or-page-name content ^js opts]
  (this-as this
           (when (string/blank? block-uuid-or-page-name)
             (throw (js/Error. "Page title or block UUID shouldn't be empty.")))

           (p/let [block? (util/uuid-string? (str block-uuid-or-page-name))
                   block (<get-block (str block-uuid-or-page-name))]
             (if (and block? (not block))
               (throw (js/Error. "Block not exists"))
               (p/let [{:keys [before start end sibling focus customUUID properties autoOrderedList schema]} (bean/->clj opts)
                       [page-name block-uuid] (if (util/uuid-string? block-uuid-or-page-name)
                                                [nil (uuid block-uuid-or-page-name)]
                                                [block-uuid-or-page-name nil])
                       page-name (when page-name (util/page-name-sanity-lc page-name))
                       _ (when (and page-name
                                    (nil? (ldb/get-page (db/get-db) page-name)))
                           (page-handler/<create! block-uuid-or-page-name {}))
                       custom-uuid (or customUUID (:id properties))
                       custom-uuid (when custom-uuid (sdk-utils/uuid-or-throw-error custom-uuid))
                       edit-block? (if (nil? focus) true focus)
                       _ (when (and custom-uuid (db-model/query-block-by-uuid custom-uuid))
                           (throw (js/Error.
                                   (util/format "Custom block UUID already exists (%s)." custom-uuid))))
                       block-uuid' (if (and (not sibling) before block-uuid)
                                     (let [block (db/entity [:block/uuid block-uuid])
                                           first-child (ldb/get-first-child (db/get-db) (:db/id block))]
                                       (if first-child
                                         (:block/uuid first-child)
                                         block-uuid))
                                     block-uuid)
                       insert-at-first-child? (not= block-uuid' block-uuid)
                       [sibling? before?] (if insert-at-first-child?
                                            [true true]
                                            [sibling before])
                       db-based? (db-graph?)
                       before? (if (and (false? sibling?) before? (not insert-at-first-child?))
                                 false
                                 before?)
                       opts' {:block-uuid block-uuid'
                              :sibling? sibling?
                              :before? before?
                              :start? start
                              :end? end
                              :edit-block? edit-block?
                              :page page-name
                              :custom-uuid custom-uuid
                              :ordered-list? (if (boolean? autoOrderedList) autoOrderedList false)
                              :properties (when (not db-based?)
                                            (merge properties
                                                   (when custom-uuid {:id custom-uuid})))}]
                 (if db-based?
                   (db-api/insert-block this content properties schema opts')
                   (p/let [new-block (editor-handler/api-insert-new-block! content opts')]
                     (bean/->js (sdk-utils/normalize-keyword-for-json new-block)))))))))

(def ^:export insert_batch_block
  (fn [block-uuid ^js batch-blocks-js ^js opts-js]
    (this-as
     this
     (p/let [block (<ensure-page-loaded block-uuid)]
       (when block
         (when-let [blocks (bean/->clj batch-blocks-js)]
           (let [db-based? (db-graph?)
                 blocks' (if-not (vector? blocks) (vector blocks) blocks)
                 opts (bean/->clj opts-js)
                 {:keys [sibling before _schema keepUUID]} opts]
             (if db-based?
               (db-api/insert-batch-blocks this block blocks' opts)
               (let [keep-uuid? (or keepUUID false)
                     _ (when keep-uuid? (doseq
                                         [block (outliner-core/tree-vec-flatten blocks' :children)]
                                          (let [uuid (:id (:properties block))]
                                            (when (and uuid (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error uuid)))
                                              (throw (js/Error.
                                                      (util/format "Custom block UUID already exists (%s)." uuid)))))))
                     block (if before
                             (db/pull (:db/id (ldb/get-left-sibling (db/entity (:db/id block))))) block)
                     sibling? (if (ldb/page? block) false sibling)]
                 (p/let [result (editor-handler/insert-block-tree-after-target
                                 (:db/id block) sibling? blocks' (get block :block/format :markdown) keep-uuid?)
                         blocks (:blocks result)]
                   (let [blocks' (map (fn [b] (db/entity [:block/uuid (:block/uuid b)])) blocks)]
                     (-> blocks'
                         sdk-utils/normalize-keyword-for-json
                         bean/->js))))))))))))

(def ^:export remove_block
  (fn [block-uuid ^js _opts]
    (p/let [repo            (state/get-current-repo)
            _ (<get-block block-uuid {:children? false})]
      (editor-handler/delete-block-aux!
       {:block/uuid (sdk-utils/uuid-or-throw-error block-uuid) :repo repo}))))

(def ^:export update_block
  (fn [block-uuid content ^js opts]
    (this-as
     this
     (p/let [repo (state/get-current-repo)
             db-based? (db-graph?)
             block (<get-block block-uuid {:children? false})
             opts' (bean/->clj opts)]
       (when block
         (if db-based?
           (db-api/update-block this block content opts')
           (editor-handler/save-block! repo
                                       (sdk-utils/uuid-or-throw-error block-uuid) content
                                       (if db-based? (dissoc opts' :properties) opts'))))))))

(def ^:export move_block
  (fn [src-block-uuid target-block-uuid ^js opts]
    (p/let [_ (<get-block src-block-uuid {:children? false})
            _ (<get-block target-block-uuid {:children? false})]
      (let [{:keys [before children]} (bean/->clj opts)
            move-to      (cond
                           (boolean before)
                           :top

                           (boolean children)
                           :nested

                           :else
                           nil)
            src-block    (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error src-block-uuid))
            target-block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error target-block-uuid))]
        (editor-dnd-handler/move-blocks nil [src-block] target-block nil move-to)))))

(def ^:export get_block
  (fn [id ^js opts]
    (p/let [_ (db-async/<get-block (state/get-current-repo) id {:children? true
                                                                :include-collapsed-children? true})]
      (api-block/get_block id (or opts #js {:includePage true})))))

(def ^:export get_current_block
  (fn [^js opts]
    (let [block (state/get-edit-block)
          block (or block
                    (some-> (or (first (state/get-selection-blocks))
                                (state/get-editor-block-container))
                            (.getAttribute "blockid")
                            (db-model/get-block-by-uuid)))]
      (get_block (:block/uuid block) opts))))

(def ^:export get_previous_sibling_block
  (fn [block-uuid ^js opts]
    (p/let [id (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block id)
            ;; Load all children blocks
            _ (api-block/<sync-children-blocks! block)]
      (when block
        (when-let [sibling (ldb/get-left-sibling (db/entity (:db/id block)))]
          (get_block (:block/uuid sibling) opts))))))

(def ^:export get_next_sibling_block
  (fn [block-uuid ^js opts]
    (p/let [id (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block id)
            ;; Load all children blocks
            _ (api-block/<sync-children-blocks! block)]
      (when block
        (p/let [sibling (ldb/get-right-sibling (db/entity (:db/id block)))]
          (get_block (:block/uuid sibling) opts))))))

(def ^:export set_block_collapsed
  (fn [block-uuid ^js opts]
    (p/let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block block-uuid {:children? false})]
      (when block
        (let [opts (bean/->clj opts)
              opts (if (or (string? opts) (boolean? opts)) {:flag opts} opts)
              {:keys [flag]} opts
              flag (if (= "toggle" flag)
                     (not (util/collapsed? block))
                     (boolean flag))]
          (if flag
            (editor-handler/collapse-block! block-uuid)
            (editor-handler/expand-block! block-uuid))
          nil)))))

(def ^:export get_current_page_blocks_tree
  (fn []
    (when-let [page (state/get-current-page)]
      (let [page-id (:db/id (ldb/get-page (db/get-db) page))
            blocks (db-model/get-page-blocks-no-cache page-id)
            blocks (outliner-tree/blocks->vec-tree blocks page-id)
            ;; clean key
            blocks (sdk-utils/normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

(def ^:export get_page_blocks_tree
  (fn [id-or-page-name]
    (p/let [_ (<ensure-page-loaded id-or-page-name)]
      (when-let [page-id (:db/id (db-model/get-page id-or-page-name))]
        (let [blocks (db-model/get-page-blocks-no-cache page-id)
              blocks (outliner-tree/blocks->vec-tree blocks page-id)
              blocks (sdk-utils/normalize-keyword-for-json blocks)]
          (bean/->js blocks))))))

(defn ^:export get_page_linked_references
  [page-name-or-uuid]
  (p/let [repo (state/get-current-repo)
          block (<get-block page-name-or-uuid {:children? false})]
    (when-let [id (:db/id block)]
      (p/let [result (db-async/<get-block-refs repo id)
              ref-blocks (db-utils/group-by-page result)]
        (bean/->js (sdk-utils/normalize-keyword-for-json ref-blocks))))))

(defn ^:export prepend_block_in_page
  [uuid-or-page-name content ^js opts]
  (p/let [uuid-or-page-name (or
                             uuid-or-page-name
                             (state/get-current-page)
                             (date/today))
          block           (<get-block uuid-or-page-name)
          new-page        (when (and (not block) (not (util/uuid-string? uuid-or-page-name))) ; page not exists
                            (page-handler/<create! uuid-or-page-name
                                                   {:redirect?           false
                                                    :format              (state/get-preferred-format)}))]
    (let [block (or block new-page)
          opts (bean/->clj opts)
          opts' (assoc opts :before false :sibling false :start true)]
      (insert_block (str (:block/uuid block)) content (bean/->js opts')))))

(defn ^:export append_block_in_page
  [uuid-or-page-name content ^js opts]
  (let [uuid-or-page-name (or
                           uuid-or-page-name
                           (state/get-current-page)
                           (date/today))]
    (p/let [_ (<ensure-page-loaded uuid-or-page-name)
            page? (not (util/uuid-string? uuid-or-page-name))
            page (db-model/get-page uuid-or-page-name)
            page-not-exist? (and page? (nil? page))
            new-page (when page-not-exist?
                       (page-handler/<create! uuid-or-page-name
                                              {:redirect? false
                                               :format (state/get-preferred-format)}))
            block (or page new-page)]
      (let [children (:block/_parent block)
            [target sibling?] (if (seq children)
                                [(last (ldb/sort-by-order children)) true]
                                [block false])
            target-id (str (:block/uuid target))
            opts (-> (bean/->clj opts)
                     (assoc :sibling sibling?))]
        (insert_block target-id content opts)))))

;; plugins
(defn ^:export validate_external_plugins [urls]
  (ipc/ipc :validateUserExternalPlugins urls))

(def ^:export __install_plugin
  (fn [^js manifest]
    (when-let [{:keys [repo id] :as manifest} (bean/->clj manifest)]
      (if-not (and repo id)
        (throw (js/Error. "[required] :repo :id"))
        (plugin-common-handler/install-marketplace-plugin! manifest)))))

;; db
(defn ^:export q
  [query-string]
  (when-let [repo (state/get-current-repo)]
    (p/let [result (query-dsl/query repo query-string
                                    {:disable-reactive? true
                                     :return-promise? true})]
      (bean/->js (sdk-utils/normalize-keyword-for-json (flatten result))))))

(defn ^:export datascript_query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (db/get-db repo)]
      (p/let [query           (cljs.reader/read-string query)
              resolved-inputs (map #(cond
                                      (string? %)
                                      (some->> % (cljs.reader/read-string) (query-react/resolve-input db))

                                      (fn? %)
                                      (fn [& args]
                                        (.apply % nil (clj->js (mapv bean/->js args))))

                                      :else %)
                                   inputs)
              result          (apply db-async/<q repo {:transact-db? false}
                                     (cons query resolved-inputs))]
        (bean/->js (sdk-utils/normalize-keyword-for-json result false))))))

(defn ^:export custom_query
  [query-string]
  (p/let [result (let [query (cljs.reader/read-string query-string)]
                   (query-custom/custom-query {:query query
                                               :disable-reactive? true
                                               :return-promise? true}))]
    (bean/->js (sdk-utils/normalize-keyword-for-json (flatten result)))))

(defn ^:export download_graph_db
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-sqlite-db! repo)))

(defn ^:export download_graph_pages
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-zip! repo)))

(defn ^:export exec_git_command
  [^js args]
  (when-let [args (and args (seq (bean/->clj args)))]
    (shell/run-git-command! args)))

;; ui
(def ^:export show_msg sdk-ui/-show_msg)
(def ^:export query_element_rect sdk-ui/query_element_rect)
(def ^:export query_element_by_id sdk-ui/query_element_by_id)

;; assets
(def ^:export make_asset_url sdk-assets/make_url)

;; experiments
(defn ^:export exper_load_scripts
  [pid & scripts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (some-> (for [s scripts
                  :let [upt-status #(state/upt-plugin-resource pid :scripts s :status %)
                        init? (contains? #{:error nil} (:status (state/get-plugin-resource pid :scripts s)))]]
              (when init?
                (plugin-handler/register-plugin-resources pid :scripts {:key s :src s})
                (upt-status :pending)
                (-> (loader/load s nil {:attributes {:data-ref (name pid)}})
                    (p/then (fn [] (upt-status :done)))
                    (p/catch (fn [] (upt-status :error))))))
            (vec)
            (p/all))))

;; http request
(defonce *request-k (volatile! 0))

(defn ^:export exper_request
  [pid ^js options]
  (when-let [^js pl (plugin-handler/get-plugin-inst pid)]
    (let [req-id (vreset! *request-k (inc @*request-k))
          req-cb #(plugin-handler/request-callback pl req-id %)]
      (-> (ipc/ipc :httpRequest req-id options)
          (p/then #(req-cb %))
          (p/catch #(req-cb %)))
      req-id)))

(defn ^:export http_request_abort
  [req-id]
  (ipc/ipc :httpRequestAbort req-id))

;; search
(defn ^:export search
  [q' & [opts]]
  (-> (search-handler/search (state/get-current-repo) q' (if opts (js->clj opts :keywordize-keys true) {}))
      (p/then #(bean/->js %))))

;; helpers
(defn ^:export set_focused_settings
  [pid]
  (when-let [plugin (state/get-plugin-by-id pid)]
    (state/set-state! :plugin/focused-settings pid)
    (state/pub-event! [:go/plugins-settings pid false (or (:name plugin) (:title plugin))])))

(defn ^:export force_save_graph
  []
  true)

;; block properties
(defn ^:export upsert_block_property
  [block-uuid key ^js value ^js options]
  (this-as
   this
   (p/let [key' (api-block/sanitize-user-property-name key)
           opts (bean/->clj options)
           block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
           repo (state/get-current-repo)
           block (<get-block block-uuid {:children? false})
           db-based? (db-graph?)
           value (bean/->clj value)]
     (when block
       (if db-based?
         (db-api/upsert-block-property this block key' value (:schema opts))
         (property-handler/set-block-property! repo block-uuid key' value))))))

(defn ^:export remove_block_property
  [block-uuid key]
  (this-as this
           (p/let [key (api-block/sanitize-user-property-name key)
                   block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
                   _block (<get-block block-uuid {:children? false})
                   db-based? (db-graph?)
                   key-ns? (namespace (keyword key))
                   key (if (and db-based? (not key-ns?))
                         (api-block/get-db-ident-from-property-name
                          key (api-block/resolve-property-prefix-for-db this))
                         key)]
             (property-handler/remove-block-property!
              (state/get-current-repo)
              block-uuid key))))

(defn ^:export get_block_property
  [block-uuid key]
  (this-as this
           (p/let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
                   _block (<get-block block-uuid {:children? false})]
             (when-let [properties (some-> block-uuid (db-model/get-block-by-uuid) (:block/properties))]
               (when (seq properties)
                 (let [property-name (api-block/sanitize-user-property-name key)
                       ident (api-block/get-db-ident-from-property-name
                              property-name (api-block/resolve-property-prefix-for-db this))
                       property-value (or (get properties property-name)
                                          (get properties (keyword property-name))
                                          (get properties ident))
                       property-value (if-let [property-id (:db/id property-value)]
                                        (db/pull property-id) property-value)
                       property-value (cond-> property-value
                                        (map? property-value)
                                        (assoc
                                         :value (or (:logseq.property/value property-value)
                                                    (:block/title property-value))
                                         :ident ident))
                       parsed-value (api-block/parse-property-json-value-if-need ident property-value)]
                   (or parsed-value
                       (bean/->js (sdk-utils/normalize-keyword-for-json property-value)))))))))

(def ^:export get_block_properties
  (fn [block-uuid]
    (p/let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block block-uuid {:children? false})]
      (when block
        (let [properties (if (db-graph?)
                           (api-block/into-readable-db-properties (:block/properties block))
                           (:block/properties block))]
          (db-api/result->js properties))))))

(defn ^:export get_page_properties
  [id-or-page-name]
  (p/let [page (<get-block id-or-page-name {:children? false})]
    (when-let [id (:block/uuid page)]
      (get_block_properties id))))

;; db based graph APIs
;; properties (db only)
(defn -get-property
  [^js plugin k]
  (when-let [k' (and (string? k) (api-block/sanitize-user-property-name k))]
    (let [property-ident (api-block/get-db-ident-from-property-name k' plugin)]
      (db-utils/pull property-ident))))

(defn ^:export get_property
  [k]
  (this-as this
           (p/let [prop (-get-property this k)]
             (some-> prop
                     (assoc :type (:logseq.property/type prop))
                     (sdk-utils/normalize-keyword-for-json)
                     (bean/->js)))))

(defn ^:export upsert_property
  "schema:
    {:type :default | :number | :date | :datetime | :checkbox | :url | :node | :json | :string
     :cardinality :many | :one
     :hide? true
     :view-context :page
     :public? false}
  "
  [k ^js schema ^js opts]
  (this-as this
           (when-not (string/blank? k)
             (p/let [opts (or (some-> opts bean/->clj) {})
                     property-ident (api-block/get-db-ident-from-property-name k this)
                     _ (api-block/ensure-property-upsert-control this property-ident k)
                     schema (or (some-> schema (bean/->clj)
                                        (update-keys #(if (contains? #{:hide :public} %)
                                                        (keyword (str (name %) "?")) %))) {})
                     schema (cond-> schema
                              (string? (:cardinality schema))
                              (-> (assoc :db/cardinality (keyword (:cardinality schema)))
                                  (dissoc :cardinality))

                              (string? (:type schema))
                              (-> (assoc :logseq.property/type (keyword (:type schema)))
                                  (dissoc :type)))
                     p (db-property-handler/upsert-property! property-ident schema
                                                             (assoc opts :property-name name))
                     p (db-utils/pull (:db/id p))]
               (bean/->js (sdk-utils/normalize-keyword-for-json p))))))

(defn ^:export remove_property
  [k]
  (this-as
   this
   (p/let [property (-get-property this k)]
     (db-api/remove-property property))))

(def ^:export get_all_tags db-api/get-all-tags)
(def ^:export get-all-properties db-api/get-all-properties)
(def ^:export get-tag-objects db-api/get-tag-objects)

;; file based graph APIs
(def ^:export get_current_graph_templates file-api/get_current_graph_templates)
(def ^:export get_template file-api/get_template)
(def ^:export insert_template file-api/insert_template)
(def ^:export exist_template file-api/exist_template)
(def ^:export create_template file-api/create_template)
(def ^:export remove_template file-api/remove_template)
(def ^:export get_pages_from_namespace file-api/get_pages_from_namespace)
(def ^:export get_pages_tree_from_namespace file-api/get_pages_tree_from_namespace)
(def ^:export set_blocks_id file-api/set_blocks_id)
