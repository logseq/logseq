(ns ^:no-doc logseq.api
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [logseq.sdk.core]
            [logseq.sdk.utils :as sdk-utils]
            [logseq.sdk.ui :as sdk-ui]
            [logseq.sdk.git :as sdk-git]
            [logseq.sdk.assets :as sdk-assets]
            [clojure.string :as string]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.commands :as commands]
            [frontend.components.plugins :as plugins]
            [frontend.config :as config]
            [frontend.handler.config :as config-handler]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.utils :as db-utils]
            [frontend.db.query-react :as query-react]
            [frontend.fs :as fs]
            [frontend.handler.dnd :as editor-dnd-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.modules.outliner.core :as outliner]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.modules.shortcut.core :as st]
            [electron.listener :as el]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.loader :as loader]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [frontend.version :as fv]
            [frontend.handler.shell :as shell]
            [frontend.modules.layout.core]
            [frontend.handler.code :as code-handler]
            [frontend.handler.search :as search-handler]))

;; Alert: this namespace shouldn't invoke any reactive queries

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
  (bean/->js
    (sdk-utils/normalize-keyword-for-json
      {:version fv/version})))

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
    (some->> (:favorites (state/get-config))
             (remove string/blank?)
             (filter string?)
             (bean/->js))))

(def ^:export get_current_graph_recent
  (fn []
    (some->> (db/get-key-value :recent/pages)
             (remove string/blank?)
             (filter string?)
             (bean/->js))))

(def ^:export get_current_graph_templates
  (fn []
    (when (state/get-current-repo)
      (some-> (db-model/get-all-templates)
              (update-vals db/pull)
              (sdk-utils/normalize-keyword-for-json)
              (bean/->js)))))

(def ^:export get_current_graph
  (fn []
    (when-let [repo (state/get-current-repo)]
      (when-not (= config/local-repo repo)
        (bean/->js {:url  repo
                    :name (util/node-path.basename repo)
                    :path (config/get-repo-dir repo)})))))

(def ^:export show_themes
  (fn []
    (plugins/open-select-theme!)))

(def ^:export set_theme_mode
  (fn [mode]
    (state/set-theme-mode! mode)))

(def ^:export load_plugin_config
  (fn [path]
    (fs/read-file nil (util/node-path.join path "package.json"))))

(def ^:export load_plugin_readme
  (fn [path]
    (fs/read-file nil (util/node-path.join path "readme.md"))))

(def ^:export save_plugin_config
  (fn [path ^js data]
    (let [repo ""

          path (util/node-path.join path "package.json")]
      (fs/write-file! repo nil path (js/JSON.stringify data nil 2) {:skip-compare? true}))))

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
                           (throw "write file denied"))
          user-path-root (util/node-path.dirname user-path)
          exist?         (fs/file-exists? user-path-root "")
          _              (when-not exist? (fs/mkdir-recur! user-path-root))
          _              (fs/write-file! repo nil user-path content {:skip-compare? true})]
    user-path))

(defn ^:private write_dotdir_file
  [file content sub-root]
  (some-> (plugin-handler/get-ls-dotdir-root)
          (p/then #(write_rootdir_file file content sub-root %))))

(defn ^:private write_assetsdir_file
  [file content sub-root]
  (if-let [assets-dir (config/get-current-repo-assets-root)]
    (write_rootdir_file file content sub-root assets-dir)
    false))

(defn ^:private read_rootdir_file
  [file sub-root root-dir]
  (p/let [path      (util/node-path.join root-dir sub-root)
          user-path (util/node-path.join path file)
          sub-dir?  (string/starts-with? user-path path)
          _         (when-not sub-dir? (log/info :debug user-path) (throw "read file denied"))
          exist?    (fs/file-exists? "" user-path)
          _         (when-not exist? (log/info :debug user-path) (throw "file not existed"))
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
          _         (when-not sub-dir? (log/info :debug user-path) (throw "access file denied"))
          exist?    (fs/file-exists? "" user-path)
          _         (when-not exist? (log/info :debug user-path) (throw "file not existed"))
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
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "preferences.json")
            _    (fs/create-if-not-exists repo nil path)
            json (fs/read-file nil path)
            json (if (string/blank? json) "{}" json)]
      (js/JSON.parse json))))

(def ^:export save_user_preferences
  (fn [^js data]
    (when data
      (p/let [repo ""
              path (plugin-handler/get-ls-dotdir-root)
              path (util/node-path.join path "preferences.json")]
        (fs/write-file! repo nil path (js/JSON.stringify data nil 2) {:skip-compare? true})))))

(def ^:export load_plugin_user_settings
  ;; results [path data]
  (plugin-handler/make-fn-to-load-dotdir-json "settings" "{}"))

(def ^:export save_plugin_user_settings
  (fn [key ^js data]
    ((plugin-handler/make-fn-to-save-dotdir-json "settings")
     key (js/JSON.stringify data nil 2))))

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
            cmd         (assoc cmd :key (string/replace (:key cmd) ":" "-"))
            key         (:key cmd)
            keybinding  (:keybinding cmd)
            palette-cmd (and palette? (plugin-handler/simple-cmd->palette-cmd pid cmd action))
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
                [handler-id id shortcut-map] (update shortcut-args 2 assoc :fn dispatch-cmd)]
            (js/console.debug :shortcut/register-shortcut [handler-id id shortcut-map])
            (st/register-shortcut! handler-id id shortcut-map)))))))

(defn ^:export unregister_plugin_simple_command
  [pid]
  ;; remove simple commands
  (plugin-handler/unregister-plugin-simple-command pid)

  ;; remove palette commands
  (let [palette-matched (->> (palette-handler/get-commands)
                             (filter #(string/includes? (str (:id %)) (str "plugin." pid))))]
    (when (seq palette-matched)
      (doseq [cmd palette-matched]
        (palette-handler/unregister (:id cmd))
        ;; remove keybinding commands
        (when (seq (:shortcut cmd))
          (js/console.debug :shortcut/unregister-shortcut cmd)
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
        (apply action args)))))

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
    (rfe/push-state
      (keyword k)
      (bean/->clj params)
      (bean/->clj query))))

(def ^:export replace_state
  (fn [^js k ^js params ^js query]
    (rfe/replace-state
      (keyword k)
      (bean/->clj params)
      (bean/->clj query))))

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
    (editor-handler/escape-editing select?)
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
        (.focus input)))))

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
                        (map (fn [^js el] (some-> (.getAttribute el "blockid")
                                                  (db-model/query-block-by-uuid)))))]
        (bean/->js (sdk-utils/normalize-keyword-for-json blocks))))))

(def ^:export get_current_page
  (fn []
    (when-let [page (state/get-current-page)]
      (when-let [page (db-model/get-page page)]
        (bean/->js (sdk-utils/normalize-keyword-for-json (db-utils/pull (:db/id page))))))))

(def ^:export get_page
  (fn [id-or-page-name]
    (when-let [page (cond
                      (number? id-or-page-name) (db-utils/pull id-or-page-name)
                      (string? id-or-page-name) (db-model/get-page id-or-page-name))]
      (when-not (contains? page :block/left)
        (bean/->js (sdk-utils/normalize-keyword-for-json (db-utils/pull (:db/id page))))))))

(def ^:export get_all_pages
  (fn [repo]
    (let [pages (page-handler/get-all-pages repo)]
      (bean/->js (sdk-utils/normalize-keyword-for-json pages)))))

(def ^:export create_page
  (fn [name ^js properties ^js opts]
    (some-> (if-let [page (db-model/get-page name)]
              page
              (let [properties (bean/->clj properties)
                    {:keys [redirect createFirstBlock format journal]} (bean/->clj opts)
                    name       (page-handler/create!
                                 name
                                 {:redirect?           (if (boolean? redirect) redirect true)
                                  :journal?            journal
                                  :create-first-block? (if (boolean? createFirstBlock) createFirstBlock true)
                                  :format              format
                                  :properties          properties})]
                (db-model/get-page name)))
            (:db/id)
            (db-utils/pull)
            (sdk-utils/normalize-keyword-for-json)
            (bean/->js))))

(def ^:export delete_page
  (fn [name]
    (p/create (fn [ok] (page-handler/delete! name ok)))))

(def ^:export rename_page
  page-handler/rename!)

(defn ^:export open_in_right_sidebar
  [block-uuid]
  (editor-handler/open-block-in-sidebar! (sdk-utils/uuid-or-throw-error block-uuid)))

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
          (editor-handler/edit-block! block pos block-uuid))))))

(def ^:export insert_block
  (fn [block-uuid-or-page-name content ^js opts]
    (when (string/blank? block-uuid-or-page-name)
      (throw (js/Error. "Page title or block UUID shouldn't be empty.")))
    (let [{:keys [before sibling focus customUUID properties]} (bean/->clj opts)
          [page-name block-uuid] (if (util/uuid-string? block-uuid-or-page-name)
                                   [nil (uuid block-uuid-or-page-name)]
                                   [block-uuid-or-page-name nil])
          page-name              (when page-name (util/page-name-sanity-lc page-name))
          _                      (when (and page-name (not (db/entity [:block/name page-name])))
                                   (page-handler/create! block-uuid-or-page-name {:create-first-block? false}))
          custom-uuid            (or customUUID (:id properties))
          custom-uuid            (when custom-uuid (sdk-utils/uuid-or-throw-error custom-uuid))
          edit-block?            (if (nil? focus) true focus)
          _                      (when (and custom-uuid (db-model/query-block-by-uuid custom-uuid))
                                   (throw (js/Error.
                                            (util/format "Custom block UUID already exists (%s)." custom-uuid))))
          block-uuid'            (if (and (not sibling) before block-uuid)
                                   (let [block       (db/entity [:block/uuid block-uuid])
                                         first-child (db-model/get-by-parent-&-left (db/get-db)
                                                                                    (:db/id block)
                                                                                    (:db/id block))]
                                     (if first-child
                                       (:block/uuid first-child)
                                       block-uuid))
                                   block-uuid)
          insert-at-first-child? (not= block-uuid' block-uuid)
          [sibling? before?] (if insert-at-first-child?
                               [true true]
                               [sibling before])
          before?                (if (and (false? sibling?) before? (not insert-at-first-child?))
                                   false
                                   before?)
          new-block              (editor-handler/api-insert-new-block!
                                   content
                                   {:block-uuid  block-uuid'
                                    :sibling?    sibling?
                                    :before?     before?
                                    :edit-block? edit-block?
                                    :page        page-name
                                    :custom-uuid custom-uuid
                                    :properties  (merge properties
                                                        (when custom-uuid {:id custom-uuid}))})]
      (bean/->js (sdk-utils/normalize-keyword-for-json new-block)))))

(def ^:export insert_batch_block
  (fn [block-uuid ^js batch-blocks ^js opts]
    (when-let [block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (when-let [bb (bean/->clj batch-blocks)]
        (let [bb         (if-not (vector? bb) (vector bb) bb)
              {:keys [sibling keepUUID]} (bean/->clj opts)
              keep-uuid? (or keepUUID false)
              _          (when keep-uuid? (doseq
                                            [block (outliner/tree-vec-flatten bb :children)]
                                            (let [uuid (:id (:properties block))]
                                              (when (and uuid (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error uuid)))
                                                (throw (js/Error.
                                                         (util/format "Custom block UUID already exists (%s)." uuid)))))))
              _          (editor-handler/insert-block-tree-after-target
                           (:db/id block) sibling bb (:block/format block) keep-uuid?)]
          nil)))))

(def ^:export remove_block
  (fn [block-uuid ^js _opts]
    (let [includeChildren true
          repo            (state/get-current-repo)]
      (editor-handler/delete-block-aux!
        {:block/uuid (sdk-utils/uuid-or-throw-error block-uuid) :repo repo} includeChildren)
      nil)))

(def ^:export update_block
  (fn [block-uuid content ^js _opts]
    (let [repo       (state/get-current-repo)
          edit-input (state/get-edit-input-id)
          editing?   (and edit-input (string/ends-with? edit-input (str block-uuid)))]
      (if editing?
        (state/set-edit-content! edit-input content)
        (editor-handler/save-block! repo (sdk-utils/uuid-or-throw-error block-uuid) content))
      nil)))

(def ^:export move_block
  (fn [src-block-uuid target-block-uuid ^js opts]
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
      (editor-dnd-handler/move-blocks nil [src-block] target-block move-to) nil)))

(def ^:export get_block
  (fn [id-or-uuid ^js opts]
    (when-let [block (cond
                       (number? id-or-uuid) (db-utils/pull id-or-uuid)
                       (string? id-or-uuid) (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error id-or-uuid)))]
      (when-not (contains? block :block/name)
        (when-let [uuid (:block/uuid block)]
          (let [{:keys [includeChildren]} (bean/->clj opts)
                repo  (state/get-current-repo)
                block (if includeChildren
                        ;; nested children results
                        (first (outliner-tree/blocks->vec-tree
                                 (db-model/get-block-and-children repo uuid) uuid))
                        ;; attached shallow children
                        (assoc block :block/children
                                     (map #(list :uuid (get-in % [:data :block/uuid]))
                                          (db/get-block-immediate-children repo uuid))))]
            (bean/->js (sdk-utils/normalize-keyword-for-json block))))))))

(def ^:export get_current_block
  (fn [^js opts]
    (let [block (state/get-edit-block)
          block (or block
                    (some-> (or (first (state/get-selection-blocks))
                                (gdom/getElement (state/get-editing-block-dom-id)))
                            (.getAttribute "blockid")
                            (db-model/get-block-by-uuid)))]
      (get_block (:db/id block) opts))))

(def ^:export get_previous_sibling_block
  (fn [block-uuid]
    (when-let [block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (let [{:block/keys [parent left]} block
            block (when-not (= parent left) (db-utils/pull (:db/id left)))]
        (and block (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))

(def ^:export get_next_sibling_block
  (fn [block-uuid]
    (when-let [block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (when-let [right-siblings (outliner/get-right-siblings (outliner/->Block block))]
        (bean/->js (sdk-utils/normalize-keyword-for-json (:data (first right-siblings))))))))

(def ^:export set_block_collapsed
  (fn [block-uuid ^js opts]
    (let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)]
      (when-let [block (db-model/get-block-by-uuid block-uuid)]
        (let [opts (bean/->clj opts)
              opts (if (or (string? opts) (boolean? opts)) {:flag opts} opts)
              {:keys [flag]} opts
              flag (if (= "toggle" flag)
                     (not (util/collapsed? block))
                     (boolean flag))]
          (if flag (editor-handler/collapse-block! block-uuid)
                   (editor-handler/expand-block! block-uuid))
          nil)))))

(def ^:export upsert_block_property
  (fn [block-uuid key value]
    (editor-handler/set-block-property! (sdk-utils/uuid-or-throw-error block-uuid) key value)))

(def ^:export remove_block_property
  (fn [block-uuid key]
    (editor-handler/remove-block-property! (sdk-utils/uuid-or-throw-error block-uuid) key)))

(def ^:export get_block_property
  (fn [block-uuid key]
    (when-let [block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (get (:block/properties block) (keyword key)))))

(def ^:export get_block_properties
  (fn [block-uuid]
    (when-let [block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (bean/->js (sdk-utils/normalize-keyword-for-json (:block/properties block))))))

(def ^:export get_current_page_blocks_tree
  (fn []
    (when-let [page (state/get-current-page)]
      (let [blocks (db-model/get-page-blocks-no-cache page)
            blocks (outliner-tree/blocks->vec-tree blocks page)
            ;; clean key
            blocks (sdk-utils/normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

(def ^:export get_page_blocks_tree
  (fn [id-or-page-name]
    (when-let [page-name (:block/name (db-model/get-page id-or-page-name))]
      (let [blocks (db-model/get-page-blocks-no-cache page-name)
            blocks (outliner-tree/blocks->vec-tree blocks page-name)
            blocks (sdk-utils/normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

(defn ^:export get_page_linked_references
  [page-name-or-uuid]
  (when-let [page (and page-name-or-uuid (db-model/get-page page-name-or-uuid))]
    (let [page-name  (:block/name page)
          ref-blocks (if page-name
                       (db-model/get-page-referenced-blocks-full page-name)
                       (db-model/get-block-referenced-blocks (:block/uuid page)))
          ref-blocks (and (seq ref-blocks) (into [] ref-blocks))]
      (bean/->js (sdk-utils/normalize-keyword-for-json ref-blocks)))))

(defn ^:export get_pages_from_namespace
  [ns]
  (when-let [repo (and ns (state/get-current-repo))]
    (when-let [pages (db-model/get-namespace-pages repo ns)]
      (bean/->js (sdk-utils/normalize-keyword-for-json pages)))))

(defn ^:export get_pages_tree_from_namespace
  [ns]
  (when-let [repo (and ns (state/get-current-repo))]
    (when-let [pages (db-model/get-namespace-hierarchy repo ns)]
      (bean/->js (sdk-utils/normalize-keyword-for-json pages)))))

(defn first-child-of-block
  [block]
  (when-let [children (:block/_parent block)]
    (first (db-model/sort-by-left children block))))

(defn second-child-of-block
  [block]
  (when-let [children (:block/_parent block)]
    (second (db-model/sort-by-left children block))))

(defn last-child-of-block
  [block]
  (when-let [children (:block/_parent block)]
    (last (db-model/sort-by-left children block))))

(defn ^:export prepend_block_in_page
  [uuid-or-page-name content ^js opts]
  (let [page?           (not (util/uuid-string? uuid-or-page-name))
        page-not-exist? (and page? (nil? (db-model/get-page uuid-or-page-name)))
        _               (and page-not-exist? (page-handler/create! uuid-or-page-name
                                                                   {:redirect?           false
                                                                    :create-first-block? true
                                                                    :format              (state/get-preferred-format)}))]
    (when-let [block (db-model/get-page uuid-or-page-name)]
      (let [block'   (if page? (second-child-of-block block) (first-child-of-block block))
            sibling? (and page? (not (nil? block')))
            opts     (bean/->clj opts)
            opts     (merge opts {:sibling sibling? :before sibling?})
            src      (if sibling? (str (:block/uuid block')) uuid-or-page-name)]
        (insert_block src content (bean/->js opts))))))

(defn ^:export append_block_in_page
  [uuid-or-page-name content ^js opts]
  (let [page?           (not (util/uuid-string? uuid-or-page-name))
        page-not-exist? (and page? (nil? (db-model/get-page uuid-or-page-name)))
        _               (and page-not-exist? (page-handler/create! uuid-or-page-name
                                                                   {:redirect?           false
                                                                    :create-first-block? true
                                                                    :format              (state/get-preferred-format)}))]
    (when-let [block (db-model/get-page uuid-or-page-name)]
      (let [block'   (last-child-of-block block)
            sibling? (not (nil? block'))
            opts     (bean/->clj opts)
            opts     (merge opts {:sibling sibling?}
                            (when sibling? {:before false}))
            src      (if sibling? (str (:block/uuid block')) uuid-or-page-name)]
        (insert_block src content (bean/->js opts))))))

;; plugins
(defn ^:export validate_external_plugins [urls]
  (ipc/ipc :validateUserExternalPlugins urls))

(def ^:export __install_plugin
  (fn [^js manifest]
    (when-let [{:keys [repo id] :as mft} (bean/->clj manifest)]
      (if-not (and repo id)
        (throw (js/Error. "[required] :repo :id"))
        (plugin-common-handler/install-marketplace-plugin mft)))))

;; db
(defn ^:export q
  [query-string]
  (when-let [repo (state/get-current-repo)]
    (when-let [result (query-dsl/query repo query-string
                        {:disable-reactive? true})]
      (bean/->js (sdk-utils/normalize-keyword-for-json (flatten @result))))))

(defn ^:export datascript_query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (db/get-db repo)]
      (let [query           (cljs.reader/read-string query)
            resolved-inputs (map #(cond
                                    (string? %)
                                    (some->> % (cljs.reader/read-string) (query-react/resolve-input db))

                                    (fn? %)
                                    (fn [& args]
                                      (.apply % nil (clj->js (mapv bean/->js args))))

                                    :else %)
                                 inputs)
            result          (apply d/q query db resolved-inputs)]
        (bean/->js (sdk-utils/normalize-keyword-for-json result false))))))

(defn ^:export custom_query
  [query-string]
  (let [result (let [query (cljs.reader/read-string query-string)]
                 (db/custom-query {:query query
                                   :disable-reactive? true}))]
    (bean/->js (sdk-utils/normalize-keyword-for-json (flatten @result)))))

(defn ^:export download_graph_db
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [db (db/get-db repo)]
      (let [db-str   (if db (db/db->string db) "")
            data-str (str "data:text/edn;charset=utf-8," (js/encodeURIComponent db-str))]
        (when-let [anchor (gdom/getElement "download")]
          (.setAttribute anchor "href" data-str)
          (.setAttribute anchor "download" (str (string/replace repo "/" " ") ".transit"))
          (.click anchor))))))

(defn ^:export download_graph_pages
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-zip! repo)))

(defn ^:export exec_git_command
  [^js args]
  (when-let [args (and args (seq (bean/->clj args)))]
    (shell/run-git-command! args)))

;; git
(def ^:export git_exec_command sdk-git/exec_command)
(def ^:export git_load_ignore_file sdk-git/load_ignore_file)
(def ^:export git_save_ignore_file sdk-git/save_ignore_file)

;; ui
(def ^:export show_msg sdk-ui/-show_msg)
(def ^:export ui_show_msg sdk-ui/show_msg)
(def ^:export ui_close_msg sdk-ui/close_msg)

;; assets
(def ^:export assets_list_files_of_current_graph sdk-assets/list_files_of_current_graph)
(def ^:export assets_make_url sdk-assets/make_url)
(def ^:export make_asset_url sdk-assets/make_url)

;; experiments
(defn ^:export exper_load_scripts
  [pid & scripts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (doseq [s scripts
            :let [upt-status #(state/upt-plugin-resource pid :scripts s :status %)
                  init?      (plugin-handler/register-plugin-resources pid :scripts {:key s :src s})]]
      (when init?
        (p/catch
          (p/then
            (do
              (upt-status :pending)
              (loader/load s nil {:attributes {:data-ref (name pid)}}))
            #(upt-status :done))
          #(upt-status :error))))))

(defn ^:export exper_register_fenced_code_renderer
  [pid type ^js opts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (plugin-handler/register-fenced-code-renderer
      (keyword pid) type (reduce #(assoc %1 %2 (aget opts (name %2))) {}
                                 [:edit :before :subs :render]))))

(defn ^:export exper_register_extensions_enhancer
  [pid type enhancer]
  (when-let [^js _pl (and (fn? enhancer) (plugin-handler/get-plugin-inst pid))]
    (plugin-handler/register-extensions-enhancer
      (keyword pid) type {:enhancer enhancer})))

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

;; templates
(defn ^:export get_template
  [name]
  (some-> name
          (db-model/get-template-by-name)
          (sdk-utils/normalize-keyword-for-json)
          (bean/->js)))

(defn ^:export insert_template
  [target-uuid template-name]
  (when-let [target (and (page-handler/template-exists? template-name)
                         (db-model/get-block-by-uuid target-uuid))]
    (editor-handler/insert-template! nil template-name {:target target}) nil))

(defn ^:export exist_template
  [name]
  (page-handler/template-exists? name))

(defn ^:export create_template
  [target-uuid template-name ^js opts]
  (when (and template-name (db-model/get-block-by-uuid target-uuid))
    (let [{:keys [overwrite]} (bean/->clj opts)
          exist? (page-handler/template-exists? template-name)]
      (if (or (not exist?) (true? overwrite))
        (do (when-let [old-target (and exist? (db-model/get-template-by-name template-name))]
              (editor-handler/remove-block-property! (:block/uuid old-target) :template))
            (editor-handler/set-block-property! target-uuid :template template-name))
        (throw (js/Error. "Template already exists!"))))))

(defn ^:export remove_template
  [name]
  (when-let [target (db-model/get-template-by-name name)]
    (editor-handler/remove-block-property! (:block/uuid target) :template)))

;; search
(defn ^:export search
  [q]
  (-> (search-handler/search q)
      (p/then #(bean/->js %))))

;; helpers
(defn ^:export query_element_by_id
  [id]
  (when-let [^js el (gdom/getElement id)]
    (if el (str (.-tagName el) "#" id) false)))

(defn ^:export query_element_rect
  [selector]
  (when-let [^js el (js/document.querySelector selector)]
    (bean/->js (.toJSON (.getBoundingClientRect el)))))

(defn ^:export set_focused_settings
  [pid]
  (when-let [plugin (state/get-plugin-by-id pid)]
    (state/set-state! :plugin/focused-settings pid)
    (state/pub-event! [:go/plugins-settings pid false (or (:name plugin) (:title plugin))])))

(defn ^:export force_save_graph
  []
  (p/let [_ (el/persist-dbs!)]
    true))

(def ^:export set_blocks_id #(editor-handler/set-blocks-id! (map uuid %)))
