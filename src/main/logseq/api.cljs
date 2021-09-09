(ns ^:no-doc logseq.api
  (:require [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.commands :as commands]
            [frontend.components.plugins :as plugins]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.utils :as db-utils]
            [frontend.fs :as fs]
            [frontend.handler.dnd :as editor-dnd-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.modules.outliner.core :as outliner]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [sci.core :as sci]))

;; helpers
(defn- normalize-keyword-for-json
  [input]
  (when input
    (walk/postwalk
      (fn [a]
        (cond
          (keyword? a) (csk/->camelCase (name a))
          (uuid? a) (str a)
          :else a)) input)))

(defn- parse-hiccup-ui
  [input]
  (when (string? input)
    (try
      (sci/eval-string input {:preset :termination-safe})
      (catch js/Error e
        (js/console.error "[parse hiccup error]" e) input))))

;; base
(def ^:export get_user_configs
  (fn []
    (bean/->js
      (normalize-keyword-for-json
        {:preferred-language    (:preferred-language @state/state)
         :preferred-theme-mode  (if (= (:ui/theme @state/state) "light") "white" "dark")
         :preferred-format      (state/get-preferred-format)
         :preferred-workflow    (state/get-preferred-workflow)
         :preferred-todo        (state/get-preferred-todo)
         :preferred-date-format (state/get-date-formatter)
         :current-graph         (state/get-current-repo)
         :me                    (state/get-me)}))))

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
    (state/set-theme! (if (= mode "light") "white" "dark"))))

(def ^:export load_plugin_config
  (fn [path]
    (fs/read-file "" (util/node-path.join path "package.json"))))

(def ^:export load_plugin_readme
  (fn [path]
    (fs/read-file "" (util/node-path.join path "readme.md"))))

(def ^:export save_plugin_config
  (fn [path ^js data]
    (let [repo ""
          path (util/node-path.join path "package.json")]
      (fs/write-file! repo "" path (js/JSON.stringify data nil 2) {:skip-compare? true}))))

(defn ^:private write_dotdir_file
  [file content sub-root]
  (p/let [repo ""
          path (plugin-handler/get-ls-dotdir-root)
          path (util/node-path.join path sub-root)
          exist? (fs/file-exists? path "")
          _ (when-not exist? (fs/mkdir-recur! path))
          user-path (util/node-path.join path file)
          sub-dir? (string/starts-with? user-path path)
          _ (when-not sub-dir? (do (log/info :debug user-path) (throw "write file denied")))
          user-path-root (util/node-path.dirname user-path)
          exist? (fs/file-exists? user-path-root "")
          _ (when-not exist? (fs/mkdir-recur! user-path-root))
          _ (fs/write-file! repo "" user-path content {:skip-compare? true})]
    user-path))

(defn ^:private read_dotdir_file
  [file sub-root]
  (p/let [repo ""
          path (plugin-handler/get-ls-dotdir-root)
          path (util/node-path.join path sub-root)
          user-path (util/node-path.join path file)
          sub-dir? (string/starts-with? user-path path)
          _ (when-not sub-dir? (log/info :debug user-path) (throw "read file denied"))
          exist? (fs/file-exists? "" user-path)
          _ (when-not exist? (log/info :debug user-path) (throw "file not existed"))
          content (fs/read-file "" user-path)]
    content))

(defn ^:private unlink_dotdir_file!
  [file sub-root]
  (p/let [repo ""
          path (plugin-handler/get-ls-dotdir-root)
          path (util/node-path.join path sub-root)
          user-path (util/node-path.join path file)
          sub-dir? (string/starts-with? user-path path)
          _ (when-not sub-dir? (log/info :debug user-path) (throw "access file denied"))
          exist? (fs/file-exists? "" user-path)
          _ (when-not exist? (log/info :debug user-path) (throw "file not existed"))
          _ (fs/unlink! repo user-path {})]))

(def ^:export write_user_tmp_file
  (fn [file content]
    (write_dotdir_file file content "tmp")))

(def ^:export write_plugin_storage_file
  (fn [plugin-id file content]
    (write_dotdir_file
      file content
      (let [plugin-id (util/node-path.basename plugin-id)]
        (util/node-path.join "storages" plugin-id)))))

(def ^:export read_plugin_storage_file
  (fn [plugin-id file]
    (let [plugin-id (util/node-path.basename plugin-id)]
      (read_dotdir_file
        file (util/node-path.join "storages" plugin-id)))))

(def ^:export unlink_plugin_storage_file
  (fn [plugin-id file]
    (let [plugin-id (util/node-path.basename plugin-id)]
      (unlink_dotdir_file!
        file (util/node-path.join "storages" plugin-id)))))

(def ^:export exist_plugin_storage_file
  (fn [plugin-id file]
    (p/let [root (plugin-handler/get-ls-dotdir-root)
            plugin-id (util/node-path.basename plugin-id)
            exist? (fs/file-exists?
                     (util/node-path.join root "storages" plugin-id)
                     file)]
      exist?)))

(def ^:export clear_plugin_storage_files
  (fn [plugin-id]
    (p/let [root (plugin-handler/get-ls-dotdir-root)
            plugin-id (util/node-path.basename plugin-id)]
      (fs/rmdir! (util/node-path.join root "storages" plugin-id)))))

(def ^:export load_user_preferences
  (fn []
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "preferences.json")
            _ (fs/create-if-not-exists repo "" path)
            json (fs/read-file "" path)
            json (if (string/blank? json) "{}" json)]
      (js/JSON.parse json))))

(def ^:export save_user_preferences
  (fn [^js data]
    (when data
      (p/let [repo ""
              path (plugin-handler/get-ls-dotdir-root)
              path (util/node-path.join path "preferences.json")]
        (fs/write-file! repo "" path (js/JSON.stringify data nil 2) {:skip-compare? true})))))

(def ^:export load_plugin_user_settings
  (fn [key]
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            exist? (fs/file-exists? path "settings")
            _ (when-not exist? (fs/mkdir! (util/node-path.join path "settings")))
            path (util/node-path.join path "settings" (str key ".json"))
            _ (fs/create-if-not-exists repo "" path "{}")
            json (fs/read-file "" path)]
      [path (js/JSON.parse json)])))

(def ^:export save_plugin_user_settings
  (fn [key ^js data]
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "settings" (str key ".json"))]
      (fs/write-file! repo "" path (js/JSON.stringify data nil 2) {:skip-compare? true}))))

(def ^:export unlink_plugin_user_settings
  (fn [key]
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "settings" (str key ".json"))]
      (fs/unlink! repo path nil))))

(def ^:export register_plugin_slash_command
  (fn [pid ^js cmd-actions]
    (when-let [[cmd actions] (bean/->clj cmd-actions)]
      (plugin-handler/register-plugin-slash-command
        pid [cmd (mapv #(into [(keyword (first %))]
                              (rest %)) actions)]))))

(def ^:export register_plugin_simple_command
  (fn [pid ^js cmd-action]
    (when-let [[cmd action] (bean/->clj cmd-action)]
      (plugin-handler/register-plugin-simple-command
        pid cmd (assoc action 0 (keyword (first action)))))))

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
      (.focus (gdom/getElement input-id)))))

(def ^:export restore_editing_cursor
  (fn []
    (when-let [input-id (state/get-edit-input-id)]
      (.focus (gdom/getElement input-id)))))

(def ^:export get_editing_cursor_position
  (fn []
    (when-let [input-id (state/get-edit-input-id)]
      (bean/->js (normalize-keyword-for-json (cursor/get-caret-pos (gdom/getElement input-id)))))))

(def ^:export get_editing_block_content
  (fn []
    (state/get-edit-content)))

(def ^:export get_current_block
  (fn []
    (let [block (state/get-edit-block)
          block (or block (state/get-last-edit-block))
          block (and block (db-utils/pull (:db/id block)))]
      (bean/->js (normalize-keyword-for-json block)))))

(def ^:export get_current_page
  (fn []
    (when-let [page (state/get-current-page)]
      (when-let [page (db-model/get-page page)]
        (bean/->js (normalize-keyword-for-json (db-utils/pull (:db/id page))))))))

(def ^:export get_page
  (fn [id-or-page-name]
    (when-let [page (cond
                      (number? id-or-page-name) (db-utils/pull id-or-page-name)
                      (string? id-or-page-name) (db-model/get-page id-or-page-name))]
      (when-not (contains? page :block/left)
        (bean/->js (normalize-keyword-for-json (db-utils/pull (:db/id page))))))))

(def ^:export get_all_pages
  (fn [repo]
    (let [pages (page-handler/get-all-pages repo)]
      (bean/->js (normalize-keyword-for-json pages)))))

(def ^:export create_page
  (fn [name ^js properties ^js opts]
    (some-> (if-let [page (db-model/get-page name)]
              page
              (let [properties (bean/->clj properties)
                    {:keys [redirect createFirstBlock format]} (bean/->clj opts)
                    name (page-handler/create!
                           name
                           {:redirect?           (if (boolean? redirect) redirect true)
                            :create-first-block? (if (boolean? createFirstBlock) createFirstBlock true)
                            :format              format
                            :properties          properties})]
                (db-model/get-page name)))
            (:db/id)
            (db-utils/pull)
            (normalize-keyword-for-json)
            (bean/->js))))

(def ^:export delete_page
  (fn [name]
    (p/create (fn [ok] (page-handler/delete! name ok)))))

(def ^:export rename_page
  page-handler/rename!)

(def ^:export edit_block
  (fn [block-uuid {:keys [pos] :or {pos :max} :as opts}]
    (when-let [block-uuid (and block-uuid (medley/uuid block-uuid))]
      (when-let [block (db-model/query-block-by-uuid block-uuid)]
        (editor-handler/edit-block! block pos nil block-uuid)))))

(def ^:export insert_block
  (fn [block-uuid-or-page-name content ^js opts]
    (let [{:keys [before sibling isPageBlock properties]} (bean/->clj opts)
          page-name (and isPageBlock block-uuid-or-page-name)
          block-uuid (if isPageBlock nil (medley/uuid block-uuid-or-page-name))
          new-block (editor-handler/api-insert-new-block!
                      content
                      {:block-uuid block-uuid
                       :sibling?   sibling
                       :before?    before
                       :page       page-name
                       :properties properties})]
      (bean/->js (normalize-keyword-for-json new-block)))))

(def ^:export insert_batch_block
  (fn [block-uuid ^js batch-blocks ^js opts]
    (when-let [block (db-model/query-block-by-uuid block-uuid)]
      (when-let [bb (bean/->clj batch-blocks)]
        (let [bb (if-not (vector? bb) (vector bb) bb)
              {:keys [sibling]} (bean/->clj opts)
              _ (editor-handler/paste-block-tree-after-target
                  (:db/id block) sibling bb (:block/format block))]
          nil)))))

(def ^:export remove_block
  (fn [block-uuid ^js opts]
    (let [includeChildren true
          repo (state/get-current-repo)]
      (editor-handler/delete-block-aux!
        {:block/uuid (medley/uuid block-uuid) :repo repo} includeChildren))))

(def ^:export update_block
  (fn [block-uuid content ^js opts]
    (let [opts (and opts (bean/->clj opts))
          repo (state/get-current-repo)
          edit-input (state/get-edit-input-id)
          editing? (and edit-input (string/ends-with? edit-input block-uuid))]
      (if editing?
        (state/set-edit-content! edit-input content)
        (editor-handler/save-block! repo (medley/uuid block-uuid) content))
      nil)))

(def ^:export move_block
  (fn [src-block-uuid target-block-uuid ^js opts]
    (let [{:keys [before children]} (bean/->clj opts)
          move-to (cond
                    (boolean before)
                    :top

                    (boolean children)
                    :nested

                    :else
                    nil)
          src-block-uuid (db-model/query-block-by-uuid (medley/uuid src-block-uuid))
          target-block-uuid (db-model/query-block-by-uuid (medley/uuid target-block-uuid))]
      (editor-dnd-handler/move-block nil src-block-uuid target-block-uuid move-to))))

(def ^:export get_block
  (fn [id-or-uuid ^js opts]
    (when-let [block (cond
                       (number? id-or-uuid) (db-utils/pull id-or-uuid)
                       (string? id-or-uuid) (db-model/query-block-by-uuid id-or-uuid))]
      (when-not (contains? block :block/name)
        (when-let [uuid (:block/uuid block)]
          (let [{:keys [includeChildren]} (bean/->clj opts)
                repo (state/get-current-repo)
                block (if (not includeChildren)
                        block (first (outliner-tree/blocks->vec-tree
                                       (db-model/get-block-and-children repo uuid) uuid)))]
            (bean/->js (normalize-keyword-for-json block))))))))

(def ^:export get_previous_sibling_block
  (fn [uuid]
    (when-let [block (db-model/query-block-by-uuid uuid)]
      (let [{:block/keys [parent left]} block
            block (when-not (= parent left) (db-utils/pull (:db/id left)))]
        (and block (bean/->js (normalize-keyword-for-json block)))))))

(def ^:export get_next_sibling_block
  (fn [uuid]
    (when-let [block (db-model/query-block-by-uuid uuid)]
      (when-let [right-siblings (outliner/get-right-siblings (outliner/->Block block))]
        (bean/->js (normalize-keyword-for-json (:data (first right-siblings))))))))

(def ^:export upsert_block_property
  (fn [block-uuid key value]
    (editor-handler/set-block-property! (medley/uuid block-uuid) key value)))

(def ^:export remove_block_property
  (fn [block-uuid key]
    (editor-handler/remove-block-property! (medley/uuid block-uuid) key)))

(def ^:export get_block_property
  (fn [block-uuid key]
    (when-let [block (db-model/query-block-by-uuid block-uuid)]
      (get (:block/properties block) (keyword key)))))

(def ^:export get_block_properties
  (fn [block-uuid]
    (when-let [block (db-model/query-block-by-uuid block-uuid)]
      (bean/->js (normalize-keyword-for-json (:block/properties block))))))

(def ^:export get_current_page_blocks_tree
  (fn []
    (when-let [page (state/get-current-page)]
      (let [blocks (db-model/get-page-blocks-no-cache page)
            blocks (outliner-tree/blocks->vec-tree blocks page)
            ;; clean key
            blocks (normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

(def ^:export get_page_blocks_tree
  (fn [page-name]
    (when-let [_ (db-model/get-page page-name)]
      (let [blocks (db-model/get-page-blocks-no-cache page-name)
            blocks (outliner-tree/blocks->vec-tree blocks page-name)
            blocks (normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

;; plugins
(def ^:export __install_plugin
  (fn [^js manifest]
    (when-let [{:keys [repo id] :as mft} (bean/->clj manifest)]
      (if-not (and repo id)
        (throw (js/Error. "[required] :repo :id"))
        (plugin-handler/install-marketplace-plugin mft)))))

;; db
(defn ^:export q
  [query-string]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (db/get-conn repo)]
      (when-let [result (query-dsl/query repo query-string)]
        (bean/->js (normalize-keyword-for-json (flatten @result)))))))

(defn ^:export datascript_query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (db/get-conn repo)]
      (let [query (cljs.reader/read-string query)
            result (apply d/q query conn inputs)]
        (clj->js result)))))

(def ^:export custom_query db/custom-query)

(defn ^:export download_graph_db
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [db (db/get-conn repo)]
      (let [db-str (if db (db/db->string db) "")
            data-str (str "data:text/edn;charset=utf-8," (js/encodeURIComponent db-str))]
        (when-let [anchor (gdom/getElement "download")]
          (.setAttribute anchor "href" data-str)
          (.setAttribute anchor "download" (str (string/replace repo "/" " ") ".transit"))
          (.click anchor))))))

(defn ^:export download_graph_pages
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-zip! repo)))

;; helpers
(defn ^:export show_msg
  ([content] (show_msg content :success))
  ([content status] (let [hiccup? (and (string? content) (string/starts-with? (string/triml content) "[:"))
                          content (if hiccup? (parse-hiccup-ui content) content)]
                      (notification/show! content (keyword status)))))
